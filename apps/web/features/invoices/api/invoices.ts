import type { WorkspaceApi } from "../../../lib/api";
import type {
  CreateInvoicePayload,
  CreatedInvoice,
} from "../types/invoice.types";
export function createInvoice(api: WorkspaceApi, input: CreateInvoicePayload) {
  return api<CreatedInvoice>("/invoices", { method: "POST", body: input });
}
// The existing dashboard fetches lists on mount; this retained server result makes
// the saved draft visible even when UUID sorting places it on a later list page.
let recent: CreatedInvoice | null = null;
export function rememberCreatedInvoice(invoice: CreatedInvoice) {
  recent = invoice;
}
export function recentlyCreatedInvoice(organizationId: string) {
  return recent?.organizationId === organizationId ? recent : null;
}
