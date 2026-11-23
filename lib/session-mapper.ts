import type { Session, SessionInput } from "@/types/models";
import { fromInputDateTime, toInputDateTime } from "@/lib/utils/date";
import type { SessionFormValues } from "@/lib/validations/session";

export function emptySessionForm(patientId = ""): SessionFormValues {
  return {
    patientId,
    date: toInputDateTime(new Date()),
    durationMin: "45",
    attendance: "attended",
    painArrival: "",
    symptoms: "",
    condition: "",
    exercisesDone: "",
    interventions: "",
    response: "",
    assessment: "",
    nextPlan: "",
    notes: "",
  };
}

export function toSessionForm(s: Session): SessionFormValues {
  return {
    patientId: s.patientId,
    date: toInputDateTime(s.date),
    durationMin: String(s.durationMin),
    attendance: s.attendance,
    painArrival: s.painArrival === null ? "" : String(s.painArrival),
    symptoms: s.symptoms,
    condition: s.condition,
    exercisesDone: s.exercisesDone,
    interventions: s.interventions,
    response: s.response,
    assessment: s.assessment,
    nextPlan: s.nextPlan,
    notes: s.notes,
  };
}

export function toSessionInput(v: SessionFormValues, patientName: string): SessionInput {
  const attended = v.attendance === "attended" || v.attendance === "late";
  return {
    patientId: v.patientId,
    patientName,
    date: fromInputDateTime(v.date) ?? new Date(),
    durationMin: Number(v.durationMin),
    attendance: v.attendance,
    painArrival: attended && v.painArrival !== "" ? Number(v.painArrival) : null,
    symptoms: v.symptoms.trim(),
    condition: v.condition.trim(),
    exercisesDone: v.exercisesDone.trim(),
    interventions: v.interventions.trim(),
    response: v.response.trim(),
    assessment: v.assessment.trim(),
    nextPlan: v.nextPlan.trim(),
    notes: v.notes.trim(),
  };
}
