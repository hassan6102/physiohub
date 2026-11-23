import "server-only";
import type { DecodedIdToken } from "firebase-admin/auth";
import type { DocumentData } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import type { ClinicRole } from "@/types/models";
import { HttpError, requireUser } from "./http";

export type Member = {
  uid: string;
  clinicId: string;
  role: ClinicRole;
  token: DecodedIdToken;
  profile: DocumentData;
};

/**
 * Authorization source of truth for server routes. The ID-token claims can be up to an hour old,
 * so membership, role and status are always re-read from Firestore before any sensitive action.
 */
export async function requireMember(req: Request): Promise<Member> {
  const token = await requireUser(req);
  const snap = await adminDb().doc(`users/${token.uid}`).get();
  const profile = snap.data();
  if (!profile?.clinicId || (profile.role !== "manager" && profile.role !== "doctor"))
    throw new HttpError(403, "حسابك غير مرتبط بعيادة.");
  if (profile.status === "disabled") throw new HttpError(403, "عضويتك في العيادة موقوفة.");
  return { uid: token.uid, clinicId: profile.clinicId, role: profile.role, token, profile };
}

export async function requireManager(req: Request): Promise<Member> {
  const m = await requireMember(req);
  if (m.role !== "manager") throw new HttpError(403, "هذا الإجراء للمدير فقط.");
  return m;
}

/** Writes clinicId/role next to any existing claims (admin, disabled...). Client must refresh its token. */
export async function setMembershipClaims(uid: string, clinicId: string, role: ClinicRole) {
  const auth = adminAuth();
  const user = await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, { ...(user.customClaims ?? {}), clinicId, role });
}

/** A doctor/manager of the clinic that may be assigned patients. */
export async function loadAssignee(clinicId: string, uid: string) {
  const snap = await adminDb().doc(`users/${uid}`).get();
  const u = snap.data();
  if (!u || u.clinicId !== clinicId || u.status === "disabled") return null;
  if (u.role === "doctor" || (u.role === "manager" && u.practicing === true)) return { uid, name: (u.fullName as string) ?? "" };
  return null;
}

export const normEmail = (e: string) => e.trim().toLowerCase();
