import "server-only";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { DocumentData, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { PortalPlan } from "@/types/models";
import { HttpError } from "./http";

/** 32 random bytes => 43 URL-safe characters. Impossible to guess. */
export const newToken = () => randomBytes(32).toString("base64url");
export const isValidToken = (t: string) => /^[A-Za-z0-9_-]{43}$/.test(t);
/** Only this hash is stored; the token itself exists only in the link given to the patient. */
export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export function hashPin(pin: string) {
  const salt = randomBytes(16).toString("hex");
  return { salt, hash: scryptSync(pin, salt, 32).toString("hex") };
}

function verifyPin(pin: string, salt: string, hash: string) {
  const a = scryptSync(pin, salt, 32);
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

const toDate = (v: unknown): Date | null => (v && typeof (v as Timestamp).toDate === "function" ? (v as Timestamp).toDate() : null);

const MAX_FAILED = 5;
const LOCK_MS = 15 * 60_000;

export type LoadedShare = { id: string; doctorId: string; planId: string; plan: PortalPlan; exerciseKeys: Set<string> };

/**
 * Validates a patient link: format, existence, revoked/expired, doctor still active, optional PIN.
 * Everything is enforced here on the server; the browser is never trusted.
 */
export async function loadShare(token: string, pin: string | null): Promise<LoadedShare> {
  if (!isValidToken(token)) throw new HttpError(404, "هذا الرابط غير صالح.");
  const db = adminDb();
  const id = hashToken(token);
  const shareSnap = await db.doc(`sharedPrograms/${id}`).get();
  if (!shareSnap.exists) throw new HttpError(404, "هذا الرابط غير صالح.");
  const share = shareSnap.data() as DocumentData;

  if (share.revoked) throw new HttpError(410, "تم إلغاء هذا الرابط من قبل الأخصائي.");
  const expiresAt = toDate(share.expiresAt);
  if (expiresAt && expiresAt.getTime() < Date.now()) throw new HttpError(410, "انتهت صلاحية هذا الرابط.");

  if (share.hasPin) {
    const secretRef = db.doc(`sharedSecrets/${id}`);
    const secret = (await secretRef.get()).data() as DocumentData | undefined;
    if (!secret) throw new HttpError(500, "تعذر التحقق من الرابط.");
    const lockedUntil = toDate(secret.lockedUntil);
    if (lockedUntil && lockedUntil.getTime() > Date.now())
      throw new HttpError(429, "تم تعليق المحاولات مؤقتًا بسبب إدخال رمز خاطئ. حاول لاحقًا.", { requiresPin: true });
    if (!pin) throw new HttpError(401, "أدخل رمز التحقق.", { requiresPin: true });
    if (!/^\d{4,8}$/.test(pin) || !verifyPin(pin, secret.pinSalt, secret.pinHash)) {
      const failed = (secret.failedAttempts ?? 0) + 1;
      await secretRef.update({
        failedAttempts: failed >= MAX_FAILED ? 0 : failed,
        lockedUntil: failed >= MAX_FAILED ? new Date(Date.now() + LOCK_MS) : null,
      });
      throw new HttpError(401, "رمز التحقق غير صحيح.", { requiresPin: true });
    }
    if (secret.failedAttempts) await secretRef.update({ failedAttempts: 0, lockedUntil: null });
  }

  const doctorId = share.doctorId as string;
  const planId = share.planId as string;
  const [planSnap, userSnap] = await Promise.all([
    db.doc(`doctors/${doctorId}/treatmentPlans/${planId}`).get(),
    db.doc(`users/${doctorId}`).get(),
  ]);
  const plan = planSnap.data() as DocumentData | undefined;
  const user = userSnap.data() as DocumentData | undefined;
  if (!plan || plan.status !== "published" || user?.status === "disabled")
    throw new HttpError(410, "هذا البرنامج غير متاح حاليًا.");

  const portal: PortalPlan = {
    title: plan.title ?? "",
    goal: plan.goal ?? "",
    instructions: plan.instructions ?? "",
    startDate: toDate(plan.startDate)?.toISOString() ?? null,
    endDate: toDate(plan.endDate)?.toISOString() ?? null,
    doctorName: user?.fullName ?? "",
    clinicName: user?.clinicName ?? "",
    // Only exercise content and dosage. No patient identity, no private notes.
    exercises: ((plan.exercises ?? []) as DocumentData[]).map((e) => ({
      key: e.key,
      nameAr: e.snapshot?.nameAr ?? "",
      description: e.snapshot?.description ?? "",
      steps: e.snapshot?.steps ?? [],
      youtubeId: e.snapshot?.youtubeId ?? null,
      imageUrl: e.snapshot?.imageUrl ?? "",
      level: e.snapshot?.level ?? "beginner",
      warnings: e.snapshot?.warnings ?? "",
      dosage: e.dosage,
    })),
  };

  return { id, doctorId, planId, plan: portal, exerciseKeys: new Set(portal.exercises.map((e) => e.key)) };
}
