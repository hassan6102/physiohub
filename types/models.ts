export type Gender = "male" | "female";
export type PatientStatus = "active" | "completed" | "paused" | "inactive" | "archived";

export interface Patient {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  birthDate: Date | null;
  gender: Gender;
  address: string;
  chiefComplaint: string;
  problemStartDate: Date | null;
  diagnosis: string;
  medicalHistory: string;
  previousInjuries: string;
  previousSurgeries: string;
  medications: string;
  treatmentGoals: string;
  notes: string;
  status: PatientStatus;
  statusBeforeArchive: PatientStatus | null;
  createdAt: Date;
  updatedAt: Date;
  /** Date of the last attended session (null if none). */
  lastVisitAt: Date | null;
  /** Creation date until the first attended session, then last attended session. Used for follow-up. */
  lastActivityAt: Date;
}

export type PatientInput = Omit<
  Patient,
  "id" | "createdAt" | "updatedAt" | "lastVisitAt" | "lastActivityAt" | "statusBeforeArchive"
>;

export type Attendance = "attended" | "absent" | "cancelled" | "late";

export interface Session {
  id: string;
  patientId: string;
  patientName: string;
  date: Date;
  durationMin: number;
  attendance: Attendance;
  painArrival: number | null;
  symptoms: string;
  condition: string;
  exercisesDone: string;
  interventions: string;
  response: string;
  assessment: string;
  nextPlan: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  deletedReason: string;
}

export type SessionInput = Omit<Session, "id" | "createdAt" | "updatedAt" | "deletedAt" | "deletedReason">;

export type ExerciseLevel = "beginner" | "intermediate" | "advanced";

export interface Exercise {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string;
  bodyPart: string;
  subcategory: string;
  level: ExerciseLevel;
  videoUrl: string;
  youtubeId: string | null;
  imageUrl: string;
  thumbnailUrl: string;
  muscles: string[];
  equipment: string[];
  steps: string[];
  warnings: string;
  notes: string;
  favorite: boolean;
  lastUsedAt: Date | null;
  sourcePublicId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ExerciseInput = Omit<Exercise, "id" | "createdAt" | "updatedAt" | "favorite" | "lastUsedAt" | "sourcePublicId">;

export type ExerciseSnapshot = Pick<
  Exercise,
  | "nameAr"
  | "nameEn"
  | "description"
  | "bodyPart"
  | "subcategory"
  | "level"
  | "youtubeId"
  | "imageUrl"
  | "steps"
  | "warnings"
  | "muscles"
  | "equipment"
>;

export interface Category {
  id: string;
  name: string;
  kind: "bodyPart" | "subcategory";
  order: number;
  createdAt: Date;
}

export interface Dosage {
  sets: number;
  reps: number;
  durationSec: number;
  restSec: number;
  timesPerDay: number;
  timesPerWeek: number;
  /** 0 = Sunday ... 6 = Saturday. Empty means every day. */
  days: number[];
  instructions: string;
  safetyNotes: string;
}

export interface PlanExercise {
  key: string;
  exerciseId: string | null;
  snapshot: ExerciseSnapshot;
  dosage: Dosage;
}

export type PlanStatus = "draft" | "published" | "archived";

export interface TreatmentPlan {
  id: string;
  patientId: string;
  patientName: string;
  title: string;
  goal: string;
  startDate: Date | null;
  endDate: Date | null;
  instructions: string;
  exercises: PlanExercise[];
  status: PlanStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type PlanInput = Omit<TreatmentPlan, "id" | "createdAt" | "updatedAt">;

export type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  startsAt: Date;
  durationMin: number;
  status: AppointmentStatus;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AppointmentInput = Omit<Appointment, "id" | "createdAt" | "updatedAt">;

export interface Measurement {
  id: string;
  patientId: string;
  date: Date;
  painLevel: number | null;
  romJoint: string;
  romDegrees: number | null;
  strength: number | null;
  balance: number | null;
  functionalScore: number | null;
  notes: string;
  createdAt: Date;
}

export type MeasurementInput = Omit<Measurement, "id" | "createdAt">;

export type FieldType = "text" | "textarea" | "number" | "date" | "select" | "checkbox" | "radio" | "rating";

export interface TemplateField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  fields: TemplateField[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecordDoc {
  id: string;
  patientId: string;
  patientName: string;
  templateId: string;
  templateName: string;
  /** Copy of the template at the time of use, so later edits never change old records. */
  templateSnapshot: { name: string; fields: TemplateField[] };
  values: Record<string, string | number | boolean | null>;
  createdAt: Date;
}

export interface PatientFile {
  id: string;
  patientId: string;
  name: string;
  path: string;
  contentType: string;
  size: number;
  consent: boolean;
  createdAt: Date;
}

export interface ActivityItem {
  id: string;
  type: string;
  message: string;
  refType: string;
  refId: string;
  createdAt: Date;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  specialty: string;
  phone: string;
  email: string;
  clinicName: string;
  address: string;
  photoUrl: string;
  status?: "active" | "disabled";
  createdAt?: Date;
}

export interface ExerciseReport {
  id: string;
  exerciseId: string;
  exerciseName: string;
  doctorId: string;
  doctorName: string;
  reason: string;
  status: "open" | "resolved";
  createdAt: Date;
}

export interface PlatformSettings {
  announcement: string;
  supportContact: string;
}

/** Link record as seen by the doctor (hashes and PINs are never stored here). */
export interface SharedProgram {
  id: string;
  doctorId: string;
  planId: string;
  planTitle: string;
  createdAt: Date;
  expiresAt: Date | null;
  revoked: boolean;
  revokedAt: Date | null;
  hasPin: boolean;
}

export interface ProgramCompletion {
  id: string;
  shareId: string;
  doctorId: string;
  planId: string;
  exerciseKey: string;
  day: string; // YYYYMMDD
  completedAt: Date;
}

/** What the patient portal receives. Contains no patient identity or medical notes. */
export interface PortalExercise {
  key: string;
  nameAr: string;
  description: string;
  steps: string[];
  youtubeId: string | null;
  imageUrl: string;
  level: ExerciseLevel;
  warnings: string;
  dosage: Dosage;
}

export interface PortalPlan {
  title: string;
  goal: string;
  instructions: string;
  startDate: string | null;
  endDate: string | null;
  doctorName: string;
  clinicName: string;
  exercises: PortalExercise[];
}
