"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthCard } from "@/components/layout/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth/auth-provider";
import { friendlyError } from "@/lib/utils/errors";
import { login, signUpAccount } from "@/services/auth.service";

type Info = { clinicName: string; email: string; fullName: string };

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { show } = useToast();
  const { user, loading, refresh } = useAuth();
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/invites/${token}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error ?? "هذه الدعوة غير صالحة.");
        setInfo(d as Info);
      })
      .catch((e) => setError(e.message));
  }, [token]);

  async function accept() {
    await apiFetch(`/api/invites/${token}/accept`, { method: "POST" });
    await refresh();
    router.replace("/dashboard");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!info) return;
    setBusy(true);
    try {
      if (mode === "signup") await signUpAccount(info.email, password, info.fullName);
      else await login(info.email, password);
      await accept();
    } catch (err) {
      show("error", friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  if (error) return <AuthCard title="دعوة غير صالحة"><p className="text-sm text-muted">{error}</p></AuthCard>;
  if (!info || loading) return <AuthCard title="دعوة للانضمام"><p className="text-sm text-muted">جارٍ التحميل…</p></AuthCard>;

  const signedInOther = user && user.email?.toLowerCase() !== info.email.toLowerCase();

  return (
    <AuthCard title={`الانضمام إلى ${info.clinicName}`}>
      <p className="text-sm text-muted">دُعيت للعمل كدكتور في هذه العيادة بالبريد <b dir="ltr">{info.email}</b>.</p>
      {user && !signedInOther ? (
        <Button size="lg" className="w-full" loading={busy} onClick={async () => { setBusy(true); try { await accept(); } catch (err) { show("error", friendlyError(err)); } finally { setBusy(false); } }}>
          قبول الدعوة
        </Button>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {signedInOther && <p className="rounded-xl bg-warning/10 p-3 text-sm">أنت مسجّل بحساب آخر. سجّل الخروج ثم افتح الرابط مرة أخرى بالبريد المدعو.</p>}
          <Input label="البريد الإلكتروني" value={info.email} readOnly dir="ltr" />
          <Input label={mode === "signup" ? "اختر كلمة مرور (8 أحرف على الأقل)" : "كلمة المرور"} type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" autoComplete={mode === "signup" ? "new-password" : "current-password"} />
          <Button type="submit" size="lg" className="w-full" loading={busy} disabled={Boolean(signedInOther)}>{mode === "signup" ? "إنشاء الحساب والانضمام" : "تسجيل الدخول والانضمام"}</Button>
          <button type="button" className="w-full text-center text-sm font-semibold text-secondary" onClick={() => setMode((m) => (m === "signup" ? "login" : "signup"))}>
            {mode === "signup" ? "لدي حساب بالفعل" : "ليس لدي حساب"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
