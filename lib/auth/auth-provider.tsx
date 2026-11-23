"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getClientAuth, getDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { setSessionInfo } from "@/lib/session";
import type { Clinic, ClinicRole } from "@/types/models";

type AuthState = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  isAdmin: boolean;
  clinicId: string | null;
  role: ClinicRole | null;
  clinic: Clinic | null;
  /** Re-reads claims (after registration/invitation) and the clinic document. */
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  configured: false,
  isAdmin: false,
  clinicId: null,
  role: null,
  clinic: null,
  refresh: async () => {},
});

type Core = Omit<AuthState, "refresh" | "configured">;
const EMPTY: Core = { user: null, loading: false, isAdmin: false, clinicId: null, role: null, clinic: null };

async function resolve(user: User | null, force: boolean): Promise<Core> {
  if (!user) {
    setSessionInfo(null);
    return EMPTY;
  }
  // Claims are a UI hint and a query convenience. Real enforcement is in Security Rules / server routes.
  const token = await user.getIdTokenResult(force);
  const isAdmin = token.claims.admin === true;
  const clinicId = typeof token.claims.clinicId === "string" ? token.claims.clinicId : null;
  const role = token.claims.role === "manager" || token.claims.role === "doctor" ? (token.claims.role as ClinicRole) : null;

  let clinic: Clinic | null = null;
  if (clinicId && role) {
    setSessionInfo({ uid: user.uid, clinicId, role });
    try {
      const snap = await getDoc(doc(getDb(), "clinics", clinicId));
      if (snap.exists()) clinic = { id: snap.id, ...(snap.data() as Omit<Clinic, "id">) };
    } catch {
      /* the clinic header is optional */
    }
  } else {
    setSessionInfo(null);
  }
  return { user, loading: false, isAdmin, clinicId: clinicId && role ? clinicId : null, role: clinicId ? role : null, clinic };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Core>({ ...EMPTY, loading: true });

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    return onAuthStateChanged(getClientAuth(), async (user) => {
      setState(await resolve(user, false));
    });
  }, []);

  const refresh = useCallback(async () => {
    const user = isFirebaseConfigured ? getClientAuth().currentUser : null;
    setState(await resolve(user, true));
  }, []);

  return <AuthContext.Provider value={{ ...state, configured: isFirebaseConfigured, refresh }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
