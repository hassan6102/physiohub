import Link from "next/link";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ATTENDANCE } from "@/lib/constants";
import { formatDate, formatTime } from "@/lib/utils/date";
import type { Session } from "@/types/models";

function Detail({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <div>
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="whitespace-pre-line text-sm text-ink">{text}</dd>
    </div>
  );
}

/** Newest first. Soft-deleted sessions are shown muted so nothing disappears silently. */
export function SessionTimeline({ sessions }: { sessions: Session[] }) {
  return (
    <ol className="relative space-y-5 border-s-2 border-line ps-6">
      {sessions.map((s) => {
        const a = ATTENDANCE[s.attendance];
        return (
          <li key={s.id} className={s.deletedAt ? "opacity-60" : ""}>
            <span className="absolute -start-[9px] mt-1.5 h-4 w-4 rounded-full border-2 border-surface bg-accent" aria-hidden />
            <div className="card space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-ink">{formatDate(s.date)}</p>
                  <span className="text-sm text-muted">{formatTime(s.date)} · {s.durationMin} دقيقة</span>
                  <Badge tone={a.tone}>{a.label}</Badge>
                  {s.deletedAt && <Badge tone="danger">محذوفة</Badge>}
                  {s.createdByName && <span className="text-xs text-muted">الدكتور المنفِّذ: {s.createdByName}</span>}
                </div>
                <Link
                  href={`/sessions/${s.id}`}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-secondary hover:bg-secondary-50"
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                  فتح
                </Link>
              </div>
              {s.painArrival !== null && <p className="text-sm text-ink">الألم عند الوصول: <b>{s.painArrival}/10</b></p>}
              <dl className="grid gap-3 sm:grid-cols-2">
                <Detail label="الأعراض" text={s.symptoms} />
                <Detail label="التدخلات العلاجية" text={s.interventions} />
                <Detail label="استجابة المريض" text={s.response} />
                <Detail label="التقييم" text={s.assessment} />
                <Detail label="الخطة القادمة" text={s.nextPlan} />
                <Detail label="ملاحظات" text={s.notes} />
              </dl>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
