import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { errorResponse, HttpError, json, requireUser } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Revokes a link. Only the doctor who created it can do this. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    if (!/^[a-f0-9]{64}$/.test(id)) throw new HttpError(404, "الرابط غير موجود.");
    const ref = adminDb().doc(`sharedPrograms/${id}`);
    const snap = await ref.get();
    if (!snap.exists || snap.data()?.doctorId !== user.uid) throw new HttpError(404, "الرابط غير موجود.");
    await ref.update({ revoked: true, revokedAt: FieldValue.serverTimestamp() });
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
