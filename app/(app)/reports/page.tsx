"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState, ListSkeleton } from "@/components/ui/states";
import { useLoad } from "@/hooks/use-load";
import { APPOINTMENT_STATUS } from "@/lib/constants";
import { addDays, endOfDay, formatDate, fromInputDate, startOfDay, toInputDate } from "@/lib/utils/date";
import { getReport } from "@/services/reports.service";
import type { AppointmentStatus } from "@/types/models";

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-primary">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const [from, setFrom] = useState(toInputDate(addDays(new Date(), -29)));
  const [to, setTo] = useState(toInputDate(new Date()));
  const start = fromInputDate(from);
  const end = fromInputDate(to);
  const invalid = !start || !end || end < start;
  const { data, loading, error, reload } = useLoad(() => getReport(startOfDay(start!), endOfDay(end!)), [from, to], !invalid);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="التقارير"
        description={!invalid ? `من ${formatDate(start)} إلى ${formatDate(end)}` : undefined}
        breadcrumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "التقارير" }]}
        actions={<Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden />طباعة / PDF</Button>}
      />
      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 print:hidden">
        <TextInput label="من" type="date" dir="ltr" value={from} onChange={(e) => setFrom(e.target.value)} />
        <TextInput label="إلى" type="date" dir="ltr" value={to} onChange={(e) => setTo(e.target.value)} error={invalid ? "تأكد من صحة الفترة." : undefined} />
      </div>
      {invalid ? null : loading ? <ListSkeleton /> : error ? <ErrorState message={error} onRetry={reload} /> : data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="إجمالي المرضى" value={data.totalPatients} />
            <Stat label="مرضى نشطون" value={data.activePatients} />
            <Stat label="مرضى جدد في الفترة" value={data.newPatients} />
            <Stat label="الجلسات" value={data.sessionsTotal} hint={`حضور ${data.sessionsAttended} · غياب ${data.sessionsAbsent}`} />
            <Stat label="برامج أُنشئت" value={data.plansCreated} />
            <Stat label="برامج منشورة" value={data.plansPublished} />
            <Stat label="إنجازات المرضى المسجلة" value={data.completionsInRange} hint="تسجيل ذاتي من المريض" />
            <Stat label="متوسط تغير الألم" value={data.progress.avgPainChange === null ? "—" : data.progress.avgPainChange.toFixed(1)} hint={`تحسن ${data.progress.improved} · تراجع ${data.progress.worsened}`} />
          </div>

          <section className="card p-4">
            <h2 className="mb-3 font-bold text-primary">المواعيد حسب الحالة</h2>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {(Object.keys(APPOINTMENT_STATUS) as AppointmentStatus[]).map((s) => (
                <li key={s} className="rounded-xl bg-canvas p-3 text-center"><p className="text-xl font-bold">{data.appointmentsByStatus[s] ?? 0}</p><p className="text-xs text-muted">{APPOINTMENT_STATUS[s].label}</p></li>
              ))}
            </ul>
          </section>

          <section className="card overflow-x-auto p-4">
            <h2 className="mb-3 font-bold text-primary">الالتزام بالبرامج المنشورة</h2>
            {data.adherence.length === 0 ? <p className="text-sm text-muted">لا توجد برامج منشورة ببداية محددة.</p> : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-line text-start text-muted"><th className="py-2 text-start">البرنامج</th><th className="text-start">المريض</th><th className="text-start">المنجز / المخطط</th><th className="text-start">النسبة</th></tr></thead>
                <tbody>
                  {data.adherence.map((a) => (
                    <tr key={a.planId} className="border-b border-line last:border-0">
                      <td className="py-2">{a.title}</td><td>{a.patientName}</td><td>{a.done} / {a.expected}</td><td className="font-bold">{a.percent === null ? "—" : `${a.percent}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="mt-3 text-xs text-muted">الالتزام يعتمد على تسجيل المريض بنفسه ولا يثبت صحة الأداء.</p>
          </section>
        </div>
      )}
    </div>
  );
}
