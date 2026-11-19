import { getClientAuth } from "@/lib/firebase/client";

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: unknown) {
    super(message);
  }
}

/** Calls our own server routes with the signed-in doctor's ID token. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const user = getClientAuth().currentUser;
  if (!user) throw new Error("auth/not-signed-in");
  const token = await user.getIdToken();
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? "حدث خطأ غير متوقع", data);
  return data as T;
}
