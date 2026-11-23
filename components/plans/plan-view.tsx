"use client";

import { AlertTriangle, Check, Info, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LazyYouTube, SafeImage } from "@/components/exercises/media";
import { LEVELS, WEEKDAYS } from "@/lib/constants";
import { describeDosage } from "@/lib/plan-utils";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import type { PortalPlan } from "@/types/models";

/**
 * One component for what the patient sees. Used by the patient page (with completion buttons)
 * and by the doctor's preview (without them), so the preview is exactly what the patient gets.
 */
export function PlanView({
  plan,
  doneKeys,
  onToggle,
  pendingKey,
}: {
  plan: PortalPlan;
  /** exercise keys completed today; when omitted no completion buttons are shown */
  doneKeys?: Set<string>;
  onToggle?: (key: string) => void;
  pendingKey?: string | null;
}) {
  const withActions = Boolean(doneKeys && onToggle);
  const total = plan.exercises.length;
  const doneCount = doneKeys ? plan.exercises.filter((e) => doneKeys.has(e.key)).length : 0;

  return (
    <div className="space-y-5">
      <header className="card space-y-3 p-5">
        <h1 className="text-xl font-bold text-primary">{plan.title}</h1>
        {(plan.doctorName || plan.clinicName) && (
          <p className="text-sm text-muted">
            {plan.doctorName && <>الأخصائي: <b className="text-ink">{plan.doctorName}</b></>}
            {plan.doctorName && plan.clinicName && " · "}
            {plan.clinicName}
          </p>
        )}
        {(plan.startDate || plan.endDate) && (
          <p className="text-sm text-muted">
            من {plan.startDate ? formatDate(new Date(plan.startDate)) : "—"} إلى {plan.endDate ? formatDate(new Date(plan.endDate)) : "—"}
          </p>
        )}
        {plan.goal && (
          <div>
            <p className="text-xs font-semibold text-muted">الهدف</p>
            <p className="whitespace-pre-line text-sm text-ink">{plan.goal}</p>
          </div>
        )}
        {plan.instructions && (
          <div className="rounded-xl bg-accent-50 p-3">
            <p className="mb-1 text-xs font-bold text-accent-600">تعليمات عامة</p>
            <p className="whitespace-pre-line text-sm leading-7 text-ink">{plan.instructions}</p>
          </div>
        )}
        {withActions && total > 0 && (
          <div className="space-y-1.5" aria-live="polite">
            <p className="text-sm font-semibold text-ink">أنجزت اليوم {doneCount} من {total}</p>
            <div className="h-2.5 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(doneCount / total) * 100}%` }} />
            </div>
          </div>
        )}
      </header>

      <ol className="space-y-4">
        {plan.exercises.map((e, i) => {
          const done = doneKeys?.has(e.key) ?? false;
          const days = e.dosage.days.length ? WEEKDAYS.filter((d) => e.dosage.days.includes(d.value)).map((d) => d.label).join("، ") : "كل يوم";
          return (
            <li key={e.key} className={cn("card space-y-4 p-4 sm:p-5", done && "border-accent")}>
              <div className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-ink">{e.nameAr}</h2>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Badge tone="success">{LEVELS[e.level]}</Badge>
                  </div>
                </div>
              </div>

              {e.youtubeId ? <LazyYouTube id={e.youtubeId} title={e.nameAr} /> : e.imageUrl ? <SafeImage src={e.imageUrl} alt={e.nameAr} className="h-52 w-full rounded-xl" /> : null}

              <div className="rounded-xl bg-canvas p-3">
                <p className="text-sm font-bold text-primary">{describeDosage(e.dosage) || "بدون جرعة محددة"}</p>
                <p className="mt-1 text-xs text-muted">أيام التنفيذ: {days}</p>
              </div>

              {e.description && <p className="whitespace-pre-line text-sm leading-7 text-ink">{e.description}</p>}
              {e.steps.length > 0 && (
                <ol className="list-decimal space-y-1 ps-5 text-sm leading-7 text-ink">
                  {e.steps.map((s, k) => (
                    <li key={k}>{s}</li>
                  ))}
                </ol>
              )}
              {e.dosage.instructions && (
                <div className="flex gap-2 rounded-xl bg-secondary-50 p-3 text-sm">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-secondary" aria-hidden />
                  <p className="whitespace-pre-line leading-7 text-ink">{e.dosage.instructions}</p>
                </div>
              )}
              {(e.dosage.safetyNotes || e.warnings) && (
                <div className="flex gap-2 rounded-xl bg-warning/10 p-3 text-sm">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
                  <p className="whitespace-pre-line leading-7 text-ink">{[e.dosage.safetyNotes, e.warnings].filter(Boolean).join("\n")}</p>
                </div>
              )}

              {withActions && (
                <Button
                  size="lg"
                  variant={done ? "secondary" : "primary"}
                  className="w-full"
                  onClick={() => onToggle?.(e.key)}
                  disabled={pendingKey === e.key}
                  aria-pressed={done}
                >
                  {pendingKey === e.key ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : done ? <Check className="h-5 w-5" aria-hidden /> : null}
                  {done ? "تم تسجيل الإنجاز (اضغط للتراجع)" : "تم إنجاز التمرين"}
                </Button>
              )}
            </li>
          );
        })}
      </ol>

      {withActions && (
        <p className="text-center text-xs leading-6 text-muted">
          تسجيل الإنجاز يعتمد على إقرارك بنفسك ويُرسل لأخصائيك للمتابعة، ولا يُثبت جودة الأداء أو صحة تنفيذ التمرين.
          عند الشعور بألم شديد أو أعراض غير معتادة أوقف التمرين وتواصل مع أخصائيك.
        </p>
      )}
    </div>
  );
}
