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
import { createExercise } from "@/services/exercises.service";

export default function NewExercisePage() {
  const router = useRouter();
  const { show } = useToast();
  const [busy, setBusy] = useState(false);
  const cats = useLoad(() => getCategories("doctor"), []);

  const onSubmit = async (values: ExerciseFormValues) => {
    setBusy(true);
    try {
      await createExercise(toExerciseInput(values));
      show("success", "تمت إضافة التمرين إلى مكتبتك.");
      router.replace("/exercises");
    } catch (e) {
      show("error", friendlyError(e));
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="إضافة تمرين"
        breadcrumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "مكتبة التمارين", href: "/exercises" }, { label: "تمرين جديد" }]}
      />
      {cats.loading ? (
        <ListSkeleton rows={3} />
      ) : cats.error ? (
        <ErrorState message={cats.error} onRetry={cats.reload} />
      ) : (
        <div className="card p-5 sm:p-8">
          <ExerciseForm
            initial={emptyExerciseForm}
            categories={cats.data ?? []}
            submitLabel="حفظ التمرين"
            submitting={busy}
            onSubmit={onSubmit}
            onCancel={() => router.back()}
          />
        </div>
      )}
    </div>
  );
}
