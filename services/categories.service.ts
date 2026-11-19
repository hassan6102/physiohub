import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, writeBatch } from "firebase/firestore";
import type { Category } from "@/types/models";
import { DEFAULT_BODY_PARTS, DEFAULT_SUBCATEGORIES } from "@/lib/constants";
import { getDb } from "@/lib/firebase/client";
import { currentUid, doctorCol, doctorDoc, fromSnap } from "./base";

type Scope = "doctor" | "public";

const colFor = (scope: Scope) => (scope === "doctor" ? doctorCol("categories") : collection(getDb(), "publicCategories"));
const docFor = (scope: Scope, id: string) => (scope === "doctor" ? doctorDoc("categories", id) : doc(getDb(), "publicCategories", id));

const inFlight = new Map<string, Promise<Category[]>>();

/** Loads categories; on first use creates the default lists so they can be edited and reordered. */
export async function getCategories(scope: Scope = "doctor", seed: boolean = scope === "doctor"): Promise<Category[]> {
  const key = `${scope}:${scope === "doctor" ? currentUid() : "public"}:${seed ? "seed" : "read"}`;
  const existing = inFlight.get(key);
  if (existing) return existing;

  const task = (async () => {
    const col = colFor(scope);
    const snap = await getDocs(query(col, orderBy("order")));
    if (snap.empty && seed) {
      const batch = writeBatch(getDb());
      const defaults: { id: string; name: string; kind: Category["kind"]; order: number }[] = [
        ...DEFAULT_BODY_PARTS.map((name, i) => ({ id: `default-bodyPart-${i}`, name, kind: "bodyPart" as const, order: i })),
        ...DEFAULT_SUBCATEGORIES.map((name, i) => ({ id: `default-subcategory-${i}`, name, kind: "subcategory" as const, order: i })),
      ];
      defaults.forEach(({ id, ...c }) => batch.set(doc(col, id), { ...c, createdAt: serverTimestamp() }));
      await batch.commit();
      const again = await getDocs(query(col, orderBy("order")));
      return again.docs.map((d) => fromSnap<Category>(d));
    }
    return snap.docs.map((d) => fromSnap<Category>(d));
  })();

  inFlight.set(key, task);
  try {
    return await task;
  } finally {
    inFlight.delete(key);
  }
}

export async function addCategory(scope: Scope, kind: Category["kind"], name: string, order: number) {
  await addDoc(colFor(scope), { name: name.trim(), kind, order, createdAt: serverTimestamp() });
}

export async function renameCategory(scope: Scope, id: string, name: string) {
  await updateDoc(docFor(scope, id), { name: name.trim() });
}

export async function deleteCategory(scope: Scope, id: string) {
  await deleteDoc(docFor(scope, id));
}

/** Persists a new order for the given category ids (index = order). */
export async function reorderCategories(scope: Scope, orderedIds: string[]) {
  const batch = writeBatch(getDb());
  orderedIds.forEach((id, i) => batch.update(docFor(scope, id), { order: i }));
  await batch.commit();
}
