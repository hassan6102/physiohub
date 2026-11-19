"use client";

import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { LEVELS } from "@/lib/constants";
import type { Exercise } from "@/types/models";
import { ExerciseThumb } from "./media";

export function ExerciseCard({
  exercise,
  onOpen,
  onToggleFavorite,
  footer,
}: {
  exercise: Exercise;
  onOpen: () => void;
  onToggleFavorite?: () => void;
  footer?: React.ReactNode;
}) {
  return (
    <article className="card relative flex flex-col overflow-hidden">
      <button onClick={onOpen} className="relative block text-start" aria-label={`تفاصيل ${exercise.nameAr}`}>
        <ExerciseThumb
          thumbnailUrl={exercise.thumbnailUrl}
          imageUrl={exercise.imageUrl}
          youtubeId={exercise.youtubeId}
          alt={exercise.nameAr}
          className="aspect-video w-full"
        />
      </button>
      {onToggleFavorite && (
        <button
          onClick={onToggleFavorite}
          aria-label={exercise.favorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
          aria-pressed={exercise.favorite}
          className="absolute end-2 top-2 grid h-10 w-10 place-items-center rounded-full bg-surface/90 shadow-card"
        >
          <Heart className={cn("h-5 w-5", exercise.favorite ? "fill-danger text-danger" : "text-muted")} />
        </button>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <button onClick={onOpen} className="text-start">
          <h3 className="line-clamp-2 font-bold text-ink">{exercise.nameAr}</h3>
        </button>
        <div className="flex flex-wrap gap-1.5">
          {exercise.bodyPart && <Badge tone="info">{exercise.bodyPart}</Badge>}
          {exercise.subcategory && <Badge tone="neutral">{exercise.subcategory}</Badge>}
          <Badge tone="success">{LEVELS[exercise.level]}</Badge>
        </div>
        {footer && <div className="mt-auto flex flex-wrap gap-2 pt-2">{footer}</div>}
      </div>
    </article>
  );
}
