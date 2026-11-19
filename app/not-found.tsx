import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="space-y-3">
        <p className="text-5xl font-extrabold text-accent">404</p>
        <h1 className="text-xl font-bold text-primary">الصفحة غير موجودة</h1>
        <Link href="/" className="inline-flex h-11 items-center rounded-xl bg-primary px-5 font-semibold text-white">العودة للرئيسية</Link>
      </div>
    </div>
  );
}
