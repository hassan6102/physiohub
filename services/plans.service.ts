import {
  addDoc,
  deleteDoc,
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
import type { PlanInput, PlanStatus, ProgramCompletion, SharedProgram, TreatmentPlan } from "@/types/models";
import { collection } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { clean, currentUid, doctorCol, doctorDoc, fromSnap } from "./base";
import { logActivity, logAudit } from "./activity.service";
import { markExercisesUsed } from "./exercises.service";

export const plansQuery = () => query(doctorCol("treatmentPlans"), orderBy("updatedAt", "desc"));
export const plansForPatientQuery = (patientId: string) =>
  query(doctorCol("treatmentPlans"), where("patientId", "==", patientId), orderBy("updatedAt", "desc"));

export async function getPlan(id: string): Promise<TreatmentPlan | null> {
  const snap = await getDoc(doctorDoc("treatmentPlans", id));
  return snap.exists() ? fromSnap<TreatmentPlan>(snap) : null;
}

export async function createPlan(input: PlanInput): Promise<string> {
  const ref = await addDoc(
    doctorCol("treatmentPlans"),
    clean({ ...input, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  );
  await markExercisesUsed(input.exercises.map((e) => e.exerciseId ?? ""));
  await logAudit("create", "plan", ref.id, `إنشاء البرنامج ${input.title}`);
  await logActivity("plan.created", `برنامج علاجي جديد: ${input.title}`, "plan", ref.id);
  return ref.id;
}

export async function updatePlan(id: string, input: PlanInput) {
  await updateDoc(doctorDoc("treatmentPlans", id), clean({ ...input, updatedAt: serverTimestamp() }));
  await markExercisesUsed(input.exercises.map((e) => e.exerciseId ?? ""));
  await logAudit("update", "plan", id, `تعديل البرنامج ${input.title}`);
}

export async function setPlanStatus(plan: TreatmentPlan, status: PlanStatus) {
  await updateDoc(doctorDoc("treatmentPlans", plan.id), { status, updatedAt: serverTimestamp() });
  await logAudit(status === "archived" ? "archive" : "update", "plan", plan.id, `تغيير حالة البرنامج`);
  if (status === "published") await logActivity("plan.published", `تم نشر البرنامج ${plan.title}`, "plan", plan.id);
}

/** Copies a previous plan as a new draft (exercise snapshots are copied as they are). */
export async function duplicatePlan(plan: TreatmentPlan, patientId?: string, patientName?: string): Promise<string> {
  return createPlan({
    patientId: patientId ?? plan.patientId,
    patientName: patientName ?? plan.patientName,
    title: `${plan.title} (نسخة)`,
    goal: plan.goal,
    startDate: null,
    endDate: null,
    instructions: plan.instructions,
    exercises: plan.exercises.map((e) => ({ ...e, key: `${e.key}-${Math.random().toString(36).slice(2, 7)}` })),
    status: "draft",
  });
}

/** Only drafts can be deleted (Security Rules); published plans are archived instead. */
export async function deleteDraftPlan(id: string) {
  await deleteDoc(doctorDoc("treatmentPlans", id));
}

export async function countPublishedPlans(): Promise<number> {
  return (await getCountFromServer(query(doctorCol("treatmentPlans"), where("status", "==", "published")))).data().count;
}

/* ---------- shares & completions (read-only on the client) ---------- */

export async function getSharesForPlan(planId: string): Promise<SharedProgram[]> {
  const snap = await getDocs(
    query(collection(getDb(), "sharedPrograms"), where("doctorId", "==", currentUid()), where("planId", "==", planId), limit(50))
  );
  return snap.docs
    .map((d) => fromSnap<SharedProgram>(d))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getCompletionsForPlan(planId: string): Promise<ProgramCompletion[]> {
  const snap = await getDocs(
    query(collection(getDb(), "programCompletions"), where("doctorId", "==", currentUid()), where("planId", "==", planId), limit(2000))
  );
  return snap.docs.map((d) => fromSnap<ProgramCompletion>(d));
}
