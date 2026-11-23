import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { errorResponse, HttpError, json } from "@/lib/server/http";
import { requireMember } from "@/lib/server/clinic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Revokes a link. Allowed for the doctor responsible for the plan and for the clinic manager. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireMember(req);
    const { id } = await params;
    if (!/^[a-f0-9]{64}$/.test(id)) throw new HttpError(404, "الرابط غير موجود.");
    const ref = adminDb().doc(`sharedPrograms/${id}`);
    const snap = await ref.get();
    const share = snap.data();
    const allowed = share && share.clinicId === user.clinicId && (user.role === "manager" || share.assignedDoctorId === user.uid);
    if (!allowed) throw new HttpError(404, "الرابط غير موجود.");
    await ref.update({ revoked: true, revokedAt: FieldValue.serverTimestamp() });
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
