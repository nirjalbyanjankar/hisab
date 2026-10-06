import type { Permission, Role } from "@hisab/permissions";

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1"
).replace(/\/$/, "");
export interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
}
export interface Profile {
  user: User;
  organization: { id: string; name: string; slug: string; currency: string };
  role: Role;
  permissions: Permission[];
}
export interface Session extends Profile {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}
export interface Client {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  taxId: string | null;
}
export interface Member {
  id: string;
  userId: string;
  role: Role;
  user: User | null;
}
export interface FinancialRecord {
  id: string;
  invoiceNumber?: string;
  title?: string;
  clientName?: string;
  status?: string;
  active?: boolean;
  total?: string;
  amount?: string;
  monthlyAmount?: string;
  dueDate?: string;
  date?: string;
  billingDay?: number;
}
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
  amount: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}
export async function apiRequest<T>(
  path: string,
  options: {
    token?: string;
    method?: string;
    body?: unknown;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      cache: "no-store",
      signal: options.signal,
      headers: {
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiError(
      "Cannot reach the API. Check that the backend is running and try again.",
      0,
    );
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(body?.message)
      ? body.message.join(" · ")
      : typeof body?.message === "string"
        ? body.message
        : "Request failed. Please try again.";
    throw new ApiError(
      response.status === 429
        ? "Too many attempts. Please wait a minute before trying again."
        : message,
      response.status,
    );
  }
  return body as T;
}
export const roleLabel = (role: Role) =>
  role
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
export const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
