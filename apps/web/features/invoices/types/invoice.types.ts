import type { FinancialRecord, InvoiceItem } from "../../../lib/api";
export interface InvoiceLine {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
}
export interface InvoiceDraft {
  clientId: string;
  issueDate: string;
  dueDate: string;
  notes: string;
  items: InvoiceLine[];
}
export interface CreateInvoicePayload {
  clientId: string;
  issueDate: string;
  dueDate: string;
  notes?: string;
  items: { description: string; quantity: number; unitPrice: string }[];
}
export interface CreatedInvoice extends FinancialRecord {
  organizationId: string;
  invoiceNumber: string;
  status: "DRAFT";
  subtotal: string;
  tax: string;
  total: string;
  items: InvoiceItem[];
}
