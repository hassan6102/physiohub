import type { ClinicRole } from "@/types/models";

/**
 * The signed-in user's clinic membership as read from the verified ID-token claims.
 * It is a UI/query convenience only: Security Rules and server APIs re-check everything.
 */
export type SessionInfo = { uid: string; clinicId: string; role: ClinicRole };

let current: SessionInfo | null = null;

export const setSessionInfo = (s: SessionInfo | null) => {
  current = s;
};

export const getSessionInfo = () => current;

export function requireSession(): SessionInfo {
  if (!current) throw new Error("auth/no-clinic");
  return current;
}
