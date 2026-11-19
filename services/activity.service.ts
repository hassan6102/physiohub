import { addDoc, getDocs, limit, orderBy, query, serverTimestamp } from "firebase/firestore";
import type { ActivityItem } from "@/types/models";
import { clean, doctorCol, fromSnap } from "./base";

/** Recent-activity feed shown on the dashboard. Never blocks the main action if it fails. */
export async function logActivity(type: string, message: string, refType = "", refId = "") {
  try {
    await addDoc(doctorCol("activities"), { type, message, refType, refId, createdAt: serverTimestamp() });
  } catch {
    /* best effort */
  }
}

export type AuditAction = "create" | "update" | "archive" | "restore" | "delete";

/**
 * Append-only audit trail for clinical records. Security Rules allow create/read only,
 * so entries cannot be edited or removed from the client.
 */
export async function logAudit(action: AuditAction, entity: string, entityId: string, summary: string) {
  try {
    await addDoc(doctorCol("auditLog"), clean({ action, entity, entityId, summary, createdAt: serverTimestamp() }));
  } catch {
    /* best effort */
  }
}

export async function getRecentActivities(n = 8): Promise<ActivityItem[]> {
  const snap = await getDocs(query(doctorCol("activities"), orderBy("createdAt", "desc"), limit(n)));
  return snap.docs.map((d) => fromSnap<ActivityItem>(d));
}

export async function getAuditFor(entityId: string, n = 30) {
  const { where } = await import("firebase/firestore");
  const snap = await getDocs(query(doctorCol("auditLog"), where("entityId", "==", entityId), limit(n)));
  return snap.docs
    .map((d) => fromSnap<{ id: string; action: AuditAction; summary: string; createdAt: Date }>(d))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
