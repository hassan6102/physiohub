import {
  addDoc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Patient, PatientInput, PatientStatus } from "@/types/models";
import { PATIENT_STATUS } from "@/lib/constants";
import { actor, clean, clinicCol, clinicDoc, fromSnap, isManager, ownership, scope } from "./base";
import { logActivity, logAudit } from "./activity.service";

const ACTIVE_STATUSES: PatientStatus[] = ["active", "completed", "paused", "inactive"];

/** `doctorId` is the manager's "responsible doctor" filter; doctors are always scoped to themselves. */
export function patientsQuery(opts: { status: PatientStatus | "all"; sort: "createdAt" | "lastActivityAt"; doctorId?: string }) {
  const col = clinicCol("patients");
  const who = isManager() && opts.doctorId ? [where("assignedDoctorId", "==", opts.doctorId)] : scope();
  if (opts.status === "all") return query(col, ...who, where("status", "in", ACTIVE_STATUSES), orderBy(opts.sort, "desc"));
  return query(col, ...who, where("status", "==", opts.status), orderBy(opts.sort, "desc"));
}

/** Patients are never hard-deleted (Security Rules forbid it); they are archived instead. */
export async function createPatient(input: PatientInput): Promise<string> {
  // A doctor's patients are always assigned to themselves. A manager must pick the responsible doctor;
  // Security Rules re-verify that the chosen user is an active member of this clinic.
  const assignee = isManager() ? input.assignedDoctorId : actor().uid;
  if (!assignee) throw new Error("assignee-required");
  const ref = await addDoc(
    clinicCol("patients"),
    clean({
      ...input,
      ...ownership(assignee),
      statusBeforeArchive: null,
      lastVisitAt: null,
      lastActivityAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );
  await logAudit("create", "patient", ref.id, `إضافة المريض ${input.fullName}`);
  await logActivity("patient.created", `تمت إضافة المريض ${input.fullName}`, "patient", ref.id);
  return ref.id;
}

export async function getPatient(id: string): Promise<Patient | null> {
  const snap = await getDoc(clinicDoc("patients", id));
  return snap.exists() ? fromSnap<Patient>(snap) : null;
}

export async function updatePatient(id: string, input: PatientInput, before?: Patient | null) {
  // The responsible doctor never changes through an edit; only a manager's transfer (server API) moves it.
  const { assignedDoctorId: _ignored, ...fields } = input;
  void _ignored;
  await updateDoc(clinicDoc("patients", id), clean({ ...fields, updatedAt: serverTimestamp() }));
  const changed = before ? changedPatientFields(before, input) : [];
  await logAudit("update", "patient", id, changed.length ? `تعديل: ${changed.join("، ")}` : "تعديل بيانات المريض");
}

export async function setPatientStatus(id: string, status: Exclude<PatientStatus, "archived">, name: string) {
  await updateDoc(clinicDoc("patients", id), { status, updatedAt: serverTimestamp() });
  await logAudit("update", "patient", id, `تغيير الحالة إلى ${PATIENT_STATUS[status].label}`);
  await logActivity("patient.status", `تغيير حالة ${name} إلى ${PATIENT_STATUS[status].label}`, "patient", id);
}

export async function archivePatient(patient: Patient) {
  await updateDoc(clinicDoc("patients", patient.id), {
    status: "archived",
    statusBeforeArchive: patient.status,
    updatedAt: serverTimestamp(),
  });
  await logAudit("archive", "patient", patient.id, "أرشفة المريض");
  await logActivity("patient.archived", `تمت أرشفة المريض ${patient.fullName}`, "patient", patient.id);
}

export async function restorePatient(patient: Patient) {
  const restored = patient.statusBeforeArchive && patient.statusBeforeArchive !== "archived" ? patient.statusBeforeArchive : "active";
  await updateDoc(clinicDoc("patients", patient.id), { status: restored, statusBeforeArchive: null, updatedAt: serverTimestamp() });
  await logAudit("restore", "patient", patient.id, "استعادة المريض من الأرشيف");
}

export async function updatePatientNotes(id: string, notes: string) {
  await updateDoc(clinicDoc("patients", id), { notes, updatedAt: serverTimestamp() });
  await logAudit("update", "patient", id, "تعديل ملاحظات المريض");
}

/** Up to 300 recent non-archived patients, used for client-side search (name, phone, diagnosis). */
export async function loadPatientsForSearch(): Promise<Patient[]> {
  const snap = await getDocs(query(clinicCol("patients"), ...scope(), orderBy("createdAt", "desc"), limit(300)));
  return snap.docs.map((d) => fromSnap<Patient>(d));
}

export async function getPatientOptions(): Promise<{ id: string; fullName: string }[]> {
  const snap = await getDocs(query(clinicCol("patients"), ...scope(), orderBy("fullName"), limit(500)));
  return snap.docs
    .map((d) => fromSnap<Patient>(d))
    .filter((p) => p.status !== "archived")
    .map((p) => ({ id: p.id, fullName: p.fullName }));
}

export async function countPatients(status?: PatientStatus): Promise<number> {
  const q = status
    ? query(clinicCol("patients"), ...scope(), where("status", "==", status))
    : query(clinicCol("patients"), ...scope(), where("status", "in", ACTIVE_STATUSES));
  return (await getCountFromServer(q)).data().count;
}

const FIELD_LABELS: Partial<Record<keyof PatientInput, string>> = {
  fullName: "الاسم",
  phone: "الهاتف",
  email: "البريد",
  birthDate: "تاريخ الميلاد",
  gender: "الجنس",
  address: "العنوان",
  chiefComplaint: "الشكوى الرئيسية",
  problemStartDate: "بداية المشكلة",
  diagnosis: "التشخيص",
  medicalHistory: "التاريخ المرضي",
  previousInjuries: "الإصابات السابقة",
  previousSurgeries: "العمليات السابقة",
  medications: "الأدوية",
  treatmentGoals: "أهداف العلاج",
  notes: "الملاحظات",
  status: "الحالة",
};

function changedPatientFields(before: Patient, after: PatientInput): string[] {
  const out: string[] = [];
  for (const key of Object.keys(FIELD_LABELS) as (keyof PatientInput)[]) {
    const a = before[key];
    const b = after[key];
    const av = a instanceof Date ? a.getTime() : a ?? "";
    const bv = b instanceof Date ? b.getTime() : b ?? "";
    if (av !== bv) out.push(FIELD_LABELS[key]!);
  }
  return out;
}
