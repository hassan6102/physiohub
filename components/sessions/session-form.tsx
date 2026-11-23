"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Segmented, Select, TextInput, Textarea } from "@/components/ui/form";
import { PatientSelect } from "@/components/shared/patient-select";
import { ATTENDANCE, PAIN_LABELS } from "@/lib/constants";
import { getPatient } from "@/services/patients.service";
import { fieldErrors } from "@/lib/validations/common";
import { sessionSchema, type SessionFormValues } from "@/lib/validations/session";

export function SessionForm({
  initial,
  lockPatient,
  submitLabel,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial: SessionFormValues;
  lockPatient?: boolean;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: SessionFormValues, patientName: string) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState(initial);
  const [patientName, setPatientName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof SessionFormValues>(k: K, v: SessionFormValues[K]) => {
    setValues((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };
  const bind = (k: keyof SessionFormValues) => ({
    value: values[k],
    error: errors[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value as never),
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = fieldErrors(sessionSchema, values);
    setErrors(found);
    if (Object.keys(found).length) return;
    // When the patient comes pre-selected (e.g. from the patient file) the name was never picked here.
    const name = patientName || (await getPatient(values.patientId).catch(() => null))?.fullName || "";
    onSubmit(values, name);
  };

  const attended = values.attendance === "attended" || values.attendance === "late";

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <PatientSelect
            value={values.patientId}
            disabled={lockPatient}
            error={errors.patientId}
            onChange={(id, name) => {
              set("patientId", id);
              setPatientName(name);
            }}
          />
        </div>
        <TextInput label="التاريخ والوقت" type="datetime-local" dir="ltr" required {...bind("date")} />
        <TextInput label="مدة الجلسة (دقيقة)" type="number" inputMode="numeric" dir="ltr" min={5} max={480} required {...bind("durationMin")} />
        <div className="space-y-1.5 sm:col-span-2">
          <span className="block text-sm font-semibold text-ink">حالة الحضور</span>
          <Segmented
            value={values.attendance}
            onChange={(v) => set("attendance", v)}
            options={(Object.keys(ATTENDANCE) as (keyof typeof ATTENDANCE)[]).map((k) => ({ value: k, label: ATTENDANCE[k].label }))}
          />
        </div>
      </section>

      {attended && (
        <section className="grid gap-4 sm:grid-cols-2">
          <Select
            label="مستوى الألم عند الوصول (0-10)"
            placeholder="لم يُسجَّل"
            options={PAIN_LABELS.map((l, i) => ({ value: String(i), label: `${i} - ${l}` }))}
            {...bind("painArrival")}
          />
          <Textarea label="الأعراض الحالية" {...bind("symptoms")} />
          <Textarea label="حالة المريض" {...bind("condition")} />
          <Textarea label="التمارين التي تمت داخل الجلسة" {...bind("exercisesDone")} />
          <Textarea label="التدخلات العلاجية" {...bind("interventions")} />
          <Textarea label="استجابة المريض" {...bind("response")} />
          <Textarea label="التقييم بعد الجلسة" {...bind("assessment")} />
          <Textarea label="خطة الجلسة القادمة" {...bind("nextPlan")} />
        </section>
      )}

      <Textarea label="ملاحظات إضافية" {...bind("notes")} />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit" loading={submitting} className="sm:min-w-32">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
