import { collection, getCountFromServer, getDocs, limit, query, where } from "firebase/firestore";
import type { Appointment, AppointmentStatus, ProgramCompletion, TreatmentPlan } from "@/types/models";
import { getDb } from "@/lib/firebase/client";
import { computeAdherence } from "@/lib/plan-utils";
import { clamp } from "@/lib/utils/misc";
import { clinicCol, fromSnap, scope } from "./base";
import { requireSession } from "@/lib/session";
import { getAppointmentsBetween } from "./appointments.service";
import { getMeasurementsBetween } from "./measurements.service";
import { getSessionsBetween } from "./sessions.service";
import { countPatients } from "./patients.service";

export type ReportData = {
  totalPatients: number;
  activePatients: number;
  newPatients: number;
  sessionsTotal: number;
  sessionsAttended: number;
  sessionsAbsent: number;
  appointmentsByStatus: Record<AppointmentStatus, number>;
  plansCreated: number;
  plansPublished: number;
  completionsInRange: number;
  adherence: { planId: string; title: string; patientName: string; percent: number | null; done: number; expected: number }[];
  progress: { patientsWithTrend: number; avgPainChange: number | null; improved: number; worsened: number };
};

export async function getReport(start: Date, end: Date): Promise<ReportData> {
  const [totalPatients, activePatients, newPatients, sessions, appointments, plansSnap, measurements, completionsSnap] = await Promise.all([
    countPatients(),
    countPatients("active"),
    getCountFromServer(query(clinicCol("patients"), ...scope(), where("createdAt", ">=", start), where("createdAt", "<=", end))).then((s) => s.data().count),
    getSessionsBetween(start, end),
    getAppointmentsBetween(start, end),
    getDocs(query(clinicCol("treatmentPlans"), ...scope(), where("createdAt", ">=", start), where("createdAt", "<=", end), limit(500))),
    getMeasurementsBetween(start, end),
    getDocs(
      query(
        collection(getDb(), "programCompletions"),
        where("clinicId", "==", requireSession().clinicId),
        ...scope(),
        where("completedAt", ">=", start),
        where("completedAt", "<=", end),
        limit(5000)
      )
    ),
  ]);

  const plansInRange = plansSnap.docs.map((d) => fromSnap<TreatmentPlan>(d));
  const byStatus: Record<AppointmentStatus, number> = { scheduled: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0 };
  (appointments as Appointment[]).forEach((a) => (byStatus[a.status] += 1));

  // Adherence for plans that are currently published (uses all completions of each plan).
  const publishedSnap = await getDocs(query(clinicCol("treatmentPlans"), ...scope(), where("status", "==", "published"), limit(25)));
  const published = publishedSnap.docs.map((d) => fromSnap<TreatmentPlan>(d));
  const adherence = await Promise.all(
    published.map(async (plan) => {
      const snap = await getDocs(
        query(collection(getDb(), "programCompletions"), where("clinicId", "==", requireSession().clinicId), ...scope(), where("planId", "==", plan.id), limit(3000))
      );
      const completions = snap.docs.map((d) => fromSnap<ProgramCompletion>(d));
      const a = computeAdherence(plan, completions);
      return { planId: plan.id, title: plan.title, patientName: plan.patientName, percent: a.percent, done: a.done, expected: a.expected };
    })
  );

  // Pain trend per patient inside the range (needs at least two pain readings).
  const byPatient = new Map<string, number[]>();
  measurements.forEach((m) => {
    if (m.painLevel === null) return;
    byPatient.set(m.patientId, [...(byPatient.get(m.patientId) ?? []), m.painLevel]);
  });
  const changes: number[] = [];
  byPatient.forEach((vals) => {
    if (vals.length >= 2) changes.push(vals[vals.length - 1] - vals[0]);
  });

  return {
    totalPatients,
    activePatients,
    newPatients,
    sessionsTotal: sessions.length,
    sessionsAttended: sessions.filter((s) => s.attendance === "attended" || s.attendance === "late").length,
    sessionsAbsent: sessions.filter((s) => s.attendance === "absent").length,
    appointmentsByStatus: byStatus,
    plansCreated: plansInRange.length,
    plansPublished: plansInRange.filter((p) => p.status === "published").length,
    completionsInRange: completionsSnap.size,
    adherence,
    progress: {
      patientsWithTrend: changes.length,
      avgPainChange: changes.length ? Math.round((changes.reduce((a, b) => a + b, 0) / changes.length) * 10) / 10 : null,
      improved: changes.filter((c) => c < 0).length,
      worsened: changes.filter((c) => c > 0).length,
    },
  };
}

export const clampPercent = (n: number) => clamp(n, 0, 100);
