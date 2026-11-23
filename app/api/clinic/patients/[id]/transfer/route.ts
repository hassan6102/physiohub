import { z } from "zod";
import { FieldValue, type DocumentReference } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { errorResponse, HttpError, json, rateLimit } from "@/lib/server/http";
import { loadAssignee, requireManager } from "@/lib/server/clinic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ toDoctorId: z.string().min(1).max(128) }).strict();

/** Clinical records that follow the patient. Their author (`createdBy`) is never changed. */
const CHILD_COLLECTIONS = ["sessions", "measurements", "records", "treatmentPlans", "appointments", "patientFiles"];

/**
 * Transfers a patient to another doctor of the same clinic (manager only).
 *
 * Nothing is deleted or rewritten: only the `assignedDoctorId` pointer moves, so the new doctor sees
 * the full history while every record keeps its original author. Children are updated first and the
 * patient last, so an interrupted run is safe to repeat (the patient stays with the previous doctor
 * until the final step succeeds).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const manager = await requireManager(req);
    rateLimit(`transfer:${manager.uid}`, 30, 60_000);
    const { id } = await params;
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new HttpError(400, "بيانات غير صحيحة.");
    const to = parsed.data.toDoctorId;

    const db = adminDb();
    const cid = manager.clinicId;
    const patientRef = db.doc(`clinics/${cid}/patients/${id}`);
    const patient = (await patientRef.get()).data();
    if (!patient) throw new HttpError(404, "المريض غير موجود في عيادتك.");
    const from = patient.assignedDoctorId as string;
    if (from === to) throw new HttpError(400, "المريض مسند لهذا الدكتور بالفعل.");

    // The target is verified from Firestore: same clinic, active, and allowed to treat patients.
    const target = await loadAssignee(cid, to);
    if (!target) throw new HttpError(400, "الدكتور المختار غير متاح في هذه العيادة.");
    const fromName = ((await db.doc(`users/${from}`).get()).data()?.fullName as string) ?? "";

    const refs: DocumentReference[] = [];
    const planIds: string[] = [];
    for (const name of CHILD_COLLECTIONS) {
      const snap = await db.collection(`clinics/${cid}/${name}`).where("patientId", "==", id).get();
      snap.docs.forEach((d) => {
        refs.push(d.ref);
        if (name === "treatmentPlans") planIds.push(d.id);
      });
    }
    // Share links and completions of the patient's plans are read by the responsible doctor.
    for (const planId of planIds) {
      for (const col of ["sharedPrograms", "programCompletions"]) {
        const snap = await db.collection(col).where("clinicId", "==", cid).where("planId", "==", planId).get();
        snap.docs.forEach((d) => refs.push(d.ref));
      }
    }

    for (let i = 0; i < refs.length; i += 400) {
      const batch = db.batch();
      refs.slice(i, i + 400).forEach((r) => batch.update(r, { assignedDoctorId: to }));
      await batch.commit();
    }

    const patientName = (patient.fullName as string) ?? "";
    const final = db.batch();
    final.update(patientRef, { assignedDoctorId: to, transferredAt: FieldValue.serverTimestamp() });
    final.set(db.collection(`clinics/${cid}/auditLog`).doc(), {
      action: "transfer",
      entity: "patient",
      entityId: id,
      summary: `نقل المريض ${patientName} من ${fromName || "دكتور"} إلى ${target.name}`,
      fromDoctorId: from,
      fromDoctorName: fromName,
      toDoctorId: to,
      toDoctorName: target.name,
      actorId: manager.uid,
      actorName: (manager.profile.fullName as string) ?? "",
      createdAt: FieldValue.serverTimestamp(),
    });
    final.set(db.collection(`clinics/${cid}/activities`).doc(), {
      type: "patient.transferred",
      message: `تم نقل المريض ${patientName} إلى ${target.name}`,
      refType: "patient",
      refId: id,
      actorId: manager.uid,
      actorName: (manager.profile.fullName as string) ?? "",
      createdAt: FieldValue.serverTimestamp(),
    });
    await final.commit();
    return json({ ok: true, moved: refs.length });
  } catch (e) {
    return errorResponse(e);
  }
}
