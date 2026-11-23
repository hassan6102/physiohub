import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { errorResponse, HttpError, json, rateLimit, requireUser } from "@/lib/server/http";
import { normEmail, setMembershipClaims } from "@/lib/server/clinic";
import { hashToken, isValidToken } from "@/lib/server/shares";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Accepts an invitation. The caller must be signed in with the invited e-mail address, and must not
 * already belong to a clinic. The role always comes from the invitation, never from the request.
 */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const user = await requireUser(req);
    rateLimit(`invite-accept:${user.uid}`, 10, 60_000);
    const { token } = await params;
    if (!isValidToken(token)) throw new HttpError(404, "هذه الدعوة غير صالحة.");

    const db = adminDb();
    const inviteRef = db.doc(`invites/${hashToken(token)}`);
    const userRef = db.doc(`users/${user.uid}`);
    const authUser = await adminAuth().getUser(user.uid);

    await db.runTransaction(async (tx) => {
      const [inviteSnap, userSnap] = await Promise.all([tx.get(inviteRef), tx.get(userRef)]);
      const invite = inviteSnap.data();
      if (!invite) throw new HttpError(404, "هذه الدعوة غير صالحة.");
      if (invite.status !== "pending") throw new HttpError(410, "تم استخدام هذه الدعوة أو إلغاؤها.");
      if ((invite.expiresAt as Timestamp).toDate().getTime() < Date.now()) throw new HttpError(410, "انتهت صلاحية الدعوة.");
      if (!authUser.email || normEmail(authUser.email) !== invite.email)
        throw new HttpError(403, "سجّل الدخول بالبريد الإلكتروني الذي وصلته عليه الدعوة.");
      const existing = userSnap.data();
      if (existing?.clinicId) throw new HttpError(409, "حسابك مرتبط بعيادة بالفعل.");

      tx.set(
        userRef,
        {
          uid: user.uid,
          fullName: existing?.fullName || invite.fullName,
          specialty: existing?.specialty || invite.specialty || "",
          phone: existing?.phone ?? "",
          email: authUser.email,
          clinicId: invite.clinicId,
          role: invite.role,
          practicing: false,
          status: "active",
          createdAt: existing?.createdAt ?? FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      tx.update(inviteRef, { status: "accepted", acceptedBy: user.uid, acceptedAt: FieldValue.serverTimestamp() });
    });

    const invite = (await inviteRef.get()).data()!;
    await setMembershipClaims(user.uid, invite.clinicId, "doctor");
    return json({ clinicId: invite.clinicId });
  } catch (e) {
    return errorResponse(e);
  }
}
