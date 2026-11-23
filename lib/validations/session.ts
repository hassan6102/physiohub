import { z } from "zod";

export const sessionSchema = z.object({
  patientId: z.string().min(1, "اختر المريض"),
  date: z.string().min(1, "اختر التاريخ والوقت"),
  durationMin: z.coerce.number({ message: "أدخل المدة" }).int().min(5, "المدة لا تقل عن 5 دقائق").max(480, "المدة طويلة جدًا"),
  attendance: z.enum(["attended", "late", "absent", "cancelled"]),
  painArrival: z.string().refine((v) => v === "" || (Number(v) >= 0 && Number(v) <= 10), "مستوى الألم من 0 إلى 10"),
  symptoms: z.string().max(2000, "النص طويل جدًا"),
  condition: z.string().max(2000, "النص طويل جدًا"),
  exercisesDone: z.string().max(3000, "النص طويل جدًا"),
  interventions: z.string().max(3000, "النص طويل جدًا"),
  response: z.string().max(2000, "النص طويل جدًا"),
  assessment: z.string().max(3000, "النص طويل جدًا"),
  nextPlan: z.string().max(3000, "النص طويل جدًا"),
  notes: z.string().max(3000, "النص طويل جدًا"),
});

export type SessionFormValues = {
  patientId: string;
  date: string;
  durationMin: string;
  attendance: "attended" | "late" | "absent" | "cancelled";
  painArrival: string;
  symptoms: string;
  condition: string;
  exercisesDone: string;
  interventions: string;
  response: string;
  assessment: string;
  nextPlan: string;
  notes: string;
};
