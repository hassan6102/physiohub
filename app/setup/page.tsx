"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthCard } from "@/components/layout/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth/auth-provider";
import { friendlyError } from "@/lib/utils/errors";

/** A signed-in account with no clinic yet (e.g. an account from before the clinics update) creates its clinic here. */
export default function SetupPage() {
  const { user, loading, clinicId, refresh } = useAuth();
  const router = useRouter();
  const { show } = useToast();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ clinicName: "", fullName: "", specialty: "", phone: "", practicing: true });

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (clinicId) router.replace("/dashboard");
    else setF((x) => ({ ...x, fullName: x.fullName || user.displayName || "" }));
  }, [loading, user, clinicId, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiFetch("/api/clinics", { method: "POST", body: JSON.stringify(f) });
      await refresh();
      router.replace("/dashboard");
    } catch (err) {
      // 409 = the account already has a clinic (e.g. created a moment ago): reload the claims and go in.
      if ((err as { status?: number })?.status === 409) {
        await refresh();
        router.replace("/dashboard");
        return;
      }
      show("error", friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="إعداد العيادة">
      <p className="text-sm text-muted">حسابك غير مرتبط بعيادة. أنشئ عيادتك لتصبح مديرها، أو اطلب دعوة من مدير عيادة موجودة.</p>
      <form onSubmit={submit} className="space-y-4">
        <Input label="اسم العيادة" required value={f.clinicName} onChange={(e) => setF({ ...f, clinicName: e.target.value })} />
        <Input label="اسمك" required value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} />
        <Input label="التخصص" value={f.specialty} onChange={(e) => setF({ ...f, specialty: e.target.value })} />
        <Input label="الهاتف" type="tel" dir="ltr" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <label className="flex items-start gap-2 text-sm text-ink">
          <input type="checkbox" className="mt-1 h-4 w-4" checked={f.practicing} onChange={(e) => setF({ ...f, practicing: e.target.checked })} />
          <span>أعالج مرضى بنفسي أيضًا</span>
        </label>
        <Button type="submit" size="lg" className="w-full" loading={busy}>إنشاء العيادة</Button>
      </form>
    </AuthCard>
  );
}
