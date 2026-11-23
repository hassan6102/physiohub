"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, TextInput, Textarea } from "@/components/ui/form";
import { LEVELS } from "@/lib/constants";
import { exerciseSchema, type ExerciseFormValues } from "@/lib/exercise-mapper";
import { fieldErrors } from "@/lib/validations/common";
import { isHttpsUrl, parseYouTubeId } from "@/lib/utils/youtube";
import type { Category, ExerciseLevel } from "@/types/models";
import { SafeImage, YouTubeEmbed } from "./media";

export function ExerciseForm({
  initial,
  categories,
  submitLabel,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial: ExerciseFormValues;
  categories: Category[];
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: ExerciseFormValues) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof ExerciseFormValues, v: string) => {
    setValues((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };
  const bind = (k: keyof ExerciseFormValues) => ({
    value: values[k],
    error: errors[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = fieldErrors(exerciseSchema, values);
    setErrors(found);
    if (Object.keys(found).length) return;
    onSubmit(values);
  };

  const bodyParts = categories.filter((c) => c.kind === "bodyPart");
  const subs = categories.filter((c) => c.kind === "subcategory");
  // keep a value that no longer exists in the category list selectable (e.g. imported exercises)
  const withCurrent = (list: Category[], current: string) =>
    [...list.map((c) => c.name), ...(current && !list.some((c) => c.name === current) ? [current] : [])].map((n) => ({ value: n, label: n }));

  const videoId = parseYouTubeId(values.videoUrl);
  const imageOk = values.imageUrl.trim() && isHttpsUrl(values.imageUrl.trim());

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <section className="grid gap-4 sm:grid-cols-2">
        <TextInput label="اسم التمرين بالعربية" required {...bind("nameAr")} />
        <TextInput label="الاسم بالإنجليزية (اختياري)" dir="ltr" {...bind("nameEn")} />
        <Select label="الجزء المستهدف" required placeholder="اختر" options={withCurrent(bodyParts, values.bodyPart)} {...bind("bodyPart")} />
        <Select label="التصنيف الفرعي" placeholder="بدون" options={withCurrent(subs, values.subcategory)} {...bind("subcategory")} />
        <Select
          label="المستوى"
          options={(Object.keys(LEVELS) as ExerciseLevel[]).map((l) => ({ value: l, label: LEVELS[l] }))}
          {...bind("level")}
        />
        <TextInput label="العضلات المستهدفة" hint="افصل بينها بفاصلة" {...bind("muscles")} />
        <TextInput label="الأدوات المطلوبة" hint="افصل بينها بفاصلة" {...bind("equipment")} />
        <div className="sm:col-span-2">
          <Textarea label="وصف التمرين" {...bind("description")} />
        </div>
        <div className="sm:col-span-2">
          <Textarea label="خطوات الأداء" hint="اكتب كل خطوة في سطر منفصل" rows={5} {...bind("steps")} />
        </div>
        <Textarea label="التحذيرات وموانع الاستخدام" {...bind("warnings")} />
        <Textarea label="ملاحظات" {...bind("notes")} />
      </section>

      <section className="space-y-4">
        <h3 className="text-base font-bold text-primary">الوسائط</h3>
        <TextInput
          label="رابط فيديو YouTube"
          dir="ltr"
          hint="يدعم الروابط العادية وyoutu.be وShorts. لا يتم رفع فيديوهات على المنصة."
          placeholder="https://www.youtube.com/watch?v=..."
          {...bind("videoUrl")}
        />
        {videoId && (
          <div className="max-w-lg">
            <p className="mb-2 text-xs font-semibold text-muted">معاينة قبل الحفظ</p>
            <YouTubeEmbed id={videoId} title={values.nameAr || "معاينة الفيديو"} />
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="رابط صورة (اختياري)" dir="ltr" placeholder="https://..." {...bind("imageUrl")} />
          <TextInput label="رابط صورة مصغرة (اختياري)" dir="ltr" placeholder="https://..." {...bind("thumbnailUrl")} />
        </div>
        {imageOk && <SafeImage src={values.imageUrl.trim()} alt="معاينة الصورة" className="h-40 w-full max-w-xs rounded-xl" />}
      </section>

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
