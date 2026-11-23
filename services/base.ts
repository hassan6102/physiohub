import {
  collection,
  doc,
  getDoc,
  Timestamp,
  where,
  type DocumentSnapshot,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getClientAuth, getDb } from "@/lib/firebase/client";
import { requireSession } from "@/lib/session";

export function currentUid(): string {
  const user = getClientAuth().currentUser;
  if (!user) throw new Error("auth/not-signed-in");
  return user.uid;
}

/** Personal (per-user) data: exercise library, categories, templates. doctors/{uid}/{name} */
export const doctorCol = (name: string) => collection(getDb(), "doctors", currentUid(), name);
export const doctorDoc = (name: string, id: string) => doc(getDb(), "doctors", currentUid(), name, id);

/* ---------- clinic-owned data: clinics/{clinicId}/{name} ---------- */

/** patients, sessions, measurements, records, appointments, treatmentPlans, patientFiles, activities, auditLog */
export const clinicCol = (name: string) => collection(getDb(), "clinics", requireSession().clinicId, name);
export const clinicDoc = (name: string, id: string) => doc(getDb(), "clinics", requireSession().clinicId, name, id);

export const isManager = () => requireSession().role === "manager";

/**
 * Doctors may only query records assigned to them, and Security Rules reject any query that
 * does not carry this filter. Managers see the whole clinic, so no filter is added for them.
 */
export function scope(): QueryConstraint[] {
  const s = requireSession();
  return s.role === "doctor" ? [where("assignedDoctorId", "==", s.uid)] : [];
}

/** Who is acting, for the immutable author fields on new records. */
export function actor() {
  const s = requireSession();
  return { uid: s.uid, name: getClientAuth().currentUser?.displayName ?? "" };
}

/** Fields stamped on every new clinical record. Rules verify them again. */
export function ownership(assignedDoctorId: string) {
  const s = requireSession();
  const a = actor();
  return { clinicId: s.clinicId, assignedDoctorId, createdBy: a.uid, createdByName: a.name };
}

/**
 * The doctor currently responsible for a patient, read from the patient document itself
 * (never taken from the form). Records created for the patient inherit it.
 */
export async function assigneeOf(patientId: string): Promise<string> {
  const snap = await getDoc(clinicDoc("patients", patientId));
  const id = snap.exists() ? (snap.data().assignedDoctorId as string | undefined) : undefined;
  if (!id) throw new Error("patient-not-found");
  return id;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && Object.getPrototypeOf(v) === Object.prototype;
}

/** Converts Firestore Timestamps to Dates, recursively. */
export function normalize(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate();
  if (Array.isArray(value)) return value.map(normalize);
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = normalize(v);
    return out;
  }
  return value;
}

export function fromSnap<T>(snap: DocumentSnapshot | QueryDocumentSnapshot): T {
  return { ...(normalize(snap.data() ?? {}) as object), id: snap.id } as T;
}

/** Firestore rejects `undefined`; strip it recursively (Dates and sentinels are kept). */
export function clean<T>(value: T): T {
  if (Array.isArray(value)) return value.map(clean) as unknown as T;
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) if (v !== undefined) out[k] = clean(v);
    return out as T;
  }
  return value;
}
