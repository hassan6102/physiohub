# حالة المشروع (المراحل 1–10)

## منفَّذ في الكود
| المرحلة | المحتوى |
|---|---|
| 1–2 | الأساس، الهوية، المصادقة (تسجيل/دخول/استعادة)، AppShell متجاوب، واجهة عربية فقط |
| 3 | المرضى: قائمة بتصفح مقسّم، معالج إضافة 3 خطوات، ملف المريض بتبويبات، أرشفة/استعادة، مرفقات خاصة |
| 4 | الجلسات (حذف ناعم)، القياسات والرسوم، الملاحظات |
| 5 | مكتبة التمارين (خاصة/عامة)، يوتيوب، المفضلة، الاستيراد، البلاغات، التصنيفات |
| 6 | البرامج العلاجية: منشئ بالسحب والأزرار، جرعات، لقطة لكل تمرين، نشر/أرشفة/نسخ، لوحة المشاركة، الالتزام |
| 7 | بوابة المريض `/p/[token]` وواجهات API للمشاركة والإنجاز |
| 8 | القوالب، المواعيد، التقارير، الإعدادات (الملف وتغيير كلمة المرور) |
| 9 | لوحة الأدمن: نظرة عامة، الأطباء، المكتبة العامة، التصنيفات، البلاغات، إعدادات المنصة |
| 10 | `firestore.rules`، `storage.rules`، `firestore.indexes.json`، لوحة التحكم، الصفحة الرئيسية، الخصوصية/الشروط، `/reset-password`، صفحات الأخطاء، `scripts/set-admin.mjs` |

## ما اختُبر فعليًا
- فحص TypeScript **جزئي** باستخدام تعريفات بديلة (stubs) للمكتبات الخارجية: لا أخطاء صياغة أو رموز غير معرّفة أو استيرادات مفقودة في ملفات المشروع (مع `noImplicitAny` مُعطَّل لأن الأنواع الحقيقية للمكتبات غير متوفرة). أخطاء الأنواع المرتبطة بـ Firebase/zod/React الفعلية **لم تُفحص**.
- فحص استيراد المسارات `@/…` والحزم مقابل `package.json`.

## لم يُختبر (لا شبكة ولا Firebase حقيقي)
- `npm install` و`npm run build` و`next lint` (ESLint) — قد تظهر أخطاء أنواع أو lint عند أول تشغيل ويجب إصلاحها.
- أي اتصال بـ Firebase: المصادقة، القراءة/الكتابة، رفع الملفات، App Check، مسارات API (Admin SDK).
- **قواعد Firestore/Storage لم تُختبر** بالمحاكي؛ راجعها وجرّبها قبل الإنتاج.
- الفهارس مُستنتجة من الاستعلامات يدويًا؛ قد يطلب Firestore فهارس إضافية.
- العرض البصري على المتصفحات والأجهزة (RTL، الطباعة، السحب والإفلات على اللمس).
- تدفق تعطيل الحساب وحقوق الأدمن، وبوابة المريض (PIN، القفل، الانتهاء، الإلغاء) على بيانات حقيقية.

## قيود معروفة
- محدد المعدل (rate limit) في الذاكرة فقط وبأفضل جهد؛ على Vercel serverless غير مشترك بين النسخ. الحماية الأساسية: قفل PIN المخزَّن في Firestore.
- البحث عن المرضى على الواجهة ضمن آخر 300 مريض محمّلين.
- إعادة تسمية تصنيف لا تحدّث التمارين القديمة.
- رابط المشاركة يظهر مرة واحدة فقط (يُخزَّن الهاش فقط)؛ عند فقده يُنشأ رابط جديد.
- PDF عبر طباعة المتصفح (`window.print()`).
- الالتزام بالبرنامج إقرار ذاتي من المريض ولا يثبت صحة الأداء.
- مواعيد: لا تذكيرات تلقائية (لا خدمة إرسال مُعدَّة).
- صفحتا الخصوصية والشروط مسودة تحتاج مراجعة قانونية.
- لا بيانات تجريبية في الكود؛ الاستثناء قوالب افتراضية وتصنيفات تُنشأ لكل طبيب عند أول استخدام.

## Multi-clinic update — status
Implemented: clinics data model, manager/doctor roles, invitations, team management + doctor profiles, patient assignment/filters, server-side transfer with audit, clinic page + logo, role-based navigation and dashboards, new Firestore/Storage rules (draft), indexes, migration script (dry-run default).
NOT verified here (sandbox without network): `npm install`, `npm run lint`, `npm run build`, rules Emulator tests, any run against real Firebase. Only a partial stub-based `tsc` pass was done.
Not implemented: automatic invitation e-mails, rules unit tests, merging several legacy accounts into one clinic (each becomes its own clinic).
