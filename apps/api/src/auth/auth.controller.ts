import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { AuthService } from "./auth.service.js";
import { LoginDto, SignupDto } from "./auth.dto.js";
import {
  CurrentTenant,
  Public,
  RequirePermissions,
} from "./auth.decorators.js";
import type { TenantContext } from "./auth.types.js";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Public()
  @Post("signup")
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  signup(@Body() input: SignupDto) {
    return this.auth.signup(input);
  }
  @Public()
  @Post("login")
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  login(@Body() input: LoginDto) {
    return this.auth.login(input);
  }
  @Get("me")
  @ApiBearerAuth()
  @RequirePermissions("profile:read")
  me(@CurrentTenant() tenant: TenantContext) {
    return this.auth.me(tenant);
  }
}
