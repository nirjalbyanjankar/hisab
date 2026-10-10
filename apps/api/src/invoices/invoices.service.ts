import { randomUUID } from "node:crypto";
import {
  Inject,
  Injectable,
  NotFoundException,
  Scope,
  UnauthorizedException,
} from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { DATABASE } from "../database.module.js";
import type { Database } from "../database/client.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import type { PageDto } from "../tenancy/page.dto.js";
import type { CreateInvoiceDto } from "./dto/create-invoice.dto.js";
import { calculateInvoice } from "./utils/invoice-calculations.js";
import { invoiceDates } from "./utils/invoice-dates.js";
@Injectable({ scope: Scope.REQUEST })
export class InvoicesService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(REQUEST) private readonly request: AuthenticatedRequest,
  ) {}
  private get organizationId() {
    if (!this.request.auth) throw new UnauthorizedException();
    return this.request.auth.organizationId;
  }
  async createInvoice(input: CreateInvoiceDto) {
    const organizationId = this.organizationId;
    const calculated = calculateInvoice(input.items);
    const dates = invoiceDates(input.issueDate, input.dueDate);
    return this.db.transaction(async (tx) => {
      const client = await tx.orm.public.Client.where({
        organizationId,
        id: input.clientId,
      })
        .select("id")
        .first();
      if (!client) throw new NotFoundException("Client not found");
      // UUID-based numbering avoids counters, scans and read/write races. The
      // existing per-organization unique constraint is the final DB safeguard.
      const invoice = await tx.orm.public.Invoice.create({
        organizationId,
        clientId: client.id,
        invoiceNumber: `INV-${randomUUID()}`,
        status: "DRAFT",
        ...dates,
        subtotal: calculated.subtotal,
        tax: calculated.tax,
        total: calculated.total,
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      });
      const items = [];
      for (const item of calculated.items) {
        items.push(
          await tx.orm.public.InvoiceItem.create({
            organizationId,
            invoiceId: invoice.id,
            ...item,
          }),
        );
      }
      return { ...invoice, items };
    });
  }

  listInvoices(page: PageDto) {
    return this.db.orm.public.Invoice.where({
      organizationId: this.organizationId,
    })
      .orderBy((row) => row.id.asc())
      .limit(page.limit)
      .offset(page.offset)
      .all();
  }
  async listInvoiceItems(invoiceId: string, page: PageDto) {
    const invoice = await this.db.orm.public.Invoice.where({
      organizationId: this.organizationId,
      id: invoiceId,
    })
      .select("id")
      .first();
    if (!invoice) throw new NotFoundException("Invoice not found");
    return this.db.orm.public.InvoiceItem.where({
      organizationId: this.organizationId,
      invoiceId,
    })
      .orderBy((row) => row.id.asc())
      .limit(page.limit)
      .offset(page.offset)
      .all();
  }
}
