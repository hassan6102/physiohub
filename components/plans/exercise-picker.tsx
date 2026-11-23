"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/form";
import { ErrorState, ListSkeleton } from "@/components/ui/states";
import { ExerciseThumb } from "@/components/exercises/media";
import { useLoad } from "@/hooks/use-load";
import { matchesQuery } from "@/lib/utils/misc";
import { getCategories } from "@/services/categories.service";
import { getMyExercises } from "@/services/exercises.service";
import type { Exercise } from "@/types/models";

/** Pick exercises from the doctor's library with one tap each; the modal stays open for adding several. */
export function ExercisePicker({
  open,
  onClose,
  onAdd,
  addedCounts,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (exercise: Exercise) => void;
  /** exerciseId -> how many times it is already in the plan */
  addedCounts: Record<string, number>;
}) {
  const [search, setSearch] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const ex = useLoad(() => getMyExercises(), [], open);
  const cats = useLoad(() => getCategories("doctor"), [], open);

  const rows = useMemo(
    () =>
      (ex.data ?? [])
        .filter((e) => !bodyPart || e.bodyPart === bodyPart)
        .filter((e) => !favOnly || e.favorite)
        .filter((e) => matchesQuery(search, e.nameAr, e.nameEn, e.muscles.join(" "))),
    [ex.data, search, bodyPart, favOnly]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="اختيار التمارين من مكتبتك"
      size="lg"
      footer={<Button onClick={onClose}>تم</Button>}
    >
      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن تمرين"
              aria-label="بحث"
              className="h-11 w-full rounded-xl border border-line ps-10 pe-3 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <Select
            aria-label="الجزء"
            value={bodyPart}
            onChange={(e) => setBodyPart(e.target.value)}
            placeholder="كل الأجزاء"
            options={(cats.data ?? []).filter((c) => c.kind === "bodyPart").map((c) => ({ value: c.name, label: c.name }))}
          />
          <Button variant={favOnly ? "primary" : "outline"} onClick={() => setFavOnly((f) => !f)} aria-pressed={favOnly}>
            المفضلة
          </Button>
        </div>

        {ex.loading ? (
          <ListSkeleton rows={4} />
        ) : ex.error ? (
          <ErrorState message={ex.error} onRetry={ex.reload} />
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            {(ex.data ?? []).length === 0 ? "مكتبتك فارغة. أضف تمارين من صفحة مكتبة التمارين أولًا." : "لا توجد تمارين مطابقة."}
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {rows.map((e) => {
              const count = addedCounts[e.id] ?? 0;
              return (
                <li key={e.id} className="flex items-center gap-3 p-3">
                  <ExerciseThumb thumbnailUrl={e.thumbnailUrl} imageUrl={e.imageUrl} youtubeId={e.youtubeId} alt={e.nameAr} className="h-14 w-20 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{e.nameAr}</p>
                    <div className="mt-1 flex flex-wrap gap-1">{e.bodyPart && <Badge tone="info">{e.bodyPart}</Badge>}</div>
                  </div>
                  <Button size="sm" variant={count ? "secondary" : "primary"} onClick={() => onAdd(e)}>
                    {count ? <Check className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
                    {count ? `أُضيف (${count})` : "إضافة"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
