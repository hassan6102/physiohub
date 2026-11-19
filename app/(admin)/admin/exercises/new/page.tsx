"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExerciseForm } from "@/components/exercises/exercise-form";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState, ListSkeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useLoad } from "@/hooks/use-load";
import { emptyExerciseForm, toExerciseInput, type ExerciseFormValues } from "@/lib/exercise-mapper";
import { friendlyError } from "@/lib/utils/errors";
import { getCategories } from "@/services/categories.service";
import { createPublicExercise } from "@/services/exercises.service";

export default function NewPublicExercise() {
  const router = useRouter();
  const { show } = useToast();
  const [busy, setBusy] = useState(false);
  const cats = useLoad(() => getCategories("public", true), []);

  const onSubmit = async (v: ExerciseFormValues) => {
    setBusy(true);
    try {
      await createPublicExercise(toExerciseInput(v));
      show("success", "تمت الإضافة إلى المكتبة العامة.");
      router.replace("/admin/exercises");
    } catch (e) {
      show("error", friendlyError(e));
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="تمرين عام جديد" breadcrumbs={[{ label: "المكتبة العامة", href: "/admin/exercises" }, { label: "جديد" }]} />
      {cats.loading ? <ListSkeleton rows={3} /> : cats.error ? <ErrorState message={cats.error} onRetry={cats.reload} /> : (
        <div className="card p-5 sm:p-8">
          <ExerciseForm initial={emptyExerciseForm} categories={cats.data ?? []} submitLabel="حفظ" submitting={busy} onSubmit={onSubmit} onCancel={() => router.back()} />
        </div>
      )}
    </div>
  );
}
