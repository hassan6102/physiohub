import { apiFetch } from "@/lib/api-client";

export type CreateShareInput = {
  planId: string;
  /** null = never expires */
  expiresInDays: number | null;
  /** optional 4-8 digit verification code */
  pin: string | null;
};

/**
 * The server returns the secret token ONCE. Only its hash is stored, so the link cannot be
 * shown again later; create a new link if it is lost.
 */
export async function createShare(input: CreateShareInput) {
  const res = await apiFetch<{ id: string; token: string }>("/api/shares", { method: "POST", body: JSON.stringify(input) });
  return { id: res.id, url: `${window.location.origin}/p/${res.token}` };
}

export async function revokeShare(id: string) {
  await apiFetch(`/api/shares/${id}`, { method: "PATCH", body: JSON.stringify({ revoked: true }) });
}
