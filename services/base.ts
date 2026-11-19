import {
  collection,
  doc,
  Timestamp,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getClientAuth, getDb } from "@/lib/firebase/client";

export function currentUid(): string {
  const user = getClientAuth().currentUser;
  if (!user) throw new Error("auth/not-signed-in");
  return user.uid;
}

/** doctors/{uid}/{name} */
export const doctorCol = (name: string) => collection(getDb(), "doctors", currentUid(), name);
export const doctorDoc = (name: string, id: string) => doc(getDb(), "doctors", currentUid(), name, id);

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
