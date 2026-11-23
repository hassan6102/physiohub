import {
  addDoc,
  getCountFromServer,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Patient, Session, SessionInput } from "@/types/models";
import { ATTENDANCE } from "@/lib/constants";
import { assigneeOf, clean, clinicCol, clinicDoc, fromSnap, ownership, scope } from "./base";
import { logActivity, logAudit } from "./activity.service";

export const sessionsForPatientQuery = (patientId: string) =>
  query(clinicCol("sessions"), ...scope(), where("patientId", "==", patientId), orderBy("date", "desc"));

export const allSessionsQuery = () => query(clinicCol("sessions"), ...scope(), orderBy("date", "desc"));

export async function getSession(id: string): Promise<Session | null> {
  const snap = await getDoc(clinicDoc("sessions", id));
  return snap.exists() ? fromSnap<Session>(snap) : null;
}

/** Keeps "last visit" and follow-up data on the patient in sync with attended sessions. */
async function touchPatientVisit(patientId: string, date: Date) {
  const ref = clinicDoc("patients", patientId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const patient = fromSnap<Patient>(snap);
  if (!patient.lastVisitAt || date.getTime() > patient.lastVisitAt.getTime()) {
    await updateDoc(ref, { lastVisitAt: date, lastActivityAt: date });
  }
}

export async function createSession(input: SessionInput): Promise<string> {
  const ref = await addDoc(
    clinicCol("sessions"),
    clean({
      ...input,
      // inherited from the patient document, never from the form
      ...ownership(await assigneeOf(input.patientId)),
      deletedAt: null,
      deletedReason: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );
  if (input.attendance === "attended" || input.attendance === "late") await touchPatientVisit(input.patientId, input.date);
  await logAudit("create", "session", ref.id, `تسجيل جلسة (${ATTENDANCE[input.attendance].label}) للمريض ${input.patientName}`);
  await logActivity("session.created", `جلسة جديدة للمريض ${input.patientName}`, "session", ref.id);
  return ref.id;
}

export async function updateSession(id: string, input: SessionInput, before: Session) {
  await updateDoc(clinicDoc("sessions", id), clean({ ...input, updatedAt: serverTimestamp() }));
  if (input.attendance === "attended" || input.attendance === "late") await touchPatientVisit(input.patientId, input.date);
  const changed = changedSessionFields(before, input);
  await logAudit("update", "session", id, changed.length ? `تعديل: ${changed.join("، ")}` : "تعديل الجلسة");
}

/** Soft delete: the record stays in the database and the audit log, but is hidden from lists. */
export async function deleteSession(id: string, reason: string) {
  await updateDoc(clinicDoc("sessions", id), { deletedAt: serverTimestamp(), deletedReason: reason, updatedAt: serverTimestamp() });
  await logAudit("delete", "session", id, `حذف الجلسة${reason ? `: ${reason}` : ""}`);
}

export async function restoreSession(id: string) {
  await updateDoc(clinicDoc("sessions", id), { deletedAt: null, deletedReason: "", updatedAt: serverTimestamp() });
  await logAudit("restore", "session", id, "استعادة الجلسة");
}

export async function getSessionsBetween(start: Date, end: Date): Promise<Session[]> {
  const snap = await getDocs(
    query(clinicCol("sessions"), ...scope(), where("date", ">=", start), where("date", "<=", end), orderBy("date", "asc"))
  );
  return snap.docs.map((d) => fromSnap<Session>(d)).filter((s) => !s.deletedAt);
}

export async function countSessionsForPatient(patientId: string): Promise<number> {
  const snap = await getCountFromServer(query(clinicCol("sessions"), ...scope(), where("patientId", "==", patientId), where("deletedAt", "==", null)));
  return snap.data().count;
}

const LABELS: Partial<Record<keyof SessionInput, string>> = {
  date: "التاريخ",
  durationMin: "المدة",
  attendance: "الحضور",
  painArrival: "الألم عند الوصول",
  symptoms: "الأعراض",
  condition: "حالة المريض",
  exercisesDone: "التمارين",
  interventions: "التدخلات",
  response: "الاستجابة",
  assessment: "التقييم",
  nextPlan: "الخطة القادمة",
  notes: "الملاحظات",
};

function changedSessionFields(before: Session, after: SessionInput): string[] {
  const out: string[] = [];
  for (const key of Object.keys(LABELS) as (keyof SessionInput)[]) {
    const a = before[key];
    const b = after[key];
    const av = a instanceof Date ? a.getTime() : a ?? "";
    const bv = b instanceof Date ? b.getTime() : b ?? "";
    if (av !== bv) out.push(LABELS[key]!);
  }
  return out;
}
