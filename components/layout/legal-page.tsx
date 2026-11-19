import Link from "next/link";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="text-sm font-semibold text-secondary">← الصفحة الرئيسية</Link>
      <h1 className="mt-4 text-3xl font-bold text-primary">{title}</h1>
      <p className="mt-3 rounded-xl bg-warning/10 p-3 text-sm leading-7">
        هذا نص مبدئي لأغراض التطوير، ويجب مراجعته من مستشار قانوني قبل الإطلاق التجاري بما يتوافق مع القوانين المحلية لحماية البيانات الصحية.
      </p>
      <div className="mt-6 space-y-5 leading-8 text-ink [&_h2]:mb-1 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-primary [&_ul]:list-disc [&_ul]:ps-6">{children}</div>
    </main>
  );
}
