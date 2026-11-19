"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthCard } from "@/components/layout/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-provider";
import { authErrorKey } from "@/lib/auth/errors";
import { useI18n } from "@/lib/i18n/provider";
import { login } from "@/services/auth.service";

export default function LoginPage() {
  const { t } = useI18n();
  const { show } = useToast();
  const { user, configured } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.replace("/dashboard");
    } catch (err) {
      show("error", t(authErrorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title={t("auth.login")}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label={t("auth.email")} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
        <Input label={t("auth.password")} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
        <Link href="/forgot-password" className="block text-sm font-semibold text-secondary">
          {t("auth.forgot")}
        </Link>
        <Button type="submit" size="lg" className="w-full" loading={busy} disabled={!configured}>
          {t("auth.login")}
        </Button>
      </form>
      <p className="text-center text-sm text-muted">
        {t("auth.noAccount")}{" "}
        <Link href="/register" className="font-semibold text-secondary">{t("auth.register")}</Link>
      </p>
    </AuthCard>
  );
}
