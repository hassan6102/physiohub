import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getClientAuth, getDb } from "@/lib/firebase/client";

export type RegisterInput = {
  fullName: string;
  specialty: string;
  phone: string;
  email: string;
  password: string;
  clinicName?: string;
};

export async function login(email: string, password: string) {
  await signInWithEmailAndPassword(getClientAuth(), email, password);
}

export async function registerDoctor(input: RegisterInput) {
  const cred = await createUserWithEmailAndPassword(getClientAuth(), input.email, input.password);
  await updateProfile(cred.user, { displayName: input.fullName });
  // role/status are intentionally NOT written here; Security Rules forbid clients from setting them.
  await setDoc(doc(getDb(), "users", cred.user.uid), {
    uid: cred.user.uid,
    fullName: input.fullName,
    specialty: input.specialty,
    phone: input.phone,
    email: input.email,
    clinicName: input.clinicName ?? "",
    createdAt: serverTimestamp(),
  });
}

export async function requestPasswordReset(email: string) {
  await sendPasswordResetEmail(getClientAuth(), email);
}

/** Completes a password reset started from the e-mail link (custom action handler page). */
export async function completePasswordReset(oobCode: string, newPassword: string) {
  const { confirmPasswordReset } = await import("firebase/auth");
  await confirmPasswordReset(getClientAuth(), oobCode, newPassword);
}
