import { getCountFromServer, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import type { Appointment, Patient, Session } from "@/types/models";
import { addDays, endOfDay, startOfDay } from "@/lib/utils/date";
import { doctorCol, fromSnap } from "./base";
import { getAppointmentsBetween } from "./appointments.service";
import { countPatients } from "./patients.service";
import { countPublishedPlans } from "./plans.service";
import { getSessionsBetween } from "./sessions.service";

export const FOLLOW_UP_DAYS = 14;

export type DashboardData = {
  totalPatients: number;
  activePatients: number;
  newPatients: number;
  sessionsToday: number;
  upcomingAppointments: number;
  publishedPlans: number;
  followUpCount: number;
  todaySchedule: Appointment[];
  recentPatients: Patient[];
  followUp: Patient[];
  todaySessions: Session[];
};

/** Every number comes from real queries; nothing is hard-coded. */
export async function getDashboard(): Promise<DashboardData> {
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const cutoff = addDays(now, -FOLLOW_UP_DAYS);
  const monthAgo = addDays(now, -30);

  const [
    totalPatients,
    activePatients,
    newPatients,
    todaySessions,
    todaySchedule,
    upcomingSnap,
    publishedPlans,
    followUpSnap,
    followUpCount,
    recentSnap,
  ] = await Promise.all([
    countPatients(),
    countPatients("active"),
    getCountFromServer(query(doctorCol("patients"), where("createdAt", ">=", monthAgo))).then((s) => s.data().count),
    getSessionsBetween(dayStart, dayEnd),
    getAppointmentsBetween(dayStart, dayEnd),
    getDocs(query(doctorCol("appointments"), where("startsAt", ">=", now), orderBy("startsAt", "asc"), limit(100))),
    countPublishedPlans(),
    getDocs(
      query(doctorCol("patients"), where("status", "==", "active"), where("lastActivityAt", "<", cutoff), orderBy("lastActivityAt", "asc"), limit(8))
    ),
    getCountFromServer(
      query(doctorCol("patients"), where("status", "==", "active"), where("lastActivityAt", "<", cutoff))
    ).then((s) => s.data().count),
    getDocs(query(doctorCol("patients"), orderBy("createdAt", "desc"), limit(8))),
  ]);

  const upcoming = upcomingSnap.docs
    .map((d) => fromSnap<Appointment>(d))
    .filter((a) => a.status === "scheduled" || a.status === "confirmed");

  return {
    totalPatients,
    activePatients,
    newPatients,
    sessionsToday: todaySessions.length,
    upcomingAppointments: upcoming.length,
    publishedPlans,
    followUpCount,
    todaySchedule: todaySchedule.filter((a) => a.status !== "cancelled"),
    recentPatients: recentSnap.docs.map((d) => fromSnap<Patient>(d)).filter((p) => p.status !== "archived").slice(0, 5),
    followUp: followUpSnap.docs.map((d) => fromSnap<Patient>(d)),
    todaySessions,
  };
}
