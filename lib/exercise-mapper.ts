import { z } from "zod";
import type { Exercise, ExerciseInput, ExerciseLevel } from "@/types/models";
import { splitCommas, splitLines } from "@/lib/utils/misc";
import { isHttpsUrl, parseYouTubeId } from "@/lib/utils/youtube";

export type ExerciseFormValues = {
  nameAr: string;
  nameEn: string;
  description: string;
  bodyPart: string;
  subcategory: string;
  level: ExerciseLevel;
  videoUrl: string;
  imageUrl: string;
  thumbnailUrl: string;
  muscles: string;
  equipment: string;
  steps: string;
  warnings: string;
  notes: string;
};

export const emptyExerciseForm: ExerciseFormValues = {
  nameAr: "",
  nameEn: "",
  description: "",
  bodyPart: "",
  subcategory: "",
  level: "beginner",
  videoUrl: "",
  imageUrl: "",
  thumbnailUrl: "",
  muscles: "",
  equipment: "",
  steps: "",
  warnings: "",
  notes: "",
};

export const exerciseSchema = z.object({
  nameAr: z.string().trim().min(2, "اكتب اسم التمرين بالعربية").max(150, "الاسم طويل جدًا"),
  nameEn: z.string().max(150, "الاسم طويل جدًا"),
  description: z.string().max(3000, "النص طويل جدًا"),
  bodyPart: z.string().min(1, "اختر الجزء المستهدف"),
  subcategory: z.string(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  videoUrl: z.string().refine((v) => v.trim() === "" || parseYouTubeId(v) !== null, "رابط YouTube غير صحيح"),
  imageUrl: z.string().refine((v) => v.trim() === "" || isHttpsUrl(v.trim()), "رابط الصورة يجب أن يبدأ بـ https://"),
  thumbnailUrl: z.string().refine((v) => v.trim() === "" || isHttpsUrl(v.trim()), "رابط الصورة المصغرة يجب أن يبدأ بـ https://"),
  muscles: z.string().max(500, "النص طويل جدًا"),
  equipment: z.string().max(500, "النص طويل جدًا"),
  steps: z.string().max(5000, "النص طويل جدًا"),
  warnings: z.string().max(3000, "النص طويل جدًا"),
  notes: z.string().max(3000, "النص طويل جدًا"),
});

export function toExerciseInput(v: ExerciseFormValues): ExerciseInput {
  return {
    nameAr: v.nameAr.trim(),
    nameEn: v.nameEn.trim(),
    description: v.description.trim(),
    bodyPart: v.bodyPart,
    subcategory: v.subcategory,
    level: v.level,
    videoUrl: v.videoUrl.trim(),
    youtubeId: parseYouTubeId(v.videoUrl),
    imageUrl: v.imageUrl.trim(),
    thumbnailUrl: v.thumbnailUrl.trim(),
    muscles: splitCommas(v.muscles),
    equipment: splitCommas(v.equipment),
    steps: splitLines(v.steps),
    warnings: v.warnings.trim(),
    notes: v.notes.trim(),
  };
}

export function toExerciseForm(e: Exercise): ExerciseFormValues {
  return {
    nameAr: e.nameAr,
    nameEn: e.nameEn,
    description: e.description,
    bodyPart: e.bodyPart,
    subcategory: e.subcategory,
    level: e.level,
    videoUrl: e.videoUrl,
    imageUrl: e.imageUrl,
    thumbnailUrl: e.thumbnailUrl,
    muscles: e.muscles.join("، "),
    equipment: e.equipment.join("، "),
    steps: e.steps.join("\n"),
    warnings: e.warnings,
    notes: e.notes,
  };
}
