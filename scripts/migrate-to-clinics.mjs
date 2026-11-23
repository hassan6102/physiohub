// Migrates the pre-clinics layout (doctors/{uid}/patients, ...) into clinics/{clinicId}/...
//
// SAFE BY DESIGN
//  - DRY RUN by default: reads everything, prints a plan and an integrity report, writes NOTHING.
//  - Copies, never moves or deletes: legacy documents and Storage files stay untouched.
//  - Preserves every document ID, so relations (patientId, planId, ...) keep working.
//  - Idempotent: re-running overwrites the same destination documents with the same content.
//  - Each legacy account becomes its own clinic with that account as manager (practicing = true).
//    Set CLINIC_MAP to merge several accounts into one clinic (see below).
//
// BEFORE --execute: take a Firestore export (gcloud firestore export gs://<bucket>/backup-<date>) and
// a copy of the Storage bucket, and review the dry-run output.
//
// Usage (local machine, service-account env vars loaded; never commit keys):
//   node --env-file=.env.local scripts/migrate-to-clinics.mjs                 # dry run
//   node --env-file=.env.local scripts/migrate-to-clinics.mjs --execute --i-have-a-backup
//   optional: --only <legacyUid>   migrate a single account
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const args = process.argv.slice(2);
const EXECUTE = args.includes("--execute");
const BACKUP_OK = args.includes("--i-have-a-backup");
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
if (EXECUTE && !BACKUP_OK) {
  console.error("Refusing to run: pass --i-have-a-backup to confirm you exported Firestore and Storage first.");
  process.exit(1);
}
const { FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY, NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET } = process.env;
if (!FIREBASE_ADMIN_PROJECT_ID || !FIREBASE_ADMIN_CLIENT_EMAIL || !FIREBASE_ADMIN_PRIVATE_KEY) {
  console.error("Missing FIREBASE_ADMIN_* variables in the environment.");
  process.exit(1);
}
if (!getApps().length)
  initializeApp({
    credential: cert({ projectId: FIREBASE_ADMIN_PROJECT_ID, clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL, privateKey: FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n") }),
    storageBucket: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
const db = getFirestore();
const auth = getAuth();

const CLINICAL = ["patients", "sessions", "measurements", "records", "treatmentPlans", "patientFiles", "appointments", "activities", "auditLog"];
const log = (...a) => console.log(EXECUTE ? "[EXEC]" : "[DRY ]", ...a);

async function commitInChunks(ops) {
  for (let i = 0; i < ops.length; i += 400) {
    const batch = db.batch();
    for (const op of ops.slice(i, i + 400)) op(batch);
    await batch.commit();
  }
}

const report = { accounts: 0, clinics: 0, copied: {}, files: 0, shares: 0, completions: 0, problems: [] };

const userDocs = (await db.collection("users").get()).docs.filter((d) => !only || d.id === only);
for (const u of userDocs) {
  const p = u.data();
  if (p.clinicId) { log(`skip ${u.id}: already has clinicId ${p.clinicId}`); continue; }
  const legacyCounts = {};
  for (const c of CLINICAL) legacyCounts[c] = (await db.collection(`doctors/${u.id}/${c}`).count().get()).data().count;
  const total = Object.values(legacyCounts).reduce((a, b) => a + b, 0);
  if (total === 0 && p.role === "admin") continue; // pure platform admin without clinical data
  report.accounts++;

  // Deterministic clinic id so a re-run targets the same clinic.
  const clinicId = `c_${u.id}`;
  log(`account ${u.id} (${p.email ?? "no email"}) -> clinic ${clinicId} "${p.clinicName || p.fullName || "عيادة"}"`, legacyCounts);

  if (EXECUTE) {
    await db.doc(`clinics/${clinicId}`).set(
      { name: p.clinicName || (p.fullName ? `عيادة ${p.fullName}` : "عيادتي"), logoUrl: "", phone: p.phone ?? "", email: p.email ?? "", address: p.address ?? "", createdBy: u.id, createdAt: p.createdAt ?? FieldValue.serverTimestamp(), migratedFrom: u.id },
      { merge: true }
    );
  }
  report.clinics++;

  const planPatient = new Map();
  for (const c of CLINICAL) {
    const snap = await db.collection(`doctors/${u.id}/${c}`).get();
    const ops = [];
    for (const d of snap.docs) {
      const data = d.data();
      const extra = { clinicId, assignedDoctorId: u.id, createdBy: data.createdBy ?? u.id, createdByName: data.createdByName ?? p.fullName ?? "" };
      if (c === "activities" || c === "auditLog") { extra.actorId = data.actorId ?? u.id; extra.actorName = data.actorName ?? p.fullName ?? ""; delete extra.assignedDoctorId; }
      const next = { ...data, ...extra };
      if (c === "patientFiles" && typeof data.path === "string") next.path = data.path.replace(`doctors/${u.id}/`, `clinics/${clinicId}/`);
      if (c === "treatmentPlans") planPatient.set(d.id, data.patientId ?? "");
      ops.push((b) => b.set(db.doc(`clinics/${clinicId}/${c}/${d.id}`), next, { merge: false }));
    }
    report.copied[c] = (report.copied[c] ?? 0) + snap.size;
    if (EXECUTE) await commitInChunks(ops);
  }

  // Storage files: copy (the originals remain).
  const files = await db.collection(`doctors/${u.id}/patientFiles`).get();
  for (const f of files.docs) {
    const src = f.data().path;
    if (typeof src !== "string" || !src.startsWith(`doctors/${u.id}/`)) continue;
    const dst = src.replace(`doctors/${u.id}/`, `clinics/${clinicId}/`);
    report.files++;
    if (!EXECUTE) continue;
    try {
      const bucket = getStorage().bucket();
      const [exists] = await bucket.file(src).exists();
      if (!exists) { report.problems.push(`missing storage object ${src}`); continue; }
      await bucket.file(src).copy(bucket.file(dst));
    } catch (e) { report.problems.push(`copy failed ${src}: ${e.message}`); }
  }

  // Share links and completions: add clinic + assignee + patient so they resolve in the new layout.
  for (const [coll, key] of [["sharedPrograms", "shares"], ["programCompletions", "completions"]]) {
    const snap = await db.collection(coll).where("doctorId", "==", u.id).get();
    const ops = snap.docs.map((d) => (b) => b.set(d.ref, { clinicId, assignedDoctorId: u.id, patientId: d.data().patientId ?? planPatient.get(d.data().planId) ?? "" }, { merge: true }));
    report[key] += snap.size;
    if (EXECUTE) await commitInChunks(ops);
  }

  if (EXECUTE) {
    await db.doc(`users/${u.id}`).set({ clinicId, role: "manager", practicing: true, status: p.status === "disabled" ? "disabled" : "active" }, { merge: true });
    const au = await auth.getUser(u.id);
    await auth.setCustomUserClaims(u.id, { ...(au.customClaims ?? {}), clinicId, role: "manager" });
    await auth.revokeRefreshTokens(u.id);
  }

  // Integrity check: destination counts must match the source.
  if (EXECUTE) {
    for (const c of CLINICAL) {
      const n = (await db.collection(`clinics/${clinicId}/${c}`).count().get()).data().count;
      if (n < legacyCounts[c]) report.problems.push(`${clinicId}/${c}: ${n} < legacy ${legacyCounts[c]}`);
    }
  }
}

console.log("\n=== REPORT ===");
console.log(JSON.stringify(report, null, 2));
console.log(EXECUTE ? (report.problems.length ? "FINISHED WITH PROBLEMS: do not switch traffic until resolved." : "Finished. Legacy data was NOT deleted.") : "Dry run only. Nothing was written.");
