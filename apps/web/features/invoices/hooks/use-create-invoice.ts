"use client";
import { useRef, useState } from "react";
import type { WorkspaceApi } from "../../../lib/api";
import { createInvoice, rememberCreatedInvoice } from "../api/invoices";
import type { CreateInvoicePayload } from "../types/invoice.types";
import { submissionGate } from "./submission-gate";
export function useCreateInvoice(api: WorkspaceApi) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const completed = useRef(false);
  const gate = useRef(submissionGate());
  async function save(input: CreateInvoicePayload) {
    if (completed.current) return undefined;
    return gate.current(async () => {
      setSaving(true);
      try {
        const invoice = await createInvoice(api, input);
        rememberCreatedInvoice(invoice);
        completed.current = true;
        setSaved(true);
        return invoice;
      } finally {
        setSaving(false);
      }
    });
  }
  return { save, saving: saving || saved };
}
