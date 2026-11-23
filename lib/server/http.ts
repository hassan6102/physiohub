import "server-only";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

export class HttpError extends Error {
  constructor(public status: number, message: string, public extra?: Record<string, unknown>) {
    super(message);
  }
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function errorResponse(e: unknown) {
  if (e instanceof HttpError) return json({ error: e.message, ...(e.extra ?? {}) }, e.status);
  // Never log request bodies or medical data; only the error message.
  console.error("api error:", (e as Error)?.message);
  return json({ error: "حدث خطأ في الخادم، حاول مرة أخرى." }, 500);
}

export async function requireUser(req: Request) {
  const match = (req.headers.get("authorization") ?? "").match(/^Bearer (.+)$/);
  if (!match) throw new HttpError(401, "يلزم تسجيل الدخول.");
  try {
    const decoded = await adminAuth().verifyIdToken(match[1], true);
    if (decoded.disabled === true) throw new HttpError(403, "هذا الحساب معطّل.");
    return decoded;
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(401, "انتهت الجلسة، سجّل الدخول مرة أخرى.");
  }
}

/** Admin rights come only from the `admin` custom claim set through the Admin SDK. */
export async function requireAdmin(req: Request) {
  const user = await requireUser(req);
  if (user.admin !== true) throw new HttpError(403, "غير مصرح لك بهذا الإجراء.");
  return user;
}

export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
}

/**
 * Best-effort in-memory limiter. On serverless platforms each instance has its own memory,
 * so this only slows casual abuse; use a shared store (e.g. Upstash/Redis) for strict limits.
 */
const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    return;
  }
  b.count += 1;
  if (b.count > max) throw new HttpError(429, "محاولات كثيرة، انتظر قليلًا ثم حاول مرة أخرى.");
}
