"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/states";
import { Segmented } from "@/components/ui/form";
import { RowMenu } from "@/components/ui/menu";
import { useToast } from "@/components/ui/toast";
import { AppointmentForm } from "@/components/appointments/appointment-form";
import { useLoad } from "@/hooks/use-load";
import { APPOINTMENT_STATUS } from "@/lib/constants";
import { addDays, endOfMonth, formatDate, formatMonthYear, formatTime, formatWeekday, isSameDay, startOfMonth } from "@/lib/utils/date";
import { friendlyError } from "@/lib/utils/errors";
import { cn } from "@/lib/utils/cn";
import { getAppointmentsBetween, setAppointmentStatus } from "@/services/appointments.service";
import type { Appointment, AppointmentStatus } from "@/types/models";

type View = "month" | "list";
const WEEK = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const satIndex = (d: Date) => (d.getDay() + 1) % 7; // Saturday = 0

function Inner() {
  const { show } = useToast();
  const params = useSearchParams();
  const [view, setView] = useState<View>("month");
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(new Date());
  const [form, setForm] = useState<{ appt: Appointment | null; key: number } | null>(
    params.get("patientId") ? { appt: null, key: 0 } : null
  );
  const { data, loading, error, reload } = useLoad(() => getAppointmentsBetween(month, endOfMonth(month)), [month.getTime()]);

  const grid = useMemo(() => {
    const first = addDays(month, -satIndex(month));
    return Array.from({ length: 42 }, (_, i) => addDays(first, i));
  }, [month]);

  const byDay = (d: Date) => (data ?? []).filter((a) => isSameDay(a.startsAt, d));
  const dayList = byDay(selected);

  const setStatus = async (a: Appointment, s: AppointmentStatus) => {
    try { await setAppointmentStatus(a, s); show("success", "تم تحديث الحالة."); reload(); } catch (e) { show("error", friendlyError(e)); }
  };

  const Row = ({ a }: { a: Appointment }) => (
    <li className="flex flex-wrap items-center gap-3 p-3">
      <span className="w-16 text-sm font-bold text-primary" dir="ltr">{formatTime(a.startsAt)}</span>
      <div className="min-w-0 flex-1">
        <Link href={`/patients/${a.patientId}`} className="font-semibold text-ink hover:text-secondary">{a.patientName}</Link>
        <p className="text-xs text-muted">{a.durationMin} دقيقة{a.notes ? ` · ${a.notes}` : ""}</p>
      </div>
      <Badge tone={APPOINTMENT_STATUS[a.status].tone}>{APPOINTMENT_STATUS[a.status].label}</Badge>
      <RowMenu items={[
        { label: "تعديل / إعادة جدولة", onClick: () => setForm({ appt: a, key: Date.now() }) },
        { label: "تأكيد", onClick: () => setStatus(a, "confirmed") },
        { label: "تمّ", onClick: () => setStatus(a, "completed") },
        { label: "لم يحضر", onClick: () => setStatus(a, "no_show") },
        { label: "إلغاء الموعد", danger: true, onClick: () => setStatus(a, "cancelled") },
      ]} />
    </li>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="المواعيد"
        breadcrumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "المواعيد" }]}
        actions={<Button onClick={() => setForm({ appt: null, key: Date.now() })}><Plus className="h-4 w-4" aria-hidden />موعد جديد</Button>}
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" aria-label="الشهر السابق" onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
          <p className="min-w-32 text-center font-bold text-primary">{formatMonthYear(month)}</p>
          <Button size="sm" variant="outline" aria-label="الشهر التالي" onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => { setMonth(startOfMonth(new Date())); setSelected(new Date()); }}>اليوم</Button>
        </div>
        <div className="w-48"><Segmented value={view} onChange={setView} options={[{ value: "month", label: "تقويم" }, { value: "list", label: "قائمة" }]} /></div>
      </div>

      {loading ? <ListSkeleton /> : error ? <ErrorState message={error} onRetry={reload} /> : view === "month" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="card overflow-hidden">
            <div className="grid grid-cols-7 border-b border-line bg-canvas text-center text-xs font-semibold text-muted">
              {WEEK.map((w) => <div key={w} className="py-2">{w}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {grid.map((d) => {
                const n = byDay(d).length;
                const inMonth = d.getMonth() === month.getMonth();
                const sel = isSameDay(d, selected);
                return (
                  <button key={d.getTime()} type="button" onClick={() => setSelected(d)} aria-pressed={sel}
                    aria-label={`${formatDate(d)}${n ? `، ${n} مواعيد` : ""}`}
                    className={cn("flex h-14 flex-col items-center justify-center gap-0.5 border-b border-s border-line text-sm sm:h-16", !inMonth && "text-muted/50", sel && "bg-accent-50 font-bold text-primary", isSameDay(d, new Date()) && "ring-1 ring-inset ring-accent")}>
                    {d.getDate()}
                    {n > 0 && <span className="rounded-full bg-secondary px-1.5 text-[10px] text-white">{n}</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="card h-fit">
            <p className="border-b border-line p-3 font-bold text-primary">{formatWeekday(selected)} {formatDate(selected)}</p>
            {dayList.length === 0 ? <p className="p-4 text-sm text-muted">لا توجد مواعيد في هذا اليوم.</p> : <ul className="divide-y divide-line">{dayList.map((a) => <Row key={a.id} a={a} />)}</ul>}
          </div>
        </div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState icon={CalendarDays} title="لا توجد مواعيد في هذا الشهر" />
      ) : (
        <div className="card divide-y divide-line">
          {data!.map((a) => (
            <div key={a.id}><p className="bg-canvas px-3 py-1 text-xs font-semibold text-muted">{formatWeekday(a.startsAt)} {formatDate(a.startsAt)}</p><ul><Row a={a} /></ul></div>
          ))}
        </div>
      )}

      {form && (
        <AppointmentForm key={form.key} open onClose={() => setForm(null)} onSaved={reload} appointment={form.appt} defaultDate={selected} defaultPatientId={params.get("patientId") ?? undefined} />
      )}
    </div>
  );
}

export default function AppointmentsPage() {
  return <Suspense fallback={<ListSkeleton />}><Inner /></Suspense>;
}
