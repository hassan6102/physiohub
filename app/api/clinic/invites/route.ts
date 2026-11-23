import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { errorResponse, HttpError, json, rateLimit } from "@/lib/server/http";
import { normEmail, requireManager } from "@/lib/server/clinic";
import { hashToken, newToken } from "@/lib/server/shares";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().trim().email().max(200),
  fullName: z.string().trim().min(2).max(120),
  specialty: z.string().trim().max(120).default(""),
});

const INVITE_DAYS = 7;

/** Manager invites a doctor. The secret link is returned once; only its hash is stored. */
export async function POST(req: Request) {
  try {
    const manager = await requireManager(req);
    rateLimit(`invite:${manager.uid}`, 30, 60_000);
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, "أدخل اسم الدكتور وبريدًا إلكترونيًا صحيحًا.");
    const email = normEmail(parsed.data.email);

    const db = adminDb();
    // A user belongs to one clinic only: refuse if the e-mail already has an account in a clinic.
    const existing = await adminAuth().getUserByEmail(email).catch(() => null);
    if (existing) {
      const profile = (await db.doc(`users/${existing.uid}`).get()).data();
      if (profile?.clinicId) throw new HttpError(409, "هذا البريد مرتبط بعيادة بالفعل.");
    }

    const token = newToken();
    const id = hashToken(token);
    await db.doc(`invites/${id}`).set({
      clinicId: manager.clinicId,
      email,
      fullName: parsed.data.fullName,
      specialty: parsed.data.specialty,
      role: "doctor",
      status: "pending",
      createdBy: manager.uid,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000),
    });
    return json({ id, token }, 201);
  } catch (e) {
    return errorResponse(e);
  }
}
