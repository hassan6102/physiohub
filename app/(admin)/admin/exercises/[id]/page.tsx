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
import { getPublicExercise, updatePublicExercise } from "@/services/exercises.service";

export default function EditPublicExercise() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { show } = useToast();
  const [busy, setBusy] = useState(false);
  const cats = useLoad(() => getCategories("public", true), []);
  const ex = useLoad(() => getPublicExercise(id), [id]);

  const onSubmit = async (v: ExerciseFormValues) => {
    setBusy(true);
    try {
      await updatePublicExercise(id, toExerciseInput(v));
      show("success", "تم الحفظ.");
      router.replace("/admin/exercises");
    } catch (e) {
      show("error", friendlyError(e));
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="تعديل تمرين عام" breadcrumbs={[{ label: "المكتبة العامة", href: "/admin/exercises" }, { label: ex.data?.nameAr ?? "تمرين" }]} />
      {cats.loading || ex.loading ? <ListSkeleton rows={3} /> : cats.error ?? ex.error ? <ErrorState message={(cats.error ?? ex.error)!} /> : !ex.data ? <ErrorState message="التمرين غير موجود." /> : (
        <div className="card p-5 sm:p-8">
          <ExerciseForm initial={toExerciseForm(ex.data)} categories={cats.data ?? []} submitLabel="حفظ التعديلات" submitting={busy} onSubmit={onSubmit} onCancel={() => router.back()} />
        </div>
      )}
    </div>
  );
}
