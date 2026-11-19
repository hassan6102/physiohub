import "server-only";
import { NextResponse } from "next/server";
import { AdminConfigError, adminAuth } from "@/lib/firebase/admin";

const isDev = process.env.NODE_ENV !== "production";

const AUTH_TOKEN_ERROR_CODES = new Set([
  "auth/id-token-expired",
  "auth/id-token-revoked",
  "auth/argument-error",
  "auth/invalid-id-token",
  "auth/user-not-found",
  "auth/session-cookie-expired",
  "auth/session-cookie-revoked",
]);

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

  if (e instanceof AdminConfigError) {
    // Log only the configuration diagnostic (never keys, tokens, or patient data).
    console.error("firebase admin config error:", e.message);
    return json(
      {
        error: isDev
          ? "إعدادات Firebase Admin غير مكتملة أو غير صالحة في الخادم. راجع Terminal للتفاصيل."
          : "حدث خطأ في الخادم، حاول مرة أخرى.",
      },
      500
    );
  }

  // Never log request bodies, tokens, or medical data; only error code and message.
  const err = e as { code?: string; message?: string } | undefined;
  if (isDev) {
    console.error("api error:", { code: err?.code ?? "unknown", message: err?.message ?? "Unknown error" });
  } else {
    console.error("api error:", err?.code ?? err?.message ?? "unknown");
  }
  return json({ error: "حدث خطأ في الخادم، حاول مرة أخرى." }, 500);
}

export async function requireUser(req: Request) {
  const match = (req.headers.get("authorization") ?? "").match(/^Bearer (.+)$/);
  if (!match) throw new HttpError(401, "يلزم تسجيل الدخول.");

  // Keep Admin SDK initialization outside token error handling so config failures return 500, not 401.
  const auth = adminAuth();

  try {
    const decoded = await auth.verifyIdToken(match[1], true);
    if (decoded.disabled === true) throw new HttpError(403, "هذا الحساب معطّل.");
    return decoded;
  } catch (e) {
    if (e instanceof HttpError || e instanceof AdminConfigError) throw e;
    const code = typeof (e as { code?: unknown })?.code === "string" ? (e as { code: string }).code : "";
    if (code === "auth/user-disabled") {
      throw new HttpError(403, "هذا الحساب معطّل.");
    }
    if (AUTH_TOKEN_ERROR_CODES.has(code)) {
      if (isDev) {
        console.error("requireUser auth error:", { code, message: (e as Error)?.message ?? "Invalid token" });
      }
      throw new HttpError(401, "انتهت الجلسة، سجّل الدخول مرة أخرى.");
    }
    // Unexpected server/Admin SDK error -> propagate so errorResponse returns 500 and logs it.
    throw e;
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
