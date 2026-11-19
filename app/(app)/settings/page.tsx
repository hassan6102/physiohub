"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextInput, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState, ListSkeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useLoad } from "@/hooks/use-load";
import { friendlyError } from "@/lib/utils/errors";
import { changeMyPassword, getMyProfile, saveMyProfile } from "@/services/profile.service";

export default function SettingsPage() {
  const { show } = useToast();
  const { data, loading, error, reload } = useLoad(() => getMyProfile(), []);
  const [f, setF] = useState({ fullName: "", specialty: "", phone: "", clinicName: "", address: "", photoUrl: "" });
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", again: "" });
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    if (data) setF({ fullName: data.fullName ?? "", specialty: data.specialty ?? "", phone: data.phone ?? "", clinicName: data.clinicName ?? "", address: data.address ?? "", photoUrl: data.photoUrl ?? "" });
  }, [data]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.fullName.trim().length < 2) return show("error", "اكتب الاسم الكامل.");
    if (f.photoUrl && !/^https:\/\//i.test(f.photoUrl)) return show("error", "رابط الصورة يجب أن يبدأ بـ https.");
    setSaving(true);
    try { await saveMyProfile({ ...f, fullName: f.fullName.trim() }); show("success", "تم حفظ البيانات."); } catch (err) { show("error", friendlyError(err)); } finally { setSaving(false); }
  };

  const savePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next.length < 8) return show("error", "كلمة المرور الجديدة 8 أحرف على الأقل.");
    if (pw.next !== pw.again) return show("error", "تأكيد كلمة المرور غير مطابق.");
    setPwBusy(true);
    try { await changeMyPassword(pw.current, pw.next); setPw({ current: "", next: "", again: "" }); show("success", "تم تغيير كلمة المرور."); } catch (err) { show("error", friendlyError(err)); } finally { setPwBusy(false); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="الإعدادات" breadcrumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "الإعدادات" }]} />
      {loading ? <ListSkeleton rows={3} /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <form onSubmit={saveProfile} className="card grid gap-4 p-5 md:grid-cols-2">
            <h2 className="text-lg font-bold text-primary md:col-span-2">الملف المهني</h2>
            <TextInput label="الاسم الكامل" required value={f.fullName} onChange={set("fullName")} />
            <TextInput label="التخصص" value={f.specialty} onChange={set("specialty")} />
            <TextInput label="الهاتف" type="tel" dir="ltr" value={f.phone} onChange={set("phone")} />
            <TextInput label="اسم العيادة" value={f.clinicName} onChange={set("clinicName")} />
            <div className="md:col-span-2"><Textarea label="العنوان" value={f.address} onChange={set("address")} /></div>
            <div className="md:col-span-2"><TextInput label="رابط صورة الملف (https)" dir="ltr" value={f.photoUrl} onChange={set("photoUrl")} /></div>
            <p className="text-xs text-muted md:col-span-2">اسمك واسم العيادة يظهران للمريض في صفحة البرنامج المشترك. البريد الإلكتروني: {data?.email}</p>
            <div className="md:col-span-2"><Button type="submit" disabled={saving}>حفظ</Button></div>
          </form>
          <form onSubmit={savePw} className="card grid gap-4 p-5">
            <h2 className="text-lg font-bold text-primary">تغيير كلمة المرور</h2>
            <TextInput label="كلمة المرور الحالية" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw((s) => ({ ...s, current: e.target.value }))} />
            <TextInput label="كلمة المرور الجديدة" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw((s) => ({ ...s, next: e.target.value }))} />
            <TextInput label="تأكيد كلمة المرور" type="password" autoComplete="new-password" value={pw.again} onChange={(e) => setPw((s) => ({ ...s, again: e.target.value }))} />
            <div><Button type="submit" disabled={pwBusy || !pw.current}>تغيير كلمة المرور</Button></div>
          </form>
        </>
      )}
    </div>
  );
}
