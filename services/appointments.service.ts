import { addDoc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import type { Appointment, AppointmentInput, AppointmentStatus } from "@/types/models";
import { APPOINTMENT_STATUS } from "@/lib/constants";
import { endOfDay, startOfDay } from "@/lib/utils/date";
import { assigneeOf, clean, clinicCol, clinicDoc, fromSnap, ownership, scope } from "./base";
import { logActivity } from "./activity.service";

export const appointmentsForPatientQuery = (patientId: string) =>
  query(clinicCol("appointments"), ...scope(), where("patientId", "==", patientId), orderBy("startsAt", "desc"));

export const upcomingAppointmentsQuery = () =>
  query(clinicCol("appointments"), ...scope(), where("startsAt", ">=", new Date()), orderBy("startsAt", "asc"));

export async function getAppointmentsBetween(start: Date, end: Date): Promise<Appointment[]> {
  const snap = await getDocs(
    query(clinicCol("appointments"), ...scope(), where("startsAt", ">=", start), where("startsAt", "<=", end), orderBy("startsAt", "asc"), limit(500))
  );
  return snap.docs.map((d) => fromSnap<Appointment>(d));
}

/** Non-cancelled appointments on the same day that overlap the proposed time slot. */
export async function findConflicts(startsAt: Date, durationMin: number, excludeId?: string, patientId?: string): Promise<Appointment[]> {
  let sameDay = await getAppointmentsBetween(startOfDay(startsAt), endOfDay(startsAt));
  // A doctor cannot be double-booked, but two different doctors of the clinic can see patients at the same time.
  if (patientId) {
    const doctor = await assigneeOf(patientId);
    sameDay = sameDay.filter((a) => a.assignedDoctorId === doctor);
  }
  const start = startsAt.getTime();
  const end = start + durationMin * 60_000;
  return sameDay.filter((a) => {
    if (a.id === excludeId || a.status === "cancelled" || a.status === "no_show") return false;
    const aStart = a.startsAt.getTime();
    const aEnd = aStart + a.durationMin * 60_000;
    return start < aEnd && aStart < end;
  });
}

export async function createAppointment(input: AppointmentInput): Promise<string> {
  const ref = await addDoc(clinicCol("appointments"), clean({ ...input, ...ownership(await assigneeOf(input.patientId)), createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  await logActivity("appointment.created", `موعد جديد للمريض ${input.patientName}`, "appointment", ref.id);
  return ref.id;
}

export async function updateAppointment(id: string, input: Partial<AppointmentInput>) {
  // the responsible doctor is not editable here
  const { assignedDoctorId: _ignored, ...fields } = input as typeof input & { assignedDoctorId?: string };
  void _ignored;
  await updateDoc(clinicDoc("appointments", id), clean({ ...fields, updatedAt: serverTimestamp() }));
}

export async function setAppointmentStatus(a: Appointment, status: AppointmentStatus) {
  await updateDoc(clinicDoc("appointments", a.id), { status, updatedAt: serverTimestamp() });
  await logActivity("appointment.status", `${APPOINTMENT_STATUS[status].label}: موعد ${a.patientName}`, "appointment", a.id);
}
