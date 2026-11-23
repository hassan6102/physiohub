"use client";

import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LEVELS } from "@/lib/constants";
import type { Exercise, ExerciseSnapshot } from "@/types/models";
import { SafeImage, YouTubeEmbed } from "./media";

type Viewable = Pick<Exercise, "nameAr" | "nameEn" | "description" | "bodyPart" | "subcategory" | "level" | "youtubeId" | "imageUrl" | "steps" | "warnings" | "muscles" | "equipment"> &
  Partial<Pick<Exercise, "notes">>;

export function ExerciseDetail({ exercise }: { exercise: Viewable | ExerciseSnapshot }) {
  const e = exercise as Viewable;
  return (
    <div className="space-y-4">
      {e.youtubeId ? (
        <YouTubeEmbed id={e.youtubeId} title={e.nameAr} />
      ) : e.imageUrl ? (
        <SafeImage src={e.imageUrl} alt={e.nameAr} className="h-56 w-full rounded-xl" />
      ) : null}
      {e.youtubeId && e.imageUrl && <SafeImage src={e.imageUrl} alt={e.nameAr} className="h-44 w-full max-w-sm rounded-xl" />}

      <div className="flex flex-wrap gap-2">
        {e.bodyPart && <Badge tone="info">{e.bodyPart}</Badge>}
        {e.subcategory && <Badge tone="neutral">{e.subcategory}</Badge>}
        <Badge tone="success">{LEVELS[e.level]}</Badge>
      </div>
      {e.nameEn && <p className="text-sm text-muted" dir="ltr">{e.nameEn}</p>}
      {e.description && <p className="whitespace-pre-line text-sm leading-7 text-ink">{e.description}</p>}

      {e.steps.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold text-primary">خطوات الأداء</h3>
          <ol className="list-decimal space-y-1.5 ps-5 text-sm leading-7 text-ink">
            {e.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      )}

      <dl className="grid gap-3 sm:grid-cols-2">
        {e.muscles.length > 0 && (
          <div>
            <dt className="text-xs font-semibold text-muted">العضلات المستهدفة</dt>
            <dd className="text-sm">{e.muscles.join("، ")}</dd>
          </div>
        )}
        {e.equipment.length > 0 && (
          <div>
            <dt className="text-xs font-semibold text-muted">الأدوات</dt>
            <dd className="text-sm">{e.equipment.join("، ")}</dd>
          </div>
        )}
      </dl>

      {e.warnings && (
        <div className="flex gap-2 rounded-xl bg-warning/10 p-3 text-sm text-ink">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
          <p className="whitespace-pre-line leading-7">{e.warnings}</p>
        </div>
      )}
      {e.notes && (
        <div>
          <h3 className="mb-1 text-sm font-bold text-primary">ملاحظات</h3>
          <p className="whitespace-pre-line text-sm text-ink">{e.notes}</p>
        </div>
      )}
    </div>
  );
}
