"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="space-y-3">
        <h1 className="text-xl font-bold text-primary">حدث خطأ غير متوقع</h1>
        <p className="text-sm text-muted">حاول مرة أخرى، وإن استمرت المشكلة أعد تحميل الصفحة.</p>
        <button onClick={reset} className="h-11 rounded-xl bg-primary px-5 font-semibold text-white">إعادة المحاولة</button>
      </div>
    </div>
  );
}
