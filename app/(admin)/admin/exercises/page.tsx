"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dumbbell, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState, ListSkeleton, LoadMore } from "@/components/ui/states";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { ExerciseCard } from "@/components/exercises/exercise-card";
import { usePaged } from "@/hooks/use-paged";
import { friendlyError } from "@/lib/utils/errors";
import { deletePublicExercise, publicExercisesQuery } from "@/services/exercises.service";
import type { Exercise } from "@/types/models";

export default function AdminExercises() {
  const router = useRouter();
  const confirm = useConfirm();
  const { show } = useToast();
  const p = usePaged<Exercise>({ build: publicExercisesQuery, pageSize: 24, deps: [] });

  const remove = async (e: Exercise) => {
    if (!(await confirm({ title: "حذف تمرين عام", message: `سيُحذف «${e.nameAr}» من المكتبة العامة. النسخ التي استوردها الأطباء لا تتأثر.`, confirmLabel: "حذف", danger: true }))) return;
    try {
      await deletePublicExercise(e.id);
      show("success", "تم الحذف.");
      p.reload();
    } catch (err) {
      show("error", friendlyError(err));
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="المكتبة العامة"
        actions={<Link href="/admin/exercises/new"><Button><Plus className="h-4 w-4" aria-hidden />إضافة تمرين عام</Button></Link>}
      />
      {p.loading ? (
        <ListSkeleton />
      ) : p.error ? (
        <ErrorState message={p.error} onRetry={p.reload} />
      ) : p.items.length === 0 ? (
        <EmptyState icon={Dumbbell} title="لا توجد تمارين عامة بعد" description="أضف تمارين ليستطيع الأطباء استيرادها إلى مكتباتهم." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {p.items.map((e) => (
              <ExerciseCard
                key={e.id}
                exercise={e}
                onOpen={() => router.push(`/admin/exercises/${e.id}`)}
                footer={
                  <>
                    <Button size="sm" variant="outline" onClick={() => router.push(`/admin/exercises/${e.id}`)}><Pencil className="h-4 w-4" aria-hidden />تعديل</Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(e)} aria-label="حذف"><Trash2 className="h-4 w-4 text-danger" aria-hidden /></Button>
                  </>
                }
              />
            ))}
          </div>
          <LoadMore hasMore={p.hasMore} loading={p.loadingMore} onClick={p.loadMore} />
        </>
      )}
    </div>
  );
}
