import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile as updateAuthProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { UserProfile } from "@/types/models";
import { getClientAuth, getDb } from "@/lib/firebase/client";
import { currentUid, fromSnap } from "./base";

export async function getMyProfile(): Promise<UserProfile | null> {
  const snap = await getDoc(doc(getDb(), "users", currentUid()));
  return snap.exists() ? fromSnap<UserProfile & { id: string }>(snap) : null;
}

type ProfileInput = Pick<UserProfile, "fullName" | "specialty" | "phone" | "clinicName" | "address" | "photoUrl">;

/** merge:true also recreates the profile if registration had been interrupted before it was saved. */
export async function saveMyProfile(input: ProfileInput) {
  const auth = getClientAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("auth/not-signed-in");
  await setDoc(
    doc(getDb(), "users", user.uid),
    { ...input, uid: user.uid, email: user.email ?? "", updatedAt: serverTimestamp() },
    { merge: true }
  );
  if (user.displayName !== input.fullName) await updateAuthProfile(user, { displayName: input.fullName });
}

export async function changeMyPassword(currentPassword: string, newPassword: string) {
  const user = getClientAuth().currentUser;
  if (!user || !user.email) throw new Error("auth/not-signed-in");
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
  await updatePassword(user, newPassword);
}
