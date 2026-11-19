"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ExerciseForm } from "@/components/exercises/exercise-form";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState, ListSkeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useLoad } from "@/hooks/use-load";
import { toExerciseForm, toExerciseInput, type ExerciseFormValues } from "@/lib/exercise-mapper";
import { friendlyError } from "@/lib/utils/errors";
import { getCategories } from "@/services/categories.service";
import { getExercise, updateExercise } from "@/services/exercises.service";

export default function EditExercisePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { show } = useToast();
  const [busy, setBusy] = useState(false);
  const cats = useLoad(() => getCategories("doctor"), []);
  const ex = useLoad(() => getExercise(id), [id]);

  const onSubmit = async (values: ExerciseFormValues) => {
    setBusy(true);
    try {
      await updateExercise(id, toExerciseInput(values));
      show("success", "تم حفظ التعديلات. البرامج السابقة لم تتغير.");
      router.replace("/exercises");
    } catch (e) {
      show("error", friendlyError(e));
      setBusy(false);
    }
  };

  const loading = cats.loading || ex.loading;
  const error = cats.error ?? ex.error;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="تعديل التمرين"
        description="التعديل يخص مكتبتك فقط، ولا يغيّر نسخ التمرين الموجودة داخل البرامج العلاجية القديمة."
        breadcrumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "مكتبة التمارين", href: "/exercises" }, { label: ex.data?.nameAr ?? "تمرين" }]}
      />
      {loading ? (
        <ListSkeleton rows={3} />
      ) : error ? (
        <ErrorState message={error} />
      ) : !ex.data ? (
        <ErrorState message="التمرين غير موجود." />
      ) : (
        <div className="card p-5 sm:p-8">
          <ExerciseForm
            initial={toExerciseForm(ex.data)}
            categories={cats.data ?? []}
            submitLabel="حفظ التعديلات"
            submitting={busy}
            onSubmit={onSubmit}
            onCancel={() => router.back()}
          />
        </div>
      )}
    </div>
  );
}
