import { addDoc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import type { Appointment, AppointmentInput, AppointmentStatus } from "@/types/models";
import { APPOINTMENT_STATUS } from "@/lib/constants";
import { endOfDay, startOfDay } from "@/lib/utils/date";
import { clean, doctorCol, doctorDoc, fromSnap } from "./base";
import { logActivity } from "./activity.service";

export const appointmentsForPatientQuery = (patientId: string) =>
  query(doctorCol("appointments"), where("patientId", "==", patientId), orderBy("startsAt", "desc"));

export const upcomingAppointmentsQuery = () =>
  query(doctorCol("appointments"), where("startsAt", ">=", new Date()), orderBy("startsAt", "asc"));

export async function getAppointmentsBetween(start: Date, end: Date): Promise<Appointment[]> {
  const snap = await getDocs(
    query(doctorCol("appointments"), where("startsAt", ">=", start), where("startsAt", "<=", end), orderBy("startsAt", "asc"), limit(500))
  );
  return snap.docs.map((d) => fromSnap<Appointment>(d));
}

/** Non-cancelled appointments on the same day that overlap the proposed time slot. */
export async function findConflicts(startsAt: Date, durationMin: number, excludeId?: string): Promise<Appointment[]> {
  const sameDay = await getAppointmentsBetween(startOfDay(startsAt), endOfDay(startsAt));
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
  const ref = await addDoc(doctorCol("appointments"), clean({ ...input, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  await logActivity("appointment.created", `موعد جديد للمريض ${input.patientName}`, "appointment", ref.id);
  return ref.id;
}

export async function updateAppointment(id: string, input: Partial<AppointmentInput>) {
  await updateDoc(doctorDoc("appointments", id), clean({ ...input, updatedAt: serverTimestamp() }));
}

export async function setAppointmentStatus(a: Appointment, status: AppointmentStatus) {
  await updateDoc(doctorDoc("appointments", a.id), { status, updatedAt: serverTimestamp() });
  await logActivity("appointment.status", `${APPOINTMENT_STATUS[status].label}: موعد ${a.patientName}`, "appointment", a.id);
}
