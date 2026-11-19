"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthCard } from "@/components/layout/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-provider";
import { useI18n } from "@/lib/i18n/provider";
import { requestPasswordReset } from "@/services/auth.service";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const { show } = useToast();
  const { configured } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await requestPasswordReset(email.trim());
    } catch {
      // Same message either way so account existence is not revealed.
    } finally {
      show("success", t("auth.resetSent"));
      setBusy(false);
    }
  }

  return (
    <AuthCard title={t("auth.forgot")}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label={t("auth.email")} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
        <Button type="submit" size="lg" className="w-full" loading={busy} disabled={!configured}>
          {t("auth.sendReset")}
        </Button>
      </form>
      <Link href="/login" className="block text-center text-sm font-semibold text-secondary">
        {t("auth.login")}
      </Link>
    </AuthCard>
  );
}
