"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, GripVertical, Trash2 } from "lucide-react";
import { Textarea, TextInput } from "@/components/ui/form";
import { WEEKDAYS } from "@/lib/constants";
import { describeDosage } from "@/lib/plan-utils";
import { cn } from "@/lib/utils/cn";
import { clamp } from "@/lib/utils/misc";
import type { Dosage, PlanExercise } from "@/types/models";
import { ExerciseThumb } from "@/components/exercises/media";

type NumKey = "sets" | "reps" | "durationSec" | "restSec" | "timesPerDay" | "timesPerWeek";
const NUMS: { key: NumKey; label: string; max: number }[] = [
  { key: "sets", label: "المجموعات", max: 20 },
  { key: "reps", label: "التكرارات", max: 200 },
  { key: "durationSec", label: "المدة (ثانية)", max: 3600 },
  { key: "restSec", label: "الراحة (ثانية)", max: 600 },
  { key: "timesPerDay", label: "مرات يوميًا", max: 10 },
  { key: "timesPerWeek", label: "أيام أسبوعيًا", max: 7 },
];

export function PlanExerciseItem({
  item,
  index,
  total,
  onChange,
  onRemove,
  onMove,
  dragHandlers,
}: {
  item: PlanExercise;
  index: number;
  total: number;
  onChange: (dosage: Dosage) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  dragHandlers: {
    onHandleDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    dragging: boolean;
  };
}) {
  const [open, setOpen] = useState(false);
  const d = item.dosage;
  const setNum = (key: NumKey, raw: string, max: number) => onChange({ ...d, [key]: raw === "" ? 0 : clamp(Math.floor(Number(raw)) || 0, 0, max) });
  const toggleDay = (day: number) => onChange({ ...d, days: d.days.includes(day) ? d.days.filter((x) => x !== day) : [...d.days, day] });

  return (
    <li
      onDragOver={dragHandlers.onDragOver}
      onDrop={dragHandlers.onDrop}
      className={cn("card overflow-hidden transition-opacity", dragHandlers.dragging && "opacity-40")}
    >
      <div className="flex items-center gap-2 p-3">
        <span
          draggable
          onDragStart={dragHandlers.onHandleDragStart}
          onDragEnd={dragHandlers.onDragEnd}
          className="hidden cursor-grab touch-none text-muted md:block"
          title="اسحب لإعادة الترتيب"
          aria-hidden
        >
          <GripVertical className="h-5 w-5" />
        </span>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">{index + 1}</span>
        <ExerciseThumb imageUrl={item.snapshot.imageUrl} youtubeId={item.snapshot.youtubeId} alt={item.snapshot.nameAr} className="hidden h-12 w-16 shrink-0 rounded-lg sm:block" />
        <button type="button" onClick={() => setOpen((o) => !o)} className="min-w-0 flex-1 text-start" aria-expanded={open}>
          <p className="truncate font-bold text-ink">{item.snapshot.nameAr}</p>
          <p className="truncate text-xs text-muted">{describeDosage(d) || "بدون جرعة"}</p>
        </button>
        <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label="تحريك لأعلى" className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-canvas disabled:opacity-30">
          <ArrowUp className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} aria-label="تحريك لأسفل" className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-canvas disabled:opacity-30">
          <ArrowDown className="h-4 w-4" />
        </button>
        <button type="button" onClick={onRemove} aria-label="إزالة التمرين" className="grid h-10 w-10 place-items-center rounded-lg text-danger hover:bg-danger/5">
          <Trash2 className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-label="تعديل الجرعة" className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-canvas">
          <ChevronDown className={cn("h-5 w-5 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <div className="space-y-4 border-t border-line bg-canvas/50 p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {NUMS.map((n) => (
              <TextInput
                key={n.key}
                label={n.label}
                type="number"
                inputMode="numeric"
                dir="ltr"
                min={0}
                max={n.max}
                value={d[n.key] === 0 ? "" : String(d[n.key])}
                placeholder="0"
                onChange={(e) => setNum(n.key, e.target.value, n.max)}
              />
            ))}
          </div>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink">أيام التنفيذ <span className="text-xs font-normal text-muted">(بدون اختيار = كل يوم)</span></p>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((w) => (
                <button
                  key={w.value}
                  type="button"
                  aria-pressed={d.days.includes(w.value)}
                  onClick={() => toggleDay(w.value)}
                  className={cn("h-10 rounded-xl border px-3 text-sm font-semibold", d.days.includes(w.value) ? "border-primary bg-primary text-white" : "border-line bg-surface text-ink")}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
          <Textarea label="تعليمات خاصة بهذا المريض" value={d.instructions} onChange={(e) => onChange({ ...d, instructions: e.target.value })} />
          <Textarea label="ملاحظات السلامة" value={d.safetyNotes} onChange={(e) => onChange({ ...d, safetyNotes: e.target.value })} />
          <p className="text-xs text-muted">هذه الجرعة خاصة بهذا البرنامج فقط، ولا تغيّر التمرين الأصلي في مكتبتك.</p>
        </div>
      )}
    </li>
  );
}
