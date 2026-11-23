import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { errorResponse, HttpError, json, rateLimit, requireUser } from "@/lib/server/http";
import { setMembershipClaims } from "@/lib/server/clinic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  clinicName: z.string().trim().min(2).max(120),
  fullName: z.string().trim().min(2).max(120),
  specialty: z.string().trim().max(120).default(""),
  phone: z.string().trim().max(40).default(""),
  /** the manager also treats patients and can be assigned patients */
  practicing: z.boolean().default(true),
});

/**
 * Creates a clinic and makes the signed-in user its manager. Accounts that already belong to a
 * clinic are rejected: a user works in exactly one clinic.
 */
export async function POST(req: Request) {
  try {
    const token = await requireUser(req);
    rateLimit(`clinic-create:${token.uid}`, 5, 60_000);
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "بيانات غير صحيحة.");
    const { clinicName, fullName, specialty, phone, practicing } = parsed.data;

    const db = adminDb();
    const userRef = db.doc(`users/${token.uid}`);
    const existing = (await userRef.get()).data();
    if (existing?.clinicId) throw new HttpError(409, "حسابك مرتبط بعيادة بالفعل.");

    const authUser = await adminAuth().getUser(token.uid);
    const clinicRef = db.collection("clinics").doc();
    const batch = db.batch();
    batch.set(clinicRef, {
      name: clinicName,
      logoUrl: "",
      phone,
      email: authUser.email ?? "",
      address: "",
      createdBy: token.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    batch.set(
      userRef,
      {
        uid: token.uid,
        fullName,
        specialty,
        phone,
        email: authUser.email ?? "",
        clinicId: clinicRef.id,
        role: "manager",
        practicing,
        status: "active",
        createdAt: existing?.createdAt ?? FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    await batch.commit();
    await setMembershipClaims(token.uid, clinicRef.id, "manager");
    return json({ clinicId: clinicRef.id }, 201);
  } catch (e) {
    return errorResponse(e);
  }
}
