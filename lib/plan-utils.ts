import type { Dosage, Exercise, ExerciseSnapshot, PlanExercise, TreatmentPlan } from "@/types/models";
import { EMPTY_DOSAGE } from "@/lib/constants";
import { addDays, dayKey, startOfDay } from "@/lib/utils/date";
import { uid } from "@/lib/utils/misc";

/** Copy of the exercise data at the time it is added to a plan. */
export function snapshotFromExercise(e: Exercise): ExerciseSnapshot {
  return {
    nameAr: e.nameAr,
    nameEn: e.nameEn,
    description: e.description,
    bodyPart: e.bodyPart,
    subcategory: e.subcategory,
    level: e.level,
    youtubeId: e.youtubeId,
    imageUrl: e.imageUrl,
    steps: [...e.steps],
    warnings: e.warnings,
    muscles: [...e.muscles],
    equipment: [...e.equipment],
  };
}

export function planExerciseFrom(e: Exercise): PlanExercise {
  return {
    key: uid(),
    exerciseId: e.id,
    snapshot: snapshotFromExercise(e),
    dosage: { ...EMPTY_DOSAGE, days: [] },
  };
}

export function describeDosage(d: Dosage): string {
  const parts: string[] = [];
  if (d.sets && d.reps) parts.push(`${d.sets} مجموعات × ${d.reps} تكرار`);
  else if (d.reps) parts.push(`${d.reps} تكرار`);
  if (d.durationSec) parts.push(`${d.durationSec} ثانية`);
  if (d.restSec) parts.push(`راحة ${d.restSec} ثانية`);
  if (d.timesPerDay) parts.push(`${d.timesPerDay} مرة يوميًا`);
  if (d.timesPerWeek) parts.push(`${d.timesPerWeek} أيام أسبوعيًا`);
  return parts.join(" · ");
}

/**
 * Adherence is based on the patient's own "mark as completed" taps (self-reported).
 * Expected = every planned day from the start date up to today (or the end date).
 * A planned day is any weekday in `dosage.days` (every day when empty).
 */
export function computeAdherence(
  plan: Pick<TreatmentPlan, "startDate" | "endDate" | "exercises">,
  completions: { exerciseKey: string; day: string }[],
  now = new Date()
) {
  const start = plan.startDate ? startOfDay(plan.startDate) : null;
  if (!start || plan.exercises.length === 0) return { expected: 0, done: 0, percent: null as number | null };
  const last = plan.endDate && plan.endDate < now ? startOfDay(plan.endDate) : startOfDay(now);
  const done = new Set(completions.map((c) => `${c.exerciseKey}:${c.day}`));
  let expected = 0;
  let completed = 0;
  for (let d = start; d <= last; d = addDays(d, 1)) {
    for (const ex of plan.exercises) {
      const days = ex.dosage.days;
      if (days.length === 0 || days.includes(d.getDay())) {
        expected++;
        if (done.has(`${ex.key}:${dayKey(d)}`)) completed++;
      }
    }
  }
  return { expected, done: completed, percent: expected ? Math.round((completed / expected) * 100) : null };
}

/** Same shape the patient portal receives; used for the doctor's preview. */
export function toPortalPlan(
  plan: Pick<TreatmentPlan, "title" | "goal" | "instructions" | "startDate" | "endDate" | "exercises">,
  doctorName = "",
  clinicName = ""
): import("@/types/models").PortalPlan {
  return {
    title: plan.title || "برنامج علاجي",
    goal: plan.goal,
    instructions: plan.instructions,
    startDate: plan.startDate ? plan.startDate.toISOString() : null,
    endDate: plan.endDate ? plan.endDate.toISOString() : null,
    doctorName,
    clinicName,
    exercises: plan.exercises.map((e) => ({
      key: e.key,
      nameAr: e.snapshot.nameAr,
      description: e.snapshot.description,
      steps: e.snapshot.steps,
      youtubeId: e.snapshot.youtubeId ?? null,
      imageUrl: e.snapshot.imageUrl ?? "",
      level: e.snapshot.level,
      warnings: e.snapshot.warnings,
      dosage: e.dosage,
    })),
  };
}
