"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/layout/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { completePasswordReset } from "@/services/auth.service";

function Form() {
  const params = useSearchParams();
  const code = params.get("oobCode") ?? "";
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (pw.length < 8) return setErr("كلمة المرور يجب ألا تقل عن 8 أحرف.");
    setBusy(true);
    try {
      await completePasswordReset(code, pw);
      setDone(true);
    } catch {
      setErr("الرابط غير صالح أو منتهي. اطلب رابطًا جديدًا.");
    } finally {
      setBusy(false);
    }
  }

  if (!code)
    return (
      <>
        <p className="text-sm text-danger">رابط غير صالح.</p>
        <Link href="/forgot-password" className="block text-center text-sm font-semibold text-secondary">طلب رابط جديد</Link>
      </>
    );
  if (done)
    return (
      <>
        <p className="text-sm text-ink">تم تغيير كلمة المرور. يمكنك تسجيل الدخول الآن.</p>
        <Link href="/login" className="block text-center text-sm font-semibold text-secondary">تسجيل الدخول</Link>
      </>
    );
  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="كلمة المرور الجديدة" type="password" required minLength={8} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} dir="ltr" error={err || undefined} />
      <Button type="submit" size="lg" className="w-full" loading={busy}>حفظ كلمة المرور</Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCard title="تعيين كلمة مرور جديدة">
      <Suspense fallback={null}>
        <Form />
      </Suspense>
    </AuthCard>
  );
}
