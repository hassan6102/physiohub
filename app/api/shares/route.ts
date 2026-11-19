import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { errorResponse, HttpError, json, rateLimit, requireUser } from "@/lib/server/http";
import { hashPin, hashToken, newToken } from "@/lib/server/shares";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  planId: z.string().min(1).max(100),
  expiresInDays: z.number().int().min(1).max(365).nullable(),
  pin: z.string().regex(/^\d{4,8}$/).nullable(),
});

/** Creates a share link for a published plan owned by the signed-in doctor. */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    rateLimit(`share-create:${user.uid}`, 30, 60_000);
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "بيانات غير صحيحة. رمز التحقق يتكون من 4 إلى 8 أرقام.");
    const { planId, expiresInDays, pin } = parsed.data;

    const db = adminDb();
    const planSnap = await db.doc(`doctors/${user.uid}/treatmentPlans/${planId}`).get();
    if (!planSnap.exists) throw new HttpError(404, "البرنامج غير موجود.");
    const plan = planSnap.data()!;
    if (plan.status !== "published") throw new HttpError(400, "انشر البرنامج أولًا قبل مشاركته.");
    if (!Array.isArray(plan.exercises) || plan.exercises.length === 0) throw new HttpError(400, "أضف تمرينًا واحدًا على الأقل.");

    const token = newToken();
    const id = hashToken(token);
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 86_400_000) : null;

    const batch = db.batch();
    // The link record contains no patient data, only the plan reference and status.
    batch.set(db.doc(`sharedPrograms/${id}`), {
      doctorId: user.uid,
      planId,
      planTitle: plan.title ?? "",
      createdAt: FieldValue.serverTimestamp(),
      expiresAt,
      revoked: false,
      revokedAt: null,
      hasPin: Boolean(pin),
    });
    if (pin) {
      const { salt, hash } = hashPin(pin);
      batch.set(db.doc(`sharedSecrets/${id}`), { pinSalt: salt, pinHash: hash, failedAttempts: 0, lockedUntil: null });
    }
    await batch.commit();
    return json({ id, token }, 201);
  } catch (e) {
    return errorResponse(e);
  }
}
