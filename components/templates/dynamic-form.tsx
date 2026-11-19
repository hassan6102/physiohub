"use client";

import { Star } from "lucide-react";
import { Checkbox, Field, Select, TextInput, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/utils/cn";
import type { TemplateField } from "@/types/models";

export type FormValues = Record<string, string | number | boolean | null>;

export function validateValues(fields: TemplateField[], values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    if (!f.required) continue;
    const v = values[f.id];
    const empty = v === undefined || v === null || v === "" || (f.type === "checkbox" && v !== true);
    if (empty) errors[f.id] = f.type === "checkbox" ? "هذا الحقل مطلوب" : "هذا الحقل مطلوب";
  }
  return errors;
}

/** Renders a template's fields. Used for filling records and for previewing templates. */
export function DynamicForm({
  fields,
  values,
  onChange,
  errors = {},
}: {
  fields: TemplateField[];
  values: FormValues;
  onChange: (id: string, value: string | number | boolean | null) => void;
  errors?: Record<string, string>;
}) {
  return (
    <div className="space-y-4">
      {fields.map((f) => {
        const v = values[f.id];
        const error = errors[f.id];
        switch (f.type) {
          case "textarea":
            return <Textarea key={f.id} label={f.label} required={f.required} error={error} value={String(v ?? "")} onChange={(e) => onChange(f.id, e.target.value)} />;
          case "number":
            return (
              <TextInput
                key={f.id}
                label={f.label}
                required={f.required}
                error={error}
                type="number"
                inputMode="decimal"
                dir="ltr"
                value={v === null || v === undefined ? "" : String(v)}
                onChange={(e) => onChange(f.id, e.target.value === "" ? null : Number(e.target.value))}
              />
            );
          case "date":
            return <TextInput key={f.id} label={f.label} required={f.required} error={error} type="date" dir="ltr" value={String(v ?? "")} onChange={(e) => onChange(f.id, e.target.value)} />;
          case "select":
            return (
              <Select
                key={f.id}
                label={f.label}
                required={f.required}
                error={error}
                placeholder="اختر"
                value={String(v ?? "")}
                options={f.options.map((o) => ({ value: o, label: o }))}
                onChange={(e) => onChange(f.id, e.target.value)}
              />
            );
          case "checkbox":
            return (
              <div key={f.id}>
                <Checkbox label={f.label + (f.required ? " *" : "")} checked={v === true} onChange={(c) => onChange(f.id, c)} />
                {error && <p className="text-sm text-danger">{error}</p>}
              </div>
            );
          case "radio":
            return (
              <Field key={f.id} label={f.label} required={f.required} error={error}>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={f.label}>
                  {f.options.map((o) => (
                    <button
                      key={o}
                      type="button"
                      role="radio"
                      aria-checked={v === o}
                      onClick={() => onChange(f.id, o)}
                      className={cn(
                        "h-11 rounded-xl border px-4 text-sm font-semibold",
                        v === o ? "border-primary bg-primary text-white" : "border-line bg-surface text-ink"
                      )}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </Field>
            );
          case "rating":
            return (
              <Field key={f.id} label={f.label} required={f.required} error={error}>
                <div className="flex gap-1" role="radiogroup" aria-label={f.label}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={v === n}
                      aria-label={`${n}`}
                      onClick={() => onChange(f.id, n)}
                      className="grid h-11 w-11 place-items-center"
                    >
                      <Star className={cn("h-7 w-7", typeof v === "number" && n <= v ? "fill-warning text-warning" : "text-line")} />
                    </button>
                  ))}
                </div>
              </Field>
            );
          default:
            return <TextInput key={f.id} label={f.label} required={f.required} error={error} value={String(v ?? "")} onChange={(e) => onChange(f.id, e.target.value)} />;
        }
      })}
    </div>
  );
}

export function formatValue(f: TemplateField, v: FormValues[string] | undefined): string {
  if (v === undefined || v === null || v === "") return "—";
  if (f.type === "checkbox") return v === true ? "نعم" : "لا";
  if (f.type === "rating") return `${v}/5`;
  return String(v);
}
