import type { TemplateField } from "@/types/models";

type DefaultTemplate = { name: string; description: string; fields: Omit<TemplateField, "id">[] };

const t = (label: string, type: TemplateField["type"] = "text", required = false, options: string[] = []) => ({
  label,
  type,
  required,
  options,
});

/**
 * Template definitions (not patient data). They are copied into the doctor's own
 * templates the first time the templates page is opened, so they can be edited freely.
 */
export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  {
    name: "التقييم المبدئي",
    description: "تقييم أول زيارة للمريض",
    fields: [
      t("الشكوى الرئيسية", "textarea", true),
      t("مدة الشكوى", "text"),
      t("مستوى الألم (0-10)", "number", true),
      t("موضع الألم", "text"),
      t("العوامل المخففة والمزيدة للألم", "textarea"),
      t("الفحص الجسدي", "textarea"),
      t("التشخيص الوظيفي", "textarea"),
      t("أهداف العلاج", "textarea", true),
    ],
  },
  {
    name: "ملاحظات الجلسة",
    description: "ملاحظات سريعة بعد كل جلسة",
    fields: [
      t("التاريخ", "date", true),
      t("ما تم تنفيذه في الجلسة", "textarea", true),
      t("استجابة المريض", "textarea"),
      t("الألم بعد الجلسة (0-10)", "number"),
      t("خطة الجلسة القادمة", "textarea"),
    ],
  },
  {
    name: "تقييم الألم",
    description: "قياس وتوصيف الألم",
    fields: [
      t("مستوى الألم الحالي (0-10)", "number", true),
      t("أعلى مستوى للألم خلال الأسبوع (0-10)", "number"),
      t("نوع الألم", "select", false, ["حاد", "مزمن", "حارق", "نابض", "ضاغط"]),
      t("الألم أثناء الليل", "radio", false, ["نعم", "لا"]),
      t("ملاحظات", "textarea"),
    ],
  },
  {
    name: "تقييم مدى الحركة (ROM)",
    description: "قياس مدى حركة المفصل",
    fields: [
      t("المفصل", "text", true),
      t("الجهة", "select", true, ["يمين", "يسار", "الاثنان"]),
      t("الحركة النشطة (درجة)", "number"),
      t("الحركة السلبية (درجة)", "number"),
      t("ألم أثناء الحركة", "checkbox"),
      t("ملاحظات", "textarea"),
    ],
  },
  {
    name: "البرنامج العلاجي",
    description: "ملخص خطة العلاج",
    fields: [
      t("هدف البرنامج", "textarea", true),
      t("المدة المتوقعة", "text"),
      t("عدد الجلسات الأسبوعية", "number"),
      t("التمارين المنزلية", "textarea"),
      t("تعليمات السلامة", "textarea"),
    ],
  },
  {
    name: "تقرير التقدم",
    description: "مراجعة دورية لتطور الحالة",
    fields: [
      t("الفترة", "text", true),
      t("التحسن الملحوظ", "textarea", true),
      t("مستوى الالتزام بالتمارين", "rating"),
      t("نقاط تحتاج متابعة", "textarea"),
      t("التوصيات", "textarea"),
    ],
  },
  {
    name: "تقرير إنهاء العلاج",
    description: "ملخص عند انتهاء العلاج",
    fields: [
      t("تاريخ الانتهاء", "date", true),
      t("الحالة عند البدء", "textarea"),
      t("الحالة عند الانتهاء", "textarea", true),
      t("هل تحققت أهداف العلاج؟", "radio", true, ["نعم", "جزئيًا", "لا"]),
      t("توصيات ما بعد العلاج", "textarea"),
    ],
  },
];
