import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  canAssignRole,
  isRole,
  permissionsFor,
  type Role,
} from "@hisab/permissions";
import { DATABASE } from "../database.module.js";
import type { Database } from "../database/client.js";
import type { CreateMemberDto, LoginDto, SignupDto } from "./auth.dto.js";
import type { TenantContext } from "./auth.types.js";
import { hashPassword, verifyPassword } from "./password.js";

const DUMMY_HASH = `scrypt:32768:8:1:${"0".repeat(32)}:${"0".repeat(128)}`;
@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly jwt: JwtService,
  ) {}

  async signup(input: SignupDto) {
    const passwordHash = await hashPassword(input.password);
    let tenant: TenantContext;
    try {
      tenant = await this.db.transaction(async (tx) => {
        const organization = await tx.orm.public.Organization.create({
          name: input.organizationName.trim(),
          slug: input.organizationSlug,
        });
        const user = await tx.orm.public.User.create({
          organizationId: organization.id,
          email: input.email,
          fullName: input.fullName.trim(),
          passwordHash,
        });
        await tx.orm.public.Membership.create({
          organizationId: organization.id,
          userId: user.id,
          role: "OWNER",
        });
        return {
          organizationId: organization.id,
          userId: user.id,
          role: "OWNER" as const,
        };
      });
    } catch (error) {
      if (
        await this.db.orm.public.Organization.where({
          slug: input.organizationSlug,
        })
          .select("id")
          .first()
      ) {
        throw new ConflictException("Organization slug is already taken");
      }
      throw error;
    }
    return this.session(tenant);
  }

  async login(input: LoginDto) {
    const organization = await this.db.orm.public.Organization.where({
      slug: input.organizationSlug,
    })
      .select("id")
      .first();
    const user = organization
      ? await this.db.orm.public.User.where({
          organizationId: organization.id,
          email: input.email,
        }).first()
      : null;
    const valid = await verifyPassword(
      input.password,
      user?.passwordHash ?? DUMMY_HASH,
    );
    if (!valid || !organization || !user)
      throw new UnauthorizedException("Invalid credentials");
    const membership = await this.db.orm.public.Membership.where({
      organizationId: organization.id,
      userId: user.id,
    }).first();
    if (!membership || !isRole(membership.role))
      throw new UnauthorizedException("Invalid credentials");
    return this.session({
      organizationId: organization.id,
      userId: user.id,
      role: membership.role,
    });
  }

  async me(tenant: TenantContext) {
    const user = await this.db.orm.public.User.where({
      id: tenant.userId,
      organizationId: tenant.organizationId,
    })
      .select("id", "email", "fullName", "avatarUrl")
      .first();
    const organization = await this.db.orm.public.Organization.where({
      id: tenant.organizationId,
    })
      .select("id", "name", "slug", "currency")
      .first();
    if (!user || !organization) throw new UnauthorizedException();
    return {
      user,
      organization,
      role: tenant.role,
      permissions: permissionsFor(tenant.role),
    };
  }

  async createMember(tenant: TenantContext, input: CreateMemberDto) {
    if (!canAssignRole(tenant.role, input.role))
      throw new ForbiddenException("You cannot assign this role");
    const passwordHash = await hashPassword(input.password);
    try {
      return await this.db.transaction(async (tx) => {
        const user = await tx.orm.public.User.select(
          "id",
          "email",
          "fullName",
        ).create({
          organizationId: tenant.organizationId,
          email: input.email,
          fullName: input.fullName.trim(),
          passwordHash,
        });
        await tx.orm.public.Membership.create({
          organizationId: tenant.organizationId,
          userId: user.id,
          role: input.role,
        });
        return { user, role: input.role };
      });
    } catch (error) {
      if (
        await this.db.orm.public.User.where({
          organizationId: tenant.organizationId,
          email: input.email,
        })
          .select("id")
          .first()
      ) {
        throw new ConflictException(
          "Email is already registered in this organization",
        );
      }
      throw error;
    }
  }

  async updateMemberRole(tenant: TenantContext, userId: string, role: Role) {
    if (!canAssignRole(tenant.role, role))
      throw new ForbiddenException("You cannot assign this role");
    // Include the allowed prior roles in the mutation predicate as well, avoiding an unchecked read/write gap.
    const allowed =
      tenant.role === "OWNER"
        ? (["ADMIN", "PROJECT_MANAGER", "FINANCE_VIEWER"] as const)
        : (["PROJECT_MANAGER", "FINANCE_VIEWER"] as const);
    const membership = await this.db.orm.public.Membership.where({
      organizationId: tenant.organizationId,
      userId,
    })
      .select("id", "role")
      .first();
    if (!membership) throw new NotFoundException("Member not found");
    if (!(allowed as readonly string[]).includes(membership.role))
      throw new ForbiddenException("You cannot change this member's role");
    const updated = await this.db.orm.public.Membership.where({
      organizationId: tenant.organizationId,
      userId,
    })
      .where((member) => member.role.in([...allowed]))
      .select("id", "userId", "role")
      .update({ role });
    if (!updated)
      throw new ForbiddenException("Member role changed; try again");
    return updated;
  }

  private async session(tenant: TenantContext) {
    const accessToken = await this.jwt.signAsync({
      sub: tenant.userId,
      organizationId: tenant.organizationId,
    });
    return {
      accessToken,
      tokenType: "Bearer",
      expiresIn: 900,
      ...(await this.me(tenant)),
    };
  }
}
