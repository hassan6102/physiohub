"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Plus, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea, TextInput } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { PatientSelect } from "@/components/shared/patient-select";
import { ExercisePicker } from "@/components/plans/exercise-picker";
import { PlanExerciseItem } from "@/components/plans/plan-exercise-item";
import { PlanView } from "@/components/plans/plan-view";
import { planExerciseFrom, toPortalPlan } from "@/lib/plan-utils";
import { friendlyError } from "@/lib/utils/errors";
import { fromInputDate, toInputDate } from "@/lib/utils/date";
import { getPatientOptions } from "@/services/patients.service";
import { createPlan, updatePlan } from "@/services/plans.service";
import type { Dosage, Exercise, PlanExercise, PlanInput, PlanStatus } from "@/types/models";

type Props = { planId?: string; initial?: Partial<PlanInput>; lockPatient?: boolean };

export function PlanBuilder({ planId, initial, lockPatient }: Props) {
  const router = useRouter();
  const { show } = useToast();
  const [patientId, setPatientId] = useState(initial?.patientId ?? "");
  const [patientName, setPatientName] = useState(initial?.patientName ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [goal, setGoal] = useState(initial?.goal ?? "");
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [start, setStart] = useState(toInputDate(initial?.startDate));
  const [end, setEnd] = useState(toInputDate(initial?.endDate));
  const [items, setItems] = useState<PlanExercise[]>(initial?.exercises ?? []);
  const [picker, setPicker] = useState(false);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dragFrom = useRef<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    items.forEach((i) => i.exerciseId && (c[i.exerciseId] = (c[i.exerciseId] ?? 0) + 1));
    return c;
  }, [items]);

  const add = (e: Exercise) => setItems((l) => [...l, planExerciseFrom(e)]);
  const move = (from: number, to: number) =>
    setItems((l) => {
      if (to < 0 || to >= l.length || from === to) return l;
      const n = [...l];
      const [x] = n.splice(from, 1);
      n.splice(to, 0, x);
      return n;
    });
  const setDosage = (key: string, dosage: Dosage) => setItems((l) => l.map((i) => (i.key === key ? { ...i, dosage } : i)));

  const sDate = fromInputDate(start);
  const eDate = fromInputDate(end);

  const validate = (status: PlanStatus) => {
    const er: Record<string, string> = {};
    if (!patientId) er.patient = "اختر المريض.";
    if (title.trim().length < 2) er.title = "اكتب عنوان البرنامج.";
    if (sDate && eDate && eDate < sDate) er.end = "تاريخ النهاية قبل البداية.";
    if (status === "published" && items.length === 0) er.items = "أضف تمرينًا واحدًا على الأقل قبل النشر.";
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const save = async (status: PlanStatus) => {
    if (!validate(status)) return show("error", "راجع الحقول المطلوبة.");
    setSaving(true);
    try {
      let name = patientName;
      if (!name) name = (await getPatientOptions()).find((p) => p.id === patientId)?.fullName ?? "";
      const input: PlanInput = {
        patientId,
        patientName: name,
        title: title.trim(),
        goal: goal.trim(),
        instructions: instructions.trim(),
        startDate: sDate,
        endDate: eDate,
        exercises: items,
        status,
      };
      const id = planId ?? (await createPlan(input));
      if (planId) await updatePlan(planId, input);
      show("success", status === "published" ? "تم نشر البرنامج." : "تم حفظ البرنامج.");
      router.push(`/treatment-plans/${id}`);
    } catch (e) {
      show("error", friendlyError(e));
      setSaving(false);
    }
  };

  const portal = toPortalPlan({ title, goal, instructions, startDate: sDate, endDate: eDate, exercises: items });

  return (
    <div className="space-y-6">
      <section className="card grid gap-4 p-5 md:grid-cols-2">
        <PatientSelect
          value={patientId}
          disabled={lockPatient}
          error={errors.patient}
          onChange={(id, name) => {
            setPatientId(id);
            setPatientName(name);
          }}
        />
        <TextInput label="عنوان البرنامج" required value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} maxLength={120} />
        <TextInput label="تاريخ البداية" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <TextInput label="تاريخ النهاية" type="date" value={end} onChange={(e) => setEnd(e.target.value)} error={errors.end} />
        <div className="md:col-span-2"><Textarea label="هدف البرنامج" value={goal} onChange={(e) => setGoal(e.target.value)} /></div>
        <div className="md:col-span-2"><Textarea label="تعليمات عامة للمريض" value={instructions} onChange={(e) => setInstructions(e.target.value)} /></div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-primary">التمارين ({items.length})</h2>
          <Button onClick={() => setPicker(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            إضافة تمارين
          </Button>
        </div>
        {errors.items && <p className="text-sm text-danger">{errors.items}</p>}
        {items.length === 0 ? (
          <div className="card p-8 text-center text-sm text-muted">لم تضف تمارين بعد. اضغط «إضافة تمارين» لاختيارها من مكتبتك.</div>
        ) : (
          <ul className="space-y-3">
            {items.map((it, i) => (
              <PlanExerciseItem
                key={it.key}
                item={it}
                index={i}
                total={items.length}
                onChange={(d) => setDosage(it.key, d)}
                onRemove={() => setItems((l) => l.filter((x) => x.key !== it.key))}
                onMove={(dir) => move(i, i + dir)}
                dragHandlers={{
                  dragging: dragging === i,
                  onHandleDragStart: (e) => {
                    dragFrom.current = i;
                    setDragging(i);
                    e.dataTransfer.effectAllowed = "move";
                  },
                  onDragOver: (e) => e.preventDefault(),
                  onDrop: (e) => {
                    e.preventDefault();
                    if (dragFrom.current !== null) move(dragFrom.current, i);
                    dragFrom.current = null;
                    setDragging(null);
                  },
                  onDragEnd: () => setDragging(null),
                }}
              />
            ))}
          </ul>
        )}
      </section>

      <div className="sticky bottom-16 z-10 flex flex-wrap justify-end gap-2 rounded-2xl border border-line bg-surface/95 p-3 shadow-pop backdrop-blur md:bottom-4">
        <Button variant="outline" onClick={() => setPreview(true)} disabled={saving}>
          <Eye className="h-4 w-4" aria-hidden />
          معاينة
        </Button>
        <Button variant="secondary" onClick={() => save("draft")} disabled={saving}>
          <Save className="h-4 w-4" aria-hidden />
          حفظ كمسودة
        </Button>
        <Button onClick={() => save("published")} disabled={saving}>
          <Send className="h-4 w-4" aria-hidden />
          حفظ ونشر
        </Button>
      </div>

      <ExercisePicker open={picker} onClose={() => setPicker(false)} onAdd={add} addedCounts={counts} />
      <Modal open={preview} onClose={() => setPreview(false)} title="معاينة ما سيراه المريض" size="lg">
        <PlanView plan={portal} />
      </Modal>
    </div>
  );
}
