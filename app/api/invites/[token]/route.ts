import { adminDb } from "@/lib/firebase/admin";
import { clientIp, errorResponse, HttpError, json, rateLimit } from "@/lib/server/http";
import { hashToken, isValidToken } from "@/lib/server/shares";
import type { Timestamp } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public: what the invitation page needs to show (clinic name and the invited e-mail only). */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    rateLimit(`invite-info:${clientIp(req)}`, 30, 60_000);
    const { token } = await params;
    if (!isValidToken(token)) throw new HttpError(404, "هذه الدعوة غير صالحة.");
    const db = adminDb();
    const invite = (await db.doc(`invites/${hashToken(token)}`).get()).data();
    if (!invite) throw new HttpError(404, "هذه الدعوة غير صالحة.");
    if (invite.status !== "pending") throw new HttpError(410, "تم استخدام هذه الدعوة أو إلغاؤها.");
    if ((invite.expiresAt as Timestamp).toDate().getTime() < Date.now()) throw new HttpError(410, "انتهت صلاحية الدعوة.");
    const clinic = (await db.doc(`clinics/${invite.clinicId}`).get()).data();
    return json({ clinicName: clinic?.name ?? "", email: invite.email, fullName: invite.fullName });
  } catch (e) {
    return errorResponse(e);
  }
}
