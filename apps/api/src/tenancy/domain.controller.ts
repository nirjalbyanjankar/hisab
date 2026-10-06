import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RequirePermissions } from "../auth/auth.decorators.js";
import { PageDto } from "./page.dto.js";
import { TenantDatabaseService } from "./tenant-database.service.js";

@ApiTags("financial records")
@ApiBearerAuth()
@Controller()
export class DomainController {
  constructor(private readonly tenants: TenantDatabaseService) {}
  @Get("invoices")
  @RequirePermissions("invoices:read")
  invoices(@Query() page: PageDto) {
    return this.tenants.listInvoices(page);
  }
  @Get("invoices/:invoiceId/items")
  @RequirePermissions("invoices:read")
  items(@Param("invoiceId", ParseUUIDPipe) id: string, @Query() page: PageDto) {
    return this.tenants.listInvoiceItems(id, page);
  }
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
