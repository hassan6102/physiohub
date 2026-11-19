"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getClientAuth, isFirebaseConfigured } from "@/lib/firebase/client";

type AuthState = { user: User | null; loading: boolean; configured: boolean; isAdmin: boolean };
const AuthContext = createContext<AuthState>({ user: null, loading: true, configured: false, isAdmin: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    configured: isFirebaseConfigured,
    isAdmin: false,
  });

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    return onAuthStateChanged(getClientAuth(), async (user) => {
      let isAdmin = false;
      if (user) {
        // UI hint only. Real admin enforcement happens in Security Rules / server routes.
        const token = await user.getIdTokenResult();
        isAdmin = token.claims.admin === true;
      }
      setState({ user, loading: false, configured: true, isAdmin });
    });
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
