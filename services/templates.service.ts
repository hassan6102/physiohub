import {
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import type { RecordDoc, Template, TemplateField } from "@/types/models";
import { getDb } from "@/lib/firebase/client";
import { DEFAULT_TEMPLATES } from "@/lib/templates/defaults";
import { uid } from "@/lib/utils/misc";
import { clean, doctorCol, doctorDoc, fromSnap } from "./base";
import { logActivity, logAudit } from "./activity.service";

/** Loads templates; on first use installs the default medical templates for this doctor. */
export async function getTemplates(): Promise<Template[]> {
  const snap = await getDocs(query(doctorCol("templates"), orderBy("createdAt", "asc"), limit(200)));
  if (snap.empty) {
    const batch = writeBatch(getDb());
    DEFAULT_TEMPLATES.forEach((tpl, i) => {
      batch.set(doc(doctorCol("templates")), {
        name: tpl.name,
        description: tpl.description,
        fields: tpl.fields.map((f) => ({ ...f, id: uid() })),
        isDefault: true,
        createdAt: new Date(Date.now() + i),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
    const again = await getDocs(query(doctorCol("templates"), orderBy("createdAt", "asc"), limit(200)));
    return again.docs.map((d) => fromSnap<Template>(d));
  }
  return snap.docs.map((d) => fromSnap<Template>(d));
}

export async function getTemplate(id: string): Promise<Template | null> {
  const snap = await getDoc(doctorDoc("templates", id));
  return snap.exists() ? fromSnap<Template>(snap) : null;
}

export async function saveTemplate(id: string | null, data: { name: string; description: string; fields: TemplateField[] }) {
  if (id) {
    await updateDoc(doctorDoc("templates", id), clean({ ...data, updatedAt: serverTimestamp() }));
    return id;
  }
  const ref = await addDoc(doctorCol("templates"), clean({ ...data, isDefault: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  return ref.id;
}

export async function deleteTemplate(id: string) {
  await deleteDoc(doctorDoc("templates", id));
}

/* ---------- Records created from templates ---------- */

export async function createRecord(input: {
  patientId: string;
  patientName: string;
  template: Template;
  values: RecordDoc["values"];
}): Promise<string> {
  const ref = await addDoc(
    doctorCol("records"),
    clean({
      patientId: input.patientId,
      patientName: input.patientName,
      templateId: input.template.id,
      templateName: input.template.name,
      // Snapshot: later template edits never change this record.
      templateSnapshot: { name: input.template.name, fields: input.template.fields },
      values: input.values,
      createdAt: serverTimestamp(),
    })
  );
  await logAudit("create", "record", ref.id, `سجل من قالب ${input.template.name}`);
  await logActivity("record.created", `${input.template.name} للمريض ${input.patientName}`, "record", ref.id);
  return ref.id;
}

export async function getRecordsForPatient(patientId: string): Promise<RecordDoc[]> {
  const snap = await getDocs(
    query(doctorCol("records"), where("patientId", "==", patientId), orderBy("createdAt", "desc"), limit(100))
  );
  return snap.docs.map((d) => fromSnap<RecordDoc>(d));
}
