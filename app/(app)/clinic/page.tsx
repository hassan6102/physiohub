"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextInput, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState, ListSkeleton } from "@/components/ui/states";
import { SafeImage } from "@/components/exercises/media";
import { useToast } from "@/components/ui/toast";
import { useLoad } from "@/hooks/use-load";
import { useAuth } from "@/lib/auth/auth-provider";
import { friendlyError } from "@/lib/utils/errors";
import { getClinic, updateClinic, uploadClinicLogo } from "@/services/team.service";

export default function ClinicPage() {
  const { role, refresh } = useAuth();
  const { show } = useToast();
  const { data, loading, error, reload } = useLoad(() => getClinic(), []);
  const [f, setF] = useState({ name: "", phone: "", email: "", address: "" });
  const [busy, setBusy] = useState(false);
  const isManager = role === "manager";

  useEffect(() => {
    if (data) setF({ name: data.name, phone: data.phone ?? "", email: data.email ?? "", address: data.address ?? "" });
  }, [data]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.name.trim().length < 2) return show("error", "اكتب اسم العيادة.");
    setBusy(true);
    try {
      await updateClinic(f);
      await refresh();
      show("success", "تم حفظ بيانات العيادة.");
    } catch (err) {
      show("error", friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const onLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      await uploadClinicLogo(file);
      await refresh();
      reload();
      show("success", "تم تحديث الشعار.");
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      show("error", m === "bad-type" ? "الشعار يجب أن يكون PNG أو JPG أو WebP." : m === "too-large" ? "حجم الشعار أقصى 1 ميجا." : friendlyError(err));
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="بيانات العيادة" breadcrumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "العيادة" }]} />
      {loading ? <ListSkeleton rows={3} /> : error ? <ErrorState message={error} onRetry={reload} /> : !data ? <ErrorState message="لم يتم العثور على العيادة." /> : (
        <div className="card space-y-5 p-5">
          <div className="flex items-center gap-4">
            <SafeImage src={data.logoUrl ?? ""} alt="شعار العيادة" className="h-20 w-20 rounded-xl border border-line bg-canvas" />
            {isManager && (
              <label className="cursor-pointer text-sm font-semibold text-secondary">
                تغيير الشعار
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={onLogo} />
              </label>
            )}
          </div>
          {isManager ? (
            <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
              <TextInput label="اسم العيادة" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              <TextInput label="الهاتف" type="tel" dir="ltr" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
              <TextInput label="البريد الإلكتروني" type="email" dir="ltr" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
              <div className="md:col-span-2"><Textarea label="العنوان" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
              <div className="md:col-span-2"><Button type="submit" loading={busy}>حفظ</Button></div>
            </form>
          ) : (
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              <div><dt className="text-xs text-muted">الاسم</dt><dd className="font-semibold text-ink">{data.name}</dd></div>
              <div><dt className="text-xs text-muted">الهاتف</dt><dd dir="ltr" className="text-start text-ink">{data.phone || "—"}</dd></div>
              <div><dt className="text-xs text-muted">البريد</dt><dd dir="ltr" className="text-start text-ink">{data.email || "—"}</dd></div>
              <div><dt className="text-xs text-muted">العنوان</dt><dd className="text-ink">{data.address || "—"}</dd></div>
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
