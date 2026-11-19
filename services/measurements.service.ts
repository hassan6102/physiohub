import { addDoc, getDocs, limit, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import type { Measurement, MeasurementInput } from "@/types/models";
import { clean, doctorCol, fromSnap } from "./base";
import { logAudit } from "./activity.service";

export async function addMeasurement(input: MeasurementInput): Promise<string> {
  const ref = await addDoc(doctorCol("measurements"), clean({ ...input, createdAt: serverTimestamp() }));
  await logAudit("create", "measurement", ref.id, "تسجيل قياس جديد");
  return ref.id;
}

export async function getMeasurements(patientId: string): Promise<Measurement[]> {
  const snap = await getDocs(
    query(doctorCol("measurements"), where("patientId", "==", patientId), orderBy("date", "asc"), limit(500))
  );
  return snap.docs.map((d) => fromSnap<Measurement>(d));
}

export async function getMeasurementsBetween(start: Date, end: Date): Promise<Measurement[]> {
  const snap = await getDocs(
    query(doctorCol("measurements"), where("date", ">=", start), where("date", "<=", end), orderBy("date", "asc"), limit(2000))
  );
  return snap.docs.map((d) => fromSnap<Measurement>(d));
}
