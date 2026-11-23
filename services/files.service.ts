import { deleteObject, getBlob, ref, uploadBytesResumable } from "firebase/storage";
import { addDoc, deleteDoc, getDocs, limit, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import type { PatientFile } from "@/types/models";
import { getBucket } from "@/lib/firebase/client";
import { uid } from "@/lib/utils/misc";
import { assigneeOf, clinicCol, clinicDoc, fromSnap, ownership, scope } from "./base";
import { requireSession } from "@/lib/session";
import { logAudit } from "./activity.service";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

/**
 * Private medical files. Stored under clinics/{clinicId}/patients/{patientId}/files/ and readable only by
 * the clinic manager and the doctor responsible for the patient (Storage Rules). We never create public download URLs; files are opened with
 * an authenticated blob download.
 */
export async function uploadPatientFile(
  patientId: string,
  file: File,
  consent: boolean,
  onProgress?: (pct: number) => void
): Promise<void> {
  if (!consent) throw new Error("consent-required");
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error("bad-type");
  if (file.size > MAX_FILE_BYTES) throw new Error("too-large");

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `clinics/${requireSession().clinicId}/patients/${patientId}/files/${uid()}.${ext}`;
  const task = uploadBytesResumable(ref(getBucket(), path), file, { contentType: file.type });
  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (s) => onProgress?.(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
      reject,
      () => resolve()
    );
  });
  const docRef = await addDoc(clinicCol("patientFiles"), {
    ...ownership(await assigneeOf(patientId)),
    patientId,
    name: file.name.slice(0, 200),
    path,
    contentType: file.type,
    size: file.size,
    consent: true,
    createdAt: serverTimestamp(),
  });
  await logAudit("create", "file", docRef.id, `رفع ملف طبي: ${file.name}`);
}

export async function listPatientFiles(patientId: string): Promise<PatientFile[]> {
  const snap = await getDocs(
    query(clinicCol("patientFiles"), ...scope(), where("patientId", "==", patientId), orderBy("createdAt", "desc"), limit(100))
  );
  return snap.docs.map((d) => fromSnap<PatientFile>(d));
}

export async function openPatientFile(file: PatientFile) {
  const blob = await getBlob(ref(getBucket(), file.path));
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function removePatientFile(file: PatientFile) {
  await deleteObject(ref(getBucket(), file.path));
  await deleteDoc(clinicDoc("patientFiles", file.id));
  await logAudit("delete", "file", file.id, `حذف ملف طبي: ${file.name}`);
}
