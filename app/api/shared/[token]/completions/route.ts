import { createHash } from "crypto";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { clientIp, errorResponse, HttpError, json, rateLimit } from "@/lib/server/http";
import { loadShare } from "@/lib/server/shares";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  exerciseKey: z.string().min(1).max(100),
  day: z.string().regex(/^\d{8}$/),
});

/** The day is chosen by the patient's device (local time). Accept today (+/- 1 day for time zones) and the last 14 days. */
function validDay(day: string) {
  const y = Number(day.slice(0, 4));
  const m = Number(day.slice(4, 6));
  const d = Number(day.slice(6, 8));
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return false;
  const diffDays = (date.getTime() - Date.now()) / 86_400_000;
  return diffDays <= 1 && diffDays >= -15;
}

async function handle(req: Request, params: Promise<{ token: string }>, remove: boolean) {
  const { token } = await params;
  rateLimit(`complete:${clientIp(req)}`, 60, 60_000);
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw new HttpError(400, "بيانات غير صحيحة.");
  const { exerciseKey, day } = parsed.data;
  if (!validDay(day)) throw new HttpError(400, "التاريخ غير مقبول.");

  const share = await loadShare(token, req.headers.get("x-share-pin"));
  if (!share.exerciseKeys.has(exerciseKey)) throw new HttpError(404, "التمرين غير موجود في هذا البرنامج.");

  // Deterministic id => tapping twice never creates duplicates.
  const id = createHash("sha256").update(`${share.id}:${exerciseKey}:${day}`).digest("hex");
  const ref = adminDb().doc(`programCompletions/${id}`);
  if (remove) await ref.delete();
  else
    await ref.set({
      shareId: share.id,
      doctorId: share.doctorId,
      planId: share.planId,
      exerciseKey,
      day,
      completedAt: FieldValue.serverTimestamp(),
    });
  return json({ ok: true });
}

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    return await handle(req, ctx.params, false);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    return await handle(req, ctx.params, true);
  } catch (e) {
    return errorResponse(e);
  }
}
