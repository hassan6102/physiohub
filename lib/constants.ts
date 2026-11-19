import type { AppointmentStatus, Attendance, ExerciseLevel, FieldType, PatientStatus, PlanStatus } from "@/types/models";

export const PATIENT_STATUS: Record<PatientStatus, { label: string; tone: "success" | "info" | "warning" | "neutral" | "danger" }> = {
  active: { label: "نشط", tone: "success" },
  completed: { label: "مكتمل", tone: "info" },
  paused: { label: "متوقف مؤقتًا", tone: "warning" },
  inactive: { label: "غير نشط", tone: "neutral" },
  archived: { label: "مؤرشف", tone: "danger" },
};

export const ATTENDANCE: Record<Attendance, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  attended: { label: "حضر", tone: "success" },
  late: { label: "حضر متأخرًا", tone: "warning" },
  absent: { label: "تغيب", tone: "danger" },
  cancelled: { label: "ألغى", tone: "neutral" },
};

export const LEVELS: Record<ExerciseLevel, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
};

export const PLAN_STATUS: Record<PlanStatus, { label: string; tone: "success" | "warning" | "neutral" }> = {
  draft: { label: "مسودة", tone: "warning" },
  published: { label: "منشور", tone: "success" },
  archived: { label: "مؤرشف", tone: "neutral" },
};

export const APPOINTMENT_STATUS: Record<AppointmentStatus, { label: string; tone: "info" | "success" | "neutral" | "danger" | "warning" }> = {
  scheduled: { label: "محجوز", tone: "info" },
  confirmed: { label: "مؤكد", tone: "success" },
  completed: { label: "تمّ", tone: "neutral" },
  cancelled: { label: "ملغي", tone: "danger" },
  no_show: { label: "لم يحضر", tone: "warning" },
};

export const FIELD_TYPES: Record<FieldType, string> = {
  text: "نص قصير",
  textarea: "نص طويل",
  number: "رقم",
  date: "تاريخ",
  select: "قائمة اختيار",
  checkbox: "مربع اختيار",
  radio: "اختيار واحد",
  rating: "تقييم (1-5)",
};

/** 0 = Sunday. Displayed starting Saturday, the usual first day of the week in Arab countries. */
export const WEEKDAYS = [
  { value: 6, label: "السبت" },
  { value: 0, label: "الأحد" },
  { value: 1, label: "الاثنين" },
  { value: 2, label: "الثلاثاء" },
  { value: 3, label: "الأربعاء" },
  { value: 4, label: "الخميس" },
  { value: 5, label: "الجمعة" },
];

export const DEFAULT_BODY_PARTS = [
  "الرقبة",
  "الظهر",
  "الكتف",
  "الكوع",
  "الرسغ واليد",
  "الورك",
  "الركبة",
  "الكاحل والقدم",
  "الجذع (Core)",
  "التوازن",
  "المشي",
];

export const DEFAULT_SUBCATEGORIES = [
  "الحركة (Mobility)",
  "الإطالة",
  "التقوية",
  "الثبات",
  "مدى الحركة",
  "التوازن",
  "التأهيل",
];

export const PAIN_LABELS = ["لا ألم", "خفيف جدًا", "خفيف", "خفيف", "متوسط", "متوسط", "متوسط إلى شديد", "شديد", "شديد", "شديد جدًا", "أقصى ألم"];

export const EMPTY_DOSAGE = {
  sets: 3,
  reps: 10,
  durationSec: 0,
  restSec: 30,
  timesPerDay: 1,
  timesPerWeek: 3,
  days: [] as number[],
  instructions: "",
  safetyNotes: "",
};
