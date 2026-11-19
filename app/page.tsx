import Link from "next/link";
import { ArrowLeft, CalendarDays, ClipboardList, Dumbbell, HeartPulse, LineChart, Share2, ShieldCheck, Users } from "lucide-react";

const features = [
  { icon: Users, t: "إدارة المرضى", d: "ملف كامل لكل مريض: البيانات، التاريخ المرضي، الجلسات، الملاحظات والمرفقات." },
  { icon: Dumbbell, t: "مكتبة التمارين", d: "مكتبتك الخاصة بفيديوهات YouTube، مع مكتبة عامة يمكنك نسخ تمارينها." },
  { icon: ClipboardList, t: "برامج علاجية", d: "ابنِ برنامجًا بجرعات دقيقة لكل تمرين، واحفظه مسودة أو انشره." },
  { icon: Share2, t: "مشاركة برابط آمن", d: "يفتح المريض برنامجه من الهاتف بدون حساب، برابط سري ورمز تحقق اختياري." },
  { icon: CalendarDays, t: "المواعيد", d: "تقويم وقائمة، تنبيه عند تعارض المواعيد، وتأكيد أو إلغاء بنقرة." },
  { icon: LineChart, t: "متابعة التقدم", d: "قياسات الألم والحركة والقوة في رسوم بيانية، وتقارير قابلة للطباعة." },
];
const steps = [
  { t: "أنشئ حسابك", d: "سجّل ببريدك وأضف بيانات عيادتك." },
  { t: "أضف مرضاك وتمارينك", d: "ابنِ مكتبتك أو استورد من المكتبة العامة." },
  { t: "أنشئ برنامجًا وشاركه", d: "أرسل الرابط عبر واتساب، وتابع التزام المريض." },
];
const faqs = [
  { q: "هل يحتاج المريض إلى حساب؟", a: "لا. يفتح المريض الرابط الذي ترسله له مباشرة من المتصفح، ولا يرى سوى برنامجه." },
  { q: "هل بيانات مرضاي خاصة؟", a: "نعم. بيانات كل طبيب معزولة عن غيره وتُحمى بقواعد أمان على الخادم، ولا تظهر هوية المريض في صفحة البرنامج." },
  { q: "ماذا لو ضاع الرابط؟", a: "يظهر الرابط مرة واحدة عند إنشائه لأسباب أمنية. يمكنك إلغاؤه وإنشاء رابط جديد في أي وقت." },
  { q: "هل تشخّص المنصة الحالات؟", a: "لا. المنصة أداة تنظيم ومتابعة، والقرار العلاجي يبقى للأخصائي." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <span className="flex items-center gap-2 text-lg font-extrabold text-primary">
          <HeartPulse className="h-6 w-6 text-accent" aria-hidden />
          PhysioHub
        </span>
        <nav className="flex items-center gap-2">
          <Link href="/login" className="inline-flex h-10 items-center rounded-xl px-3 text-sm font-semibold text-ink">تسجيل الدخول</Link>
          <Link href="/register" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white">إنشاء حساب</Link>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-4 pb-16 pt-14 text-center sm:pt-24">
        <h1 className="text-3xl font-extrabold leading-tight text-primary sm:text-5xl">أدر عيادة العلاج الطبيعي بوضوح وسرعة</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted sm:text-lg">
          ملفات المرضى، الجلسات، مكتبة التمارين، وبرامج علاجية تُرسل للمريض برابط واحد، كل ذلك في مكان واحد.
        </p>
        <Link href="/register" className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 font-semibold text-white shadow-card hover:bg-primary-700">
          ابدأ الآن
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Link>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16" aria-labelledby="features">
        <h2 id="features" className="mb-6 text-2xl font-bold text-primary">المميزات</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, t, d }) => (
            <div key={t} className="card p-5">
              <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-accent-50 text-accent-600">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="font-bold text-ink">{t}</h3>
              <p className="mt-1.5 text-sm leading-7 text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16" aria-labelledby="how">
        <h2 id="how" className="mb-6 text-2xl font-bold text-primary">كيف تعمل المنصة</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.t} className="card flex gap-3 p-5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary font-bold text-white">{i + 1}</span>
              <div>
                <h3 className="font-bold text-ink">{s.t}</h3>
                <p className="mt-1 text-sm text-muted">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="card flex items-start gap-3 p-5">
          <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-secondary" aria-hidden />
          <p className="text-sm leading-7 text-ink">
            الخصوصية أولًا: بيانات كل عيادة معزولة، وروابط المرضى سرية وقابلة للإلغاء وانتهاء الصلاحية، والمنصة لا تقدّم تشخيصًا طبيًا.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20" aria-labelledby="faq">
        <h2 id="faq" className="mb-6 text-2xl font-bold text-primary">أسئلة شائعة</h2>
        <div className="space-y-3">
          {faqs.map(({ q, a }) => (
            <details key={q} className="card p-4">
              <summary className="cursor-pointer font-semibold text-ink">{q}</summary>
              <p className="mt-2 text-sm leading-7 text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center text-sm text-muted">
        <div className="mb-2 flex justify-center gap-4">
          <Link href="/privacy" className="hover:text-primary">سياسة الخصوصية</Link>
          <Link href="/terms" className="hover:text-primary">الشروط والأحكام</Link>
        </div>
        © PhysioHub
      </footer>
    </div>
  );
}
