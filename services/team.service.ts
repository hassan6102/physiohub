import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { apiFetch } from "@/lib/api-client";
import { getBucket, getDb } from "@/lib/firebase/client";
import { requireSession } from "@/lib/session";
import type { Clinic, ClinicInvite, UserProfile } from "@/types/models";
import { clinicCol, fromSnap } from "./base";

/* ---------- clinic ---------- */

export async function getClinic(): Promise<Clinic | null> {
  const snap = await getDoc(doc(getDb(), "clinics", requireSession().clinicId));
  return snap.exists() ? fromSnap<Clinic>(snap) : null;
}

export type ClinicInput = Pick<Clinic, "name" | "phone" | "email" | "address">;

/** Manager only (Security Rules also limit which fields can change). */
export async function updateClinic(input: ClinicInput) {
  await updateDoc(doc(getDb(), "clinics", requireSession().clinicId), {
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    address: input.address.trim(),
  });
}

export const MAX_LOGO_BYTES = 1024 * 1024;

export async function uploadClinicLogo(file: File): Promise<string> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("bad-type");
  if (file.size > MAX_LOGO_BYTES) throw new Error("too-large");
  const clinicId = requireSession().clinicId;
  const r = ref(getBucket(), `clinics/${clinicId}/branding/logo`);
  await uploadBytes(r, file, { contentType: file.type });
  const url = await getDownloadURL(r);
  await updateDoc(doc(getDb(), "clinics", clinicId), { logoUrl: url });
  return url;
}

/* ---------- team (manager) ---------- */

export type Member = UserProfile & { id: string };

/** All members of the manager's clinic. Rules only allow this query for the clinic's manager. */
export async function getTeam(): Promise<Member[]> {
  const snap = await getDocs(query(collection(getDb(), "users"), where("clinicId", "==", requireSession().clinicId), limit(200)));
  return snap.docs
    .map((d) => fromSnap<Member>(d))
    .sort((a, b) => (a.role === b.role ? a.fullName.localeCompare(b.fullName, "ar") : a.role === "manager" ? -1 : 1));
}

export const canBeAssigned = (m: Member) => m.status !== "disabled" && (m.role === "doctor" || (m.role === "manager" && m.practicing === true));

export async function getMember(uid: string): Promise<Member | null> {
  const snap = await getDoc(doc(getDb(), "users", uid));
  if (!snap.exists()) return null;
  const m = fromSnap<Member>(snap);
  return m.clinicId === requireSession().clinicId ? m : null;
}

export async function getInvites(): Promise<ClinicInvite[]> {
  const snap = await getDocs(
    query(collection(getDb(), "invites"), where("clinicId", "==", requireSession().clinicId), orderBy("createdAt", "desc"), limit(50))
  );
  return snap.docs.map((d) => fromSnap<ClinicInvite>(d));
}

/** The secret link is returned once; only its hash is stored. */
export async function createInvite(input: { email: string; fullName: string; specialty: string }) {
  const res = await apiFetch<{ id: string; token: string }>("/api/clinic/invites", { method: "POST", body: JSON.stringify(input) });
  return { id: res.id, url: `${window.location.origin}/invite/${res.token}` };
}

export async function revokeInvite(id: string) {
  await apiFetch(`/api/clinic/invites/${id}`, { method: "DELETE" });
}

export async function updateMember(uid: string, patch: { disabled?: boolean; fullName?: string; specialty?: string; phone?: string }) {
  await apiFetch(`/api/clinic/members/${uid}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export async function transferPatient(patientId: string, toDoctorId: string) {
  await apiFetch(`/api/clinic/patients/${patientId}/transfer`, { method: "POST", body: JSON.stringify({ toDoctorId }) });
}

/* ---------- real statistics per doctor ---------- */

export type DoctorStats = {
  patients: number;
  activePatients: number;
  /** sessions the doctor performed (author), unaffected by later patient transfers */
  sessions: number;
  /** appointments of the doctor's current patients */
  appointments: number;
  lastActivityAt: Date | null;
};

const count = async (q: ReturnType<typeof query>) => (await getCountFromServer(q)).data().count;

export async function getDoctorStats(uid: string): Promise<DoctorStats> {
  const patients = clinicCol("patients");
  const [p, active, sessions, appts, last] = await Promise.all([
    count(query(patients, where("assignedDoctorId", "==", uid), where("status", "in", ["active", "completed", "paused", "inactive"]))),
    count(query(patients, where("assignedDoctorId", "==", uid), where("status", "==", "active"))),
    count(query(clinicCol("sessions"), where("createdBy", "==", uid), where("deletedAt", "==", null))),
    count(query(clinicCol("appointments"), where("assignedDoctorId", "==", uid))),
    getDocs(query(clinicCol("activities"), where("actorId", "==", uid), orderBy("createdAt", "desc"), limit(1))),
  ]);
  return {
    patients: p,
    activePatients: active,
    sessions,
    appointments: appts,
    lastActivityAt: last.docs[0] ? (last.docs[0].data().createdAt?.toDate?.() ?? null) : null,
  };
}
