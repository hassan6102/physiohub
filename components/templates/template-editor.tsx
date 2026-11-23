"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Select, Textarea, TextInput } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { DynamicForm, type FormValues } from "@/components/templates/dynamic-form";
import { FIELD_TYPES } from "@/lib/constants";
import { friendlyError } from "@/lib/utils/errors";
import { uid } from "@/lib/utils/misc";
import { saveTemplate } from "@/services/templates.service";
import type { FieldType, Template, TemplateField } from "@/types/models";

const NEEDS_OPTIONS: FieldType[] = ["select", "radio"];

export function TemplateEditor({ template }: { template?: Template }) {
  const router = useRouter();
  const { show } = useToast();
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [fields, setFields] = useState<TemplateField[]>(template?.fields ?? []);
  const [preview, setPreview] = useState<FormValues>({});
  const [saving, setSaving] = useState(false);

  const patch = (id: string, p: Partial<TemplateField>) => setFields((l) => l.map((f) => (f.id === id ? { ...f, ...p } : f)));
  const move = (i: number, d: -1 | 1) =>
    setFields((l) => {
      const j = i + d;
      if (j < 0 || j >= l.length) return l;
      const n = [...l];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  const save = async () => {
    if (name.trim().length < 2) return show("error", "اكتب اسم القالب.");
    if (fields.length === 0) return show("error", "أضف حقلًا واحدًا على الأقل.");
    for (const f of fields) {
      if (!f.label.trim()) return show("error", "كل حقل يحتاج عنوانًا.");
      if (NEEDS_OPTIONS.includes(f.type) && f.options.length < 2) return show("error", `الحقل «${f.label}» يحتاج خيارين على الأقل.`);
    }
    setSaving(true);
    try {
      await saveTemplate(template?.id ?? null, { name: name.trim(), description: description.trim(), fields: fields.map((f) => ({ ...f, label: f.label.trim() })) });
      show("success", "تم حفظ القالب.");
      router.push("/templates");
    } catch (e) {
      show("error", friendlyError(e));
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <section className="card space-y-4 p-5">
          <TextInput label="اسم القالب" required value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          <Textarea label="وصف" value={description} onChange={(e) => setDescription(e.target.value)} />
        </section>
        <ul className="space-y-3">
          {fields.map((f, i) => (
            <li key={f.id} className="card space-y-3 p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
                <TextInput label="عنوان الحقل" value={f.label} onChange={(e) => patch(f.id, { label: e.target.value })} maxLength={120} />
                <Select label="النوع" value={f.type} onChange={(e) => patch(f.id, { type: e.target.value as FieldType })} options={Object.entries(FIELD_TYPES).map(([value, label]) => ({ value, label }))} />
              </div>
              {NEEDS_OPTIONS.includes(f.type) && (
                <Textarea label="الخيارات (كل خيار في سطر)" value={f.options.join("\n")} onChange={(e) => patch(f.id, { options: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })} />
              )}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Checkbox label="حقل مطلوب" checked={f.required} onChange={(v) => patch(f.id, { required: v })} />
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="لأعلى"><ArrowUp className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => move(i, 1)} disabled={i === fields.length - 1} aria-label="لأسفل"><ArrowDown className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-danger" onClick={() => setFields((l) => l.filter((x) => x.id !== f.id))} aria-label="حذف الحقل"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setFields((l) => [...l, { id: uid(), label: "", type: "text", required: false, options: [] }])}>
            <Plus className="h-4 w-4" aria-hidden />إضافة حقل
          </Button>
          <Button onClick={save} disabled={saving}><Save className="h-4 w-4" aria-hidden />حفظ القالب</Button>
        </div>
      </div>
      <aside className="card h-fit space-y-3 p-5 lg:sticky lg:top-4">
        <h2 className="font-bold text-primary">معاينة</h2>
        {fields.length === 0 ? <p className="text-sm text-muted">أضف حقولًا لتظهر هنا.</p> : <DynamicForm fields={fields.map((f) => ({ ...f, label: f.label || "(بدون عنوان)" }))} values={preview} onChange={(id, v) => setPreview((p) => ({ ...p, [id]: v }))} />}
      </aside>
    </div>
  );
}
