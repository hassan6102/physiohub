// Maps Firebase error codes to translation keys so users never see raw codes.
const known = new Set([
  "auth/invalid-credential",
  "auth/email-already-in-use",
  "auth/weak-password",
  "auth/too-many-requests",
  "auth/network-request-failed",
]);

export function authErrorKey(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "authErrors.auth/invalid-credential";
  }
  return known.has(code ?? "") ? `authErrors.${code}` : "authErrors.default";
}
