import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import type { Exercise, ExerciseInput } from "@/types/models";
import { getDb } from "@/lib/firebase/client";
import { clean, doctorCol, doctorDoc, fromSnap } from "./base";
import { logActivity } from "./activity.service";

/** The doctor's own library (capped at 500 docs; filtering happens in the browser). */
export async function getMyExercises(): Promise<Exercise[]> {
  const snap = await getDocs(query(doctorCol("exercises"), orderBy("updatedAt", "desc"), limit(500)));
  return snap.docs.map((d) => fromSnap<Exercise>(d));
}

export async function getExercise(id: string): Promise<Exercise | null> {
  const snap = await getDoc(doctorDoc("exercises", id));
  return snap.exists() ? fromSnap<Exercise>(snap) : null;
}

export async function createExercise(input: ExerciseInput, sourcePublicId: string | null = null): Promise<string> {
  const ref = await addDoc(
    doctorCol("exercises"),
    clean({ ...input, favorite: false, lastUsedAt: null, sourcePublicId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  );
  await logActivity("exercise.created", `تمت إضافة التمرين ${input.nameAr}`, "exercise", ref.id);
  return ref.id;
}

/** Editing a library exercise never touches treatment plans: they hold their own snapshot. */
export async function updateExercise(id: string, input: ExerciseInput) {
  await updateDoc(doctorDoc("exercises", id), clean({ ...input, updatedAt: serverTimestamp() }));
}

export async function deleteExercise(id: string) {
  await deleteDoc(doctorDoc("exercises", id));
}

export async function setFavorite(id: string, favorite: boolean) {
  await updateDoc(doctorDoc("exercises", id), { favorite });
}

export async function duplicateExercise(source: Exercise): Promise<string> {
  const { id: _id, createdAt: _c, updatedAt: _u, favorite: _f, lastUsedAt: _l, sourcePublicId, ...rest } = source;
  void _id; void _c; void _u; void _f; void _l;
  return createExercise({ ...rest, nameAr: `${source.nameAr} (نسخة)` }, sourcePublicId);
}

export async function markExercisesUsed(ids: string[]) {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (!unique.length) return;
  const batch = writeBatch(getDb());
  unique.forEach((id) => batch.update(doctorDoc("exercises", id), { lastUsedAt: serverTimestamp() }));
  await batch.commit().catch(() => undefined); // an exercise may have been deleted meanwhile
}

/** Copies a public exercise into the doctor's own library. Later edits stay private. */
export async function importPublicExercise(pub: Exercise): Promise<string> {
  const { id, createdAt: _c, updatedAt: _u, favorite: _f, lastUsedAt: _l, sourcePublicId: _s, ...rest } = pub;
  void _c; void _u; void _f; void _l; void _s;
  return createExercise(rest, id);
}

/* ---------- Public library (read for doctors, write for admins only by Security Rules) ---------- */

export const publicExercisesCol = () => collection(getDb(), "publicExercises");
export const publicExercisesQuery = () => query(publicExercisesCol(), orderBy("updatedAt", "desc"));

export async function getPublicExercise(id: string): Promise<Exercise | null> {
  const snap = await getDoc(doc(getDb(), "publicExercises", id));
  return snap.exists() ? fromSnap<Exercise>(snap) : null;
}

export async function createPublicExercise(input: ExerciseInput): Promise<string> {
  const ref = await addDoc(
    publicExercisesCol(),
    clean({ ...input, favorite: false, lastUsedAt: null, sourcePublicId: null, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  );
  return ref.id;
}

export async function updatePublicExercise(id: string, input: ExerciseInput) {
  await updateDoc(doc(getDb(), "publicExercises", id), clean({ ...input, updatedAt: serverTimestamp() }));
}

export async function deletePublicExercise(id: string) {
  await deleteDoc(doc(getDb(), "publicExercises", id));
}
