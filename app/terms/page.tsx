import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = { title: "الشروط والأحكام | PhysioHub" };

export default function TermsPage() {
  return (
    <LegalPage title="الشروط والأحكام">
      <section><h2>طبيعة الخدمة</h2><p>PhysioHub أداة تنظيم ومتابعة للأخصائيين، ولا تقدّم تشخيصًا أو نصيحة طبية، والقرار العلاجي مسؤولية الأخصائي وحده.</p></section>
      <section><h2>استخدام الحساب</h2><p>أنت مسؤول عن سرية بيانات الدخول وعن كل نشاط يتم عبر حسابك، ويُحظر استخدام المنصة لأي غرض غير مشروع.</p></section>
      <section><h2>المحتوى</h2><p>أنت مسؤول عن المحتوى الذي تضيفه، بما فيه روابط الفيديو والصور، وعن امتلاكك حق استخدامها.</p></section>
      <section><h2>إيقاف الحساب</h2><p>يحق لإدارة المنصة تعليق الحسابات المخالفة.</p></section>
      <section><h2>إخلاء المسؤولية</h2><p>تُقدَّم الخدمة كما هي دون ضمان بخلوها من الانقطاع أو الأخطاء، ويُنصح بالاحتفاظ بنسخ احتياطية من البيانات المهمة.</p></section>
    </LegalPage>
  );
}
