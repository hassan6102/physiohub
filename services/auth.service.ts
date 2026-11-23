import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { apiFetch } from "@/lib/api-client";
import { getClientAuth } from "@/lib/firebase/client";

export type RegisterInput = {
  fullName: string;
  specialty: string;
  phone: string;
  email: string;
  password: string;
  clinicName: string;
  practicing: boolean;
};

export async function login(email: string, password: string) {
  await signInWithEmailAndPassword(getClientAuth(), email, password);
}

/** Creates only the sign-in account (used by the invitation page). Clinic membership comes from the server. */
export async function signUpAccount(email: string, password: string, fullName: string) {
  const cred = await createUserWithEmailAndPassword(getClientAuth(), email, password);
  await updateProfile(cred.user, { displayName: fullName });
}

/**
 * New clinic: creates the account, then the server creates the clinic and makes this user its manager.
 * The client never writes role/clinic fields; Security Rules forbid it.
 */
export async function registerClinic(input: RegisterInput) {
  await signUpAccount(input.email, input.password, input.fullName);
  await apiFetch("/api/clinics", {
    method: "POST",
    body: JSON.stringify({
      clinicName: input.clinicName,
      fullName: input.fullName,
      specialty: input.specialty,
      phone: input.phone,
      practicing: input.practicing,
    }),
  });
  // force a fresh ID token so the new clinic/role claims are present
  await getClientAuth().currentUser?.getIdToken(true);
}

export async function requestPasswordReset(email: string) {
  await sendPasswordResetEmail(getClientAuth(), email);
}

/** Completes a password reset started from the e-mail link (custom action handler page). */
export async function completePasswordReset(oobCode: string, newPassword: string) {
  const { confirmPasswordReset } = await import("firebase/auth");
  await confirmPasswordReset(getClientAuth(), oobCode, newPassword);
}
