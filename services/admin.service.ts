import {
  addDoc,
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import type { ExerciseReport, PlatformSettings, UserProfile } from "@/types/models";
import { apiFetch } from "@/lib/api-client";
import { getDb } from "@/lib/firebase/client";
import { currentUid, fromSnap } from "./base";

/* ---- Doctors (listing is allowed to admins by Security Rules; enable/disable goes through the server) ---- */

export async function listDoctors(): Promise<UserProfile[]> {
  const snap = await getDocs(query(collection(getDb(), "users"), orderBy("createdAt", "desc"), limit(500)));
  return snap.docs.map((d) => fromSnap<UserProfile>(d));
}

export async function setDoctorDisabled(uid: string, disabled: boolean) {
  await apiFetch(`/api/admin/doctors/${uid}`, { method: "PATCH", body: JSON.stringify({ disabled }) });
}

export async function getAdminCounts() {
  const [doctors, publicExercises, openReports] = await Promise.all([
    getCountFromServer(collection(getDb(), "users")),
    getCountFromServer(collection(getDb(), "publicExercises")),
    getCountFromServer(query(collection(getDb(), "reports"), where("status", "==", "open"))),
  ]);
  return { doctors: doctors.data().count, publicExercises: publicExercises.data().count, openReports: openReports.data().count };
}

/* ---- Exercise reports (doctors create, admins review) ---- */

export async function createExerciseReport(exercise: { id: string; nameAr: string }, reason: string, doctorName: string) {
  await addDoc(collection(getDb(), "reports"), {
    exerciseId: exercise.id,
    exerciseName: exercise.nameAr,
    doctorId: currentUid(),
    doctorName,
    reason,
    status: "open",
    createdAt: serverTimestamp(),
  });
}

export async function listReports(): Promise<ExerciseReport[]> {
  const snap = await getDocs(query(collection(getDb(), "reports"), orderBy("createdAt", "desc"), limit(200)));
  return snap.docs.map((d) => fromSnap<ExerciseReport>(d));
}

export async function setReportStatus(id: string, status: ExerciseReport["status"]) {
  await updateDoc(doc(getDb(), "reports", id), { status });
}

/* ---- Platform settings ---- */

const SETTINGS_REF = () => doc(getDb(), "platform", "settings");

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const snap = await getDoc(SETTINGS_REF());
  const data = snap.exists() ? (snap.data() as Partial<PlatformSettings>) : {};
  return { announcement: data.announcement ?? "", supportContact: data.supportContact ?? "" };
}

export async function savePlatformSettings(settings: PlatformSettings) {
  await setDoc(SETTINGS_REF(), { ...settings, updatedAt: serverTimestamp() }, { merge: true });
}
