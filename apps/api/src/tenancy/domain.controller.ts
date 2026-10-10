import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RequirePermissions } from "../auth/auth.decorators.js";
import { PageDto } from "./page.dto.js";
import { TenantDatabaseService } from "./tenant-database.service.js";

@ApiTags("financial records")
@ApiBearerAuth()
@Controller()
export class DomainController {
  constructor(private readonly tenants: TenantDatabaseService) {}
  @Get("expenses")
  @RequirePermissions("expenses:read")
  expenses(@Query() page: PageDto) {
    return this.tenants.listExpenses(page);
  }
  @Get("retainers")
  @RequirePermissions("retainers:read")
  retainers(@Query() page: PageDto) {
    return this.tenants.listRetainers(page);
  }
}
