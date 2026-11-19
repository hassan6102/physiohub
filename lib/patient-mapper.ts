import type { Patient, PatientInput } from "@/types/models";
import { fromInputDate, toInputDate } from "@/lib/utils/date";
import type { PatientFormValues } from "@/lib/validations/patient";

export function toPatientInput(v: PatientFormValues): PatientInput {
  return {
    fullName: v.fullName.trim(),
    phone: v.phone.trim(),
    email: v.email.trim(),
    birthDate: fromInputDate(v.birthDate),
    gender: v.gender === "female" ? "female" : "male",
    address: v.address.trim(),
    chiefComplaint: v.chiefComplaint.trim(),
    problemStartDate: fromInputDate(v.problemStartDate),
    diagnosis: v.diagnosis.trim(),
    medicalHistory: v.medicalHistory.trim(),
    previousInjuries: v.previousInjuries.trim(),
    previousSurgeries: v.previousSurgeries.trim(),
    medications: v.medications.trim(),
    treatmentGoals: v.treatmentGoals.trim(),
    notes: v.notes.trim(),
    status: v.status,
  };
}

export function toPatientForm(p: Patient): PatientFormValues {
  return {
    fullName: p.fullName,
    phone: p.phone,
    email: p.email,
    birthDate: toInputDate(p.birthDate),
    gender: p.gender,
    address: p.address,
    chiefComplaint: p.chiefComplaint,
    problemStartDate: toInputDate(p.problemStartDate),
    diagnosis: p.diagnosis,
    medicalHistory: p.medicalHistory,
    previousInjuries: p.previousInjuries,
    previousSurgeries: p.previousSurgeries,
    medications: p.medications,
    treatmentGoals: p.treatmentGoals,
    notes: p.notes,
    status: p.status === "archived" ? "inactive" : p.status,
  };
}
