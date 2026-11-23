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
import { assigneeOf, clean, clinicCol, clinicDoc, fromSnap, ownership, scope } from "./base";
import { requireSession } from "@/lib/session";
import { logActivity, logAudit } from "./activity.service";
import { markExercisesUsed } from "./exercises.service";

export const plansQuery = () => query(clinicCol("treatmentPlans"), ...scope(), orderBy("updatedAt", "desc"));
export const plansForPatientQuery = (patientId: string) =>
  query(clinicCol("treatmentPlans"), ...scope(), where("patientId", "==", patientId), orderBy("updatedAt", "desc"));

export async function getPlan(id: string): Promise<TreatmentPlan | null> {
  const snap = await getDoc(clinicDoc("treatmentPlans", id));
  return snap.exists() ? fromSnap<TreatmentPlan>(snap) : null;
}

export async function createPlan(input: PlanInput): Promise<string> {
  const ref = await addDoc(
    clinicCol("treatmentPlans"),
    clean({ ...input, ...ownership(await assigneeOf(input.patientId)), createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  );
  await markExercisesUsed(input.exercises.map((e) => e.exerciseId ?? ""));
  await logAudit("create", "plan", ref.id, `إنشاء البرنامج ${input.title}`);
  await logActivity("plan.created", `برنامج علاجي جديد: ${input.title}`, "plan", ref.id);
  return ref.id;
}

export async function updatePlan(id: string, input: PlanInput) {
  const { assignedDoctorId: _ignored, ...fields } = input as typeof input & { assignedDoctorId?: string };
  void _ignored;
  await updateDoc(clinicDoc("treatmentPlans", id), clean({ ...fields, updatedAt: serverTimestamp() }));
  await markExercisesUsed(input.exercises.map((e) => e.exerciseId ?? ""));
  await logAudit("update", "plan", id, `تعديل البرنامج ${input.title}`);
}

export async function setPlanStatus(plan: TreatmentPlan, status: PlanStatus) {
  await updateDoc(clinicDoc("treatmentPlans", plan.id), { status, updatedAt: serverTimestamp() });
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
  await deleteDoc(clinicDoc("treatmentPlans", id));
}

export async function countPublishedPlans(): Promise<number> {
  return (await getCountFromServer(query(clinicCol("treatmentPlans"), ...scope(), where("status", "==", "published")))).data().count;
}

/* ---------- shares & completions (read-only on the client) ---------- */

export async function getSharesForPlan(planId: string): Promise<SharedProgram[]> {
  const snap = await getDocs(
    query(collection(getDb(), "sharedPrograms"), where("clinicId", "==", requireSession().clinicId), ...scope(), where("planId", "==", planId), limit(50))
  );
  return snap.docs
    .map((d) => fromSnap<SharedProgram>(d))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getCompletionsForPlan(planId: string): Promise<ProgramCompletion[]> {
  const snap = await getDocs(
    query(collection(getDb(), "programCompletions"), where("clinicId", "==", requireSession().clinicId), ...scope(), where("planId", "==", planId), limit(2000))
  );
  return snap.docs.map((d) => fromSnap<ProgramCompletion>(d));
}
