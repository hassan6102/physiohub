"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Segmented, Select, TextInput, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/utils/cn";
import { PATIENT_STATUS } from "@/lib/constants";
import { fieldErrors } from "@/lib/validations/common";
import { medicalSchema, personalSchema, type PatientFormValues } from "@/lib/validations/patient";

const STEPS = ["البيانات الشخصية", "البيانات الطبية", "بيانات إضافية"];

/** 3-step form so the doctor never faces one long screen. Works the same on phone and desktop. */
export function PatientForm({
  initial,
  submitLabel,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial: PatientFormValues;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: PatientFormValues) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<PatientFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof PatientFormValues>(key: K, value: PatientFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };
  const bind = (key: keyof PatientFormValues) => ({
    value: values[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(key, e.target.value as never),
    error: errors[key],
  });

  const validateStep = (s: number) => {
    const found = s === 0 ? fieldErrors(personalSchema, values) : s === 1 ? fieldErrors(medicalSchema, values) : {};
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const next = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    if (submitting) return;
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  };

  const prev = () => {
    if (submitting) return;
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    if (step < STEPS.length - 1) {
      if (validateStep(step)) {
        setStep((s) => Math.min(s + 1, STEPS.length - 1));
      }
      return;
    }
    for (let i = 0; i < STEPS.length; i++) {
      if (!validateStep(i)) {
        setStep(i);
        return;
      }
    }
    onSubmit(values);
  };

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <ol className="flex items-center gap-2" aria-label="خطوات النموذج">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => !submitting && i < step && setStep(i)}
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold disabled:opacity-60",
                i < step ? "bg-accent text-primary" : i === step ? "bg-primary text-white" : "bg-line text-muted"
              )}
              aria-current={i === step ? "step" : undefined}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </button>
            <span className={cn("hidden text-sm font-semibold sm:inline", i === step ? "text-primary" : "text-muted")}>{label}</span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-line" />}
          </li>
        ))}
      </ol>
      <p className="text-sm font-semibold text-primary sm:hidden">{STEPS[step]}</p>

      {step === 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextInput label="الاسم الكامل" required autoComplete="off" {...bind("fullName")} />
          </div>
          <TextInput label="رقم الهاتف" type="tel" inputMode="tel" dir="ltr" required placeholder="01xxxxxxxxx" {...bind("phone")} />
          <TextInput label="البريد الإلكتروني (اختياري)" type="email" dir="ltr" {...bind("email")} />
          <TextInput label="تاريخ الميلاد" type="date" dir="ltr" max={new Date().toISOString().slice(0, 10)} {...bind("birthDate")} />
          <Select
            label="الجنس"
            required
            placeholder="اختر"
            options={[
              { value: "male", label: "ذكر" },
              { value: "female", label: "أنثى" },
            ]}
            {...bind("gender")}
          />
          <div className="sm:col-span-2">
            <TextInput label="العنوان (اختياري)" {...bind("address")} />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Textarea label="الشكوى الرئيسية" required {...bind("chiefComplaint")} />
          </div>
          <TextInput label="تاريخ بداية المشكلة" type="date" dir="ltr" {...bind("problemStartDate")} />
          <TextInput label="التشخيص المسجل بواسطة المختص" {...bind("diagnosis")} />
          <Textarea label="التاريخ المرضي" {...bind("medicalHistory")} />
          <Textarea label="الإصابات السابقة" {...bind("previousInjuries")} />
          <Textarea label="العمليات السابقة" {...bind("previousSurgeries")} />
          <Textarea label="الأدوية والعوامل الطبية المهمة" {...bind("medications")} />
          <div className="sm:col-span-2">
            <Textarea label="أهداف العلاج" {...bind("treatmentGoals")} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Textarea label="ملاحظات" hint="ملاحظات خاصة بك، لا تظهر للمريض أبدًا." {...bind("notes")} />
          <div className="space-y-1.5">
            <span className="block text-sm font-semibold text-ink">حالة المريض</span>
            <Segmented
              value={values.status}
              onChange={(v) => set("status", v)}
              options={(["active", "paused", "completed", "inactive"] as const).map((s) => ({ value: s, label: PATIENT_STATUS[s].label }))}
            />
          </div>
          <p className="rounded-xl bg-canvas p-3 text-sm text-muted">
            الملفات والتقارير الطبية يمكن رفعها بعد الحفظ من ملف المريض، في تبويب «الملاحظات والملفات».
          </p>
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <div className="flex gap-2">
          <Button type="button" variant="ghost" disabled={submitting} onClick={onCancel}>
            إلغاء
          </Button>
          {step > 0 && (
            <Button type="button" variant="outline" disabled={submitting} onClick={prev}>
              السابق
            </Button>
          )}
        </div>
        {step < STEPS.length - 1 ? (
          <Button key="patient-step-next" type="button" disabled={submitting} onClick={next} className="sm:min-w-32">
            التالي
          </Button>
        ) : (
          <Button key="patient-step-submit" type="submit" loading={submitting} className="sm:min-w-32">
            {submitLabel}
          </Button>
        )}
      </div>
    </form>
  );
}
