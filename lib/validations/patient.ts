import { z } from "zod";

const notFuture = (s: string) => !s || new Date(s).getTime() <= Date.now();

export const personalSchema = z.object({
  fullName: z.string().trim().min(3, "اكتب الاسم الكامل (3 أحرف على الأقل)").max(120, "الاسم طويل جدًا"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{7,20}$/, "رقم الهاتف غير صحيح"),
  email: z.string().trim().email("البريد الإلكتروني غير صحيح").or(z.literal("")),
  birthDate: z.string().refine(notFuture, "تاريخ الميلاد لا يمكن أن يكون في المستقبل"),
  gender: z.enum(["male", "female"], { message: "اختر الجنس" }),
  address: z.string().max(300, "العنوان طويل جدًا"),
});

export const medicalSchema = z.object({
  chiefComplaint: z.string().trim().min(2, "اكتب الشكوى الرئيسية").max(500, "النص طويل جدًا"),
  problemStartDate: z.string().refine(notFuture, "تاريخ بداية المشكلة لا يمكن أن يكون في المستقبل"),
  diagnosis: z.string().max(1000, "النص طويل جدًا"),
  medicalHistory: z.string().max(3000, "النص طويل جدًا"),
  previousInjuries: z.string().max(2000, "النص طويل جدًا"),
  previousSurgeries: z.string().max(2000, "النص طويل جدًا"),
  medications: z.string().max(2000, "النص طويل جدًا"),
  treatmentGoals: z.string().max(2000, "النص طويل جدًا"),
});

export type PatientFormValues = {
  fullName: string;
  phone: string;
  email: string;
  birthDate: string;
  gender: "male" | "female" | "";
  address: string;
  chiefComplaint: string;
  problemStartDate: string;
  diagnosis: string;
  medicalHistory: string;
  previousInjuries: string;
  previousSurgeries: string;
  medications: string;
  treatmentGoals: string;
  notes: string;
  status: "active" | "completed" | "paused" | "inactive";
  /** only used when a manager creates a patient */
  assignedDoctorId: string;
};

export const emptyPatientForm: PatientFormValues = {
  fullName: "",
  phone: "",
  email: "",
  birthDate: "",
  gender: "",
  address: "",
  chiefComplaint: "",
  problemStartDate: "",
  diagnosis: "",
  medicalHistory: "",
  previousInjuries: "",
  previousSurgeries: "",
  medications: "",
  treatmentGoals: "",
  notes: "",
  status: "active",
  assignedDoctorId: "",
};
