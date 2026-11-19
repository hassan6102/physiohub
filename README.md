# PhysioHub — منصة SaaS لأخصائيي العلاج الطبيعي

Next.js 15 (App Router) + React 19 + TypeScript + Tailwind + Firebase (Auth, Firestore, Storage, App Check, Admin SDK) + Vercel.
الواجهة عربية بالكامل (RTL). الألوان: #123B50 / #1D7180 / #36B6A6، الخطوط Cairo وInter.

> **حالة الاختبار:** المشروع كُتب بدون اتصال بالإنترنت ولم يُنفَّذ `npm install` ولا `npm run build` ولا الاتصال بـ Firebase حقيقي. راجع `STATUS.md` لقائمة ما اختُبر وما لم يُختبر.

## ما يحتويه
المرضى (أرشفة لا حذف) · الجلسات (حذف ناعم مع سبب) · القياسات والتقدم · مكتبة التمارين (خاصة + عامة + يوتيوب) · البرامج العلاجية (نسخة لقطة لكل تمرين، جرعات، سحب وإفلات) · مشاركة البرنامج برابط سري ورمز تحقق اختياري · بوابة المريض `/p/<token>` بدون حساب مع تسجيل الإنجاز · القوالب الديناميكية · المواعيد مع كشف التعارض · التقارير (طباعة/PDF) · لوحة تحكم · لوحة إدارة المنصة `/admin`.

## التشغيل محليًا
```bash
npm install
cp .env.example .env.local      # املأ القيم من مشروع Firebase الخاص بك
npm run dev                     # http://localhost:3000
npm run check                   # typecheck + lint + build
```
Node ≥ 20.9.

## الربط بـ Firebase
1. **Authentication:** فعّل Email/Password. (اختياري) في Templates > Password reset غيّر Action URL إلى `https://<نطاقك>/reset-password` لاستخدام صفحة الاستعادة المدمجة.
2. **Firestore:** أنشئ قاعدة بيانات (Native mode).
3. **Storage:** فعّل Storage (للمرفقات الطبية الخاصة).
4. **تطبيق ويب:** انسخ إعداداته إلى متغيرات `NEXT_PUBLIC_FIREBASE_*`.
5. **Service Account:** Project settings > Service accounts > Generate key، ثم ضع القيم في `FIREBASE_ADMIN_*` (على الخادم فقط. لا ترفعها إلى GitHub).
6. **App Check (موصى به):** سجّل reCAPTCHA v3 وضع المفتاح العام في `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY`، ثم فعّل الإنفاذ بعد التجربة.
7. **نشر القواعد والفهارس:**
   ```bash
   npm i -g firebase-tools && firebase login
   firebase use <project-id>
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```
   بناء الفهارس قد يستغرق دقائق؛ استعلام يفتقد فهرسًا يعرض في وحدة تحكم المتصفح رابط إنشائه.
8. **أول أدمن:** سجّل حسابًا عاديًا ثم:
   ```bash
   node --env-file=.env.local scripts/set-admin.mjs you@example.com
   ```
   اخرج وادخل مرة أخرى ليظهر `/admin`.

## النشر على Vercel
أضف نفس متغيرات `.env.example` في Project Settings > Environment Variables (مع `\n` داخل `FIREBASE_ADMIN_PRIVATE_KEY` بين علامتي اقتباس)، وأضف نطاق Vercel إلى Authorized domains في Firebase Auth. مسارات `/api/*` تعمل بـ Node runtime.

## الأمان باختصار
- عزل كل طبيب في `doctors/{uid}/...` بقواعد Firestore؛ منع حذف المرضى والجلسات والسجلات وسجل التدقيق.
- روابط المشاركة: رمز عشوائي 43 حرفًا، يُخزَّن SHA-256 فقط، رمز التحقق scrypt، قفل بعد 5 محاولات خاطئة، إلغاء وانتهاء صلاحية يُفحصان على الخادم، ولا تُعرض هوية المريض.
- صلاحية الأدمن عبر custom claim فقط، وتعطيل الحساب ينفَّذ على الخادم (يُلغي الجلسات).
- لا أسرار في الكود. `.env*` ومفاتيح الخدمة مُستبعدة في `.gitignore`.
- المنصة لا تقدّم تشخيصًا طبيًا.
