import { addDoc, getDocs, limit, orderBy, query, serverTimestamp } from "firebase/firestore";
import type { ActivityItem } from "@/types/models";
import { actor, clean, clinicCol, fromSnap, isManager, scope } from "./base";
import { where } from "firebase/firestore";

/** Recent-activity feed shown on the dashboard. Never blocks the main action if it fails. */
export async function logActivity(type: string, message: string, refType = "", refId = "") {
  try {
    const a = actor();
    await addDoc(clinicCol("activities"), { type, message, refType, refId, actorId: a.uid, actorName: a.name, createdAt: serverTimestamp() });
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
    const a = actor();
    await addDoc(clinicCol("auditLog"), clean({ action, entity, entityId, summary, actorId: a.uid, actorName: a.name, createdAt: serverTimestamp() }));
  } catch {
    /* best effort */
  }
}

export async function getRecentActivities(n = 8): Promise<ActivityItem[]> {
  // Managers see the whole clinic feed; doctors only their own actions.
  const mine = isManager() ? [] : [where("actorId", "==", actor().uid)];
  const snap = await getDocs(query(clinicCol("activities"), ...mine, orderBy("createdAt", "desc"), limit(n)));
  return snap.docs.map((d) => fromSnap<ActivityItem>(d));
}

export async function getAuditFor(entityId: string, n = 30) {
  const mine = isManager() ? [] : [where("actorId", "==", actor().uid)];
  const snap = await getDocs(query(clinicCol("auditLog"), where("entityId", "==", entityId), ...mine, limit(n)));
  return snap.docs
    .map((d) => fromSnap<{ id: string; action: AuditAction | "transfer"; summary: string; createdAt: Date; actorName?: string }>(d))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
