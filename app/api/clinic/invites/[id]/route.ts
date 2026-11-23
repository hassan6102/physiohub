import { adminDb } from "@/lib/firebase/admin";
import { errorResponse, HttpError, json } from "@/lib/server/http";
import { requireManager } from "@/lib/server/clinic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Revokes a pending invitation of the manager's own clinic. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const manager = await requireManager(req);
    const { id } = await params;
    if (!/^[a-f0-9]{64}$/.test(id)) throw new HttpError(404, "الدعوة غير موجودة.");
    const ref = adminDb().doc(`invites/${id}`);
    const invite = (await ref.get()).data();
    if (!invite || invite.clinicId !== manager.clinicId) throw new HttpError(404, "الدعوة غير موجودة.");
    if (invite.status !== "pending") throw new HttpError(400, "لا يمكن إلغاء هذه الدعوة.");
    await ref.update({ status: "revoked" });
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
