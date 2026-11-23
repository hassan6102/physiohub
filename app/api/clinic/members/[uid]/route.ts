import { z } from "zod";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { errorResponse, HttpError, json } from "@/lib/server/http";
import { requireManager } from "@/lib/server/clinic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    disabled: z.boolean().optional(),
    fullName: z.string().trim().min(2).max(120).optional(),
    specialty: z.string().trim().max(120).optional(),
    phone: z.string().trim().max(40).optional(),
  })
  .strict();

/** Manager edits a doctor of the SAME clinic, or suspends/reactivates that membership. */
export async function PATCH(req: Request, { params }: { params: Promise<{ uid: string }> }) {
  try {
    const manager = await requireManager(req);
    const { uid } = await params;
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "بيانات غير صحيحة.");
    if (uid === manager.uid) throw new HttpError(400, "لا يمكنك تعديل عضويتك من هنا.");

    const db = adminDb();
    const ref = db.doc(`users/${uid}`);
    const target = (await ref.get()).data();
    // Same clinic only; managers cannot touch other managers.
    if (!target || target.clinicId !== manager.clinicId) throw new HttpError(404, "الدكتور غير موجود في عيادتك.");
    if (target.role !== "doctor") throw new HttpError(403, "لا يمكن تعديل مدير آخر.");

    const { disabled, ...fields } = parsed.data;
    const update: Record<string, unknown> = { ...fields };
    if (disabled !== undefined) {
      const auth = adminAuth();
      const authUser = await auth.getUser(uid);
      await auth.updateUser(uid, { disabled });
      // The `disabled` claim makes Security Rules refuse even tokens issued before the change.
      await auth.setCustomUserClaims(uid, { ...(authUser.customClaims ?? {}), disabled });
      if (disabled) await auth.revokeRefreshTokens(uid);
      update.status = disabled ? "disabled" : "active";
    }
    if (fields.fullName) await adminAuth().updateUser(uid, { displayName: fields.fullName });
    if (Object.keys(update).length) await ref.update(update);
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
