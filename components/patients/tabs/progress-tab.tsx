"use client";

import { useState } from "react";
import { LineChart as ChartIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LineChart } from "@/components/ui/line-chart";
import { Modal } from "@/components/ui/modal";
import { TextInput, Textarea } from "@/components/ui/form";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useLoad } from "@/hooks/use-load";
import { formatDate, fromInputDate, toInputDate } from "@/lib/utils/date";
import { friendlyError } from "@/lib/utils/errors";
import { addMeasurement, getMeasurements } from "@/services/measurements.service";
import type { Measurement } from "@/types/models";

const num = (s: string, min: number, max: number): number | null => {
  if (s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= min && n <= max ? n : NaN;
};

type Series = { key: keyof Measurement; title: string; min: number; max: number; unit: string; color: string };
const SERIES: Series[] = [
  { key: "painLevel", title: "مستوى الألم (0-10)", min: 0, max: 10, unit: "/10", color: "#C8433B" },
  { key: "romDegrees", title: "نطاق الحركة (درجة)", min: 0, max: 180, unit: "°", color: "#1D7180" },
  { key: "strength", title: "القوة العضلية (0-5)", min: 0, max: 5, unit: "/5", color: "#36B6A6" },
  { key: "balance", title: "مستوى التوازن (0-10)", min: 0, max: 10, unit: "/10", color: "#123B50" },
  { key: "functionalScore", title: "القدرة الوظيفية (0-100)", min: 0, max: 100, unit: "%", color: "#D98A1F" },
];

export function ProgressTab({ patientId, archived }: { patientId: string; archived: boolean }) {
  const { show } = useToast();
  const { data, loading, error, reload } = useLoad(() => getMeasurements(patientId), [patientId]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ date: toInputDate(new Date()), pain: "", joint: "", rom: "", strength: "", balance: "", functional: "", notes: "" });
  const [err, setErr] = useState("");

  const save = async () => {
    const pain = num(f.pain, 0, 10);
    const rom = num(f.rom, 0, 360);
    const strength = num(f.strength, 0, 5);
    const balance = num(f.balance, 0, 10);
    const functional = num(f.functional, 0, 100);
    const date = fromInputDate(f.date);
    if (!date) return setErr("اختر تاريخ القياس.");
    if ([pain, rom, strength, balance, functional].some((v) => Number.isNaN(v))) return setErr("تحقق من القيم: الألم والتوازن من 0 إلى 10، القوة من 0 إلى 5، القدرة الوظيفية من 0 إلى 100.");
    if ([pain, rom, strength, balance, functional].every((v) => v === null) && !f.notes.trim()) return setErr("أدخل قياسًا واحدًا على الأقل أو ملاحظة.");
    setBusy(true);
    try {
      await addMeasurement({
        patientId,
        date,
        painLevel: pain,
        romJoint: f.joint.trim(),
        romDegrees: rom,
        strength,
        balance,
        functionalScore: functional,
        notes: f.notes.trim(),
      });
      show("success", "تم حفظ القياس.");
      setOpen(false);
      setErr("");
      setF({ date: toInputDate(new Date()), pain: "", joint: "", rom: "", strength: "", balance: "", functional: "", notes: "" });
      reload();
    } catch (e) {
      show("error", friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const items = data ?? [];

  return (
    <div className="space-y-4">
      {!archived && (
        <div className="flex justify-end">
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            تسجيل قياس
          </Button>
        </div>
      )}

      {loading ? (
        <ListSkeleton rows={2} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState icon={ChartIcon} title="لا توجد قياسات مسجلة" description="سجّل قياسات الألم ونطاق الحركة والقوة لتظهر هنا رسوم التطور." />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {SERIES.map((s) => {
              const points = items
                .filter((m) => m[s.key] !== null && m[s.key] !== undefined)
                .map((m) => ({ label: formatDate(m.date), value: Number(m[s.key]) }));
              if (points.length === 0) return null;
              return (
                <section key={s.key} className="card p-4">
                  <h3 className="mb-2 text-sm font-bold text-primary">{s.title}</h3>
                  <LineChart data={points} min={s.min} max={s.max} unit={s.unit} color={s.color} title={s.title} />
                </section>
              );
            })}
          </div>
          <section className="card divide-y divide-line">
            {[...items].reverse().map((m) => (
              <div key={m.id} className="space-y-1 p-4 text-sm">
                <p className="font-bold text-ink">{formatDate(m.date)}</p>
                <p className="text-muted">
                  {[
                    m.painLevel !== null && `الألم ${m.painLevel}/10`,
                    m.romDegrees !== null && `الحركة ${m.romDegrees}°${m.romJoint ? ` (${m.romJoint})` : ""}`,
                    m.strength !== null && `القوة ${m.strength}/5`,
                    m.balance !== null && `التوازن ${m.balance}/10`,
                    m.functionalScore !== null && `القدرة الوظيفية ${m.functionalScore}%`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {m.notes && <p className="whitespace-pre-line text-ink">{m.notes}</p>}
              </div>
            ))}
          </section>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="تسجيل قياس جديد"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button loading={busy} onClick={save}>
              حفظ
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextInput label="تاريخ القياس" type="date" dir="ltr" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          </div>
          <TextInput label="مستوى الألم (0-10)" type="number" inputMode="decimal" dir="ltr" value={f.pain} onChange={(e) => setF({ ...f, pain: e.target.value })} />
          <TextInput label="القوة العضلية (0-5)" type="number" inputMode="decimal" dir="ltr" value={f.strength} onChange={(e) => setF({ ...f, strength: e.target.value })} />
          <TextInput label="المفصل (لنطاق الحركة)" value={f.joint} onChange={(e) => setF({ ...f, joint: e.target.value })} />
          <TextInput label="نطاق الحركة (درجة)" type="number" inputMode="decimal" dir="ltr" value={f.rom} onChange={(e) => setF({ ...f, rom: e.target.value })} />
          <TextInput label="مستوى التوازن (0-10)" type="number" inputMode="decimal" dir="ltr" value={f.balance} onChange={(e) => setF({ ...f, balance: e.target.value })} />
          <TextInput label="القدرة الوظيفية (0-100)" type="number" inputMode="decimal" dir="ltr" value={f.functional} onChange={(e) => setF({ ...f, functional: e.target.value })} />
          <div className="sm:col-span-2">
            <Textarea label="ملاحظات الدكتور" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          </div>
          {err && <p className="text-sm text-danger sm:col-span-2">{err}</p>}
        </div>
      </Modal>
    </div>
  );
}
