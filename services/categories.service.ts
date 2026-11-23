import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, writeBatch } from "firebase/firestore";
import type { Category } from "@/types/models";
import { DEFAULT_BODY_PARTS, DEFAULT_SUBCATEGORIES } from "@/lib/constants";
import { getDb } from "@/lib/firebase/client";
import { doctorCol, doctorDoc, fromSnap } from "./base";

type Scope = "doctor" | "public";

const colFor = (scope: Scope) => (scope === "doctor" ? doctorCol("categories") : collection(getDb(), "publicCategories"));
const docFor = (scope: Scope, id: string) => (scope === "doctor" ? doctorDoc("categories", id) : doc(getDb(), "publicCategories", id));

const seeding = new Map<string, Promise<void>>();

/** Same kind + name appearing twice (older double-seeding) is shown once. */
function dedupe(list: Category[]): Category[] {
  const seen = new Set<string>();
  return list.filter((c) => {
    const k = `${c.kind}:${c.name}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Loads categories; on first use creates the default lists so they can be edited and reordered.
 * Seeded documents have fixed ids and concurrent calls share one promise, so a double render
 * or two tabs can never create duplicates.
 */
export async function getCategories(scope: Scope = "doctor", seed: boolean = scope === "doctor"): Promise<Category[]> {
  const read = async () => (await getDocs(query(colFor(scope), orderBy("order")))).docs.map((d) => fromSnap<Category>(d));
  const first = await read();
  if (first.length > 0 || !seed) return dedupe(first);

  const key = `${scope}:${scope === "doctor" ? doctorCol("categories").path : "public"}`;
  if (!seeding.has(key)) {
    const run = (async () => {
      const batch = writeBatch(getDb());
      const defaults: { name: string; kind: Category["kind"]; order: number }[] = [
        ...DEFAULT_BODY_PARTS.map((name, i) => ({ name, kind: "bodyPart" as const, order: i })),
        ...DEFAULT_SUBCATEGORIES.map((name, i) => ({ name, kind: "subcategory" as const, order: i })),
      ];
      defaults.forEach((c) => batch.set(docFor(scope, `default-${c.kind}-${c.order}`), { ...c, createdAt: serverTimestamp() }));
      await batch.commit();
    })().finally(() => seeding.delete(key));
    seeding.set(key, run);
  }
  await seeding.get(key);
  return dedupe(await read());
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
