"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/layout/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-provider";
import { authErrorKey } from "@/lib/auth/errors";
import { useI18n } from "@/lib/i18n/provider";
import { registerClinic } from "@/services/auth.service";

export default function RegisterPage() {
  const { t } = useI18n();
  const { show } = useToast();
  const { configured, refresh } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ fullName: "", specialty: "", phone: "", email: "", password: "", clinicName: "", practicing: true });
  const set = (k: Exclude<keyof typeof form, "practicing">) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await registerClinic({ ...form, email: form.email.trim() });
      await refresh();
      router.replace("/dashboard");
    } catch (err) {
      show("error", t(authErrorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title={t("auth.register")}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label={t("auth.fullName")} required value={form.fullName} onChange={set("fullName")} autoComplete="name" />
        <Input label={t("auth.specialty")} required value={form.specialty} onChange={set("specialty")} />
        <Input label={t("auth.phone")} type="tel" required value={form.phone} onChange={set("phone")} autoComplete="tel" dir="ltr" />
        <Input label="اسم العيادة" required value={form.clinicName} onChange={set("clinicName")} />
        <Input label={t("auth.email")} type="email" required value={form.email} onChange={set("email")} autoComplete="email" dir="ltr" />
        <Input label={t("auth.password")} type="password" required minLength={8} value={form.password} onChange={set("password")} autoComplete="new-password" dir="ltr" />
        <label className="flex items-start gap-2 text-sm text-ink">
          <input type="checkbox" className="mt-1 h-4 w-4" checked={form.practicing} onChange={(e) => setForm((f) => ({ ...f, practicing: e.target.checked }))} />
          <span>أعالج مرضى بنفسي أيضًا (يمكن إسناد مرضى لحسابي)</span>
        </label>
        <p className="text-xs text-muted">هذا الحساب سيكون «مدير العيادة». تضيف دكاترتك لاحقًا بدعوة من قسم إدارة الدكاترة.</p>
        <Button type="submit" size="lg" className="w-full" loading={busy} disabled={!configured}>
          {t("auth.register")}
        </Button>
      </form>
      <p className="text-center text-sm text-muted">
        {t("auth.haveAccount")}{" "}
        <Link href="/login" className="font-semibold text-secondary">{t("auth.login")}</Link>
      </p>
    </AuthCard>
  );
}
