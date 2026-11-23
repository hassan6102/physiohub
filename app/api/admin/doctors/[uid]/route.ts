import { z } from "zod";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { errorResponse, HttpError, json, requireAdmin } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ disabled: z.boolean() });

/** Enables or disables a doctor account. Verified against the caller's `admin` claim on the server. */
export async function PATCH(req: Request, { params }: { params: Promise<{ uid: string }> }) {
  try {
    const admin = await requireAdmin(req);
    const { uid } = await params;
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "بيانات غير صحيحة.");
    if (uid === admin.uid) throw new HttpError(400, "لا يمكنك تعطيل حسابك الخاص.");

    const auth = adminAuth();
    const target = await auth.getUser(uid).catch(() => null);
    if (!target) throw new HttpError(404, "الحساب غير موجود.");

    const { disabled } = parsed.data;
    await auth.updateUser(uid, { disabled });
    // The `disabled` claim lets Security Rules block data access even for tokens issued before the change.
    await auth.setCustomUserClaims(uid, { ...(target.customClaims ?? {}), disabled });
    if (disabled) await auth.revokeRefreshTokens(uid);
    await adminDb().doc(`users/${uid}`).set({ status: disabled ? "disabled" : "active" }, { merge: true });
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
