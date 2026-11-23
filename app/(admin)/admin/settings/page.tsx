"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea, TextInput } from "@/components/ui/form";
import { ErrorState, ListSkeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useLoad } from "@/hooks/use-load";
import { friendlyError } from "@/lib/utils/errors";
import { getPlatformSettings, savePlatformSettings } from "@/services/admin.service";

export default function AdminSettings() {
  const { data, loading, error, reload } = useLoad(() => getPlatformSettings(), []);
  const { show } = useToast();
  const [announcement, setAnnouncement] = useState("");
  const [support, setSupport] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (data) {
      setAnnouncement(data.announcement);
      setSupport(data.supportContact);
    }
  }, [data]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await savePlatformSettings({ announcement: announcement.trim().slice(0, 500), supportContact: support.trim().slice(0, 200) });
      show("success", "تم حفظ الإعدادات.");
    } catch (err) {
      show("error", friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="إعدادات المنصة" />
      {loading ? <ListSkeleton rows={2} /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <form onSubmit={save} className="card space-y-4 p-5">
          <Textarea label="إعلان يظهر في لوحة تحكم كل طبيب" hint="اتركه فارغًا لإخفائه (حتى 500 حرف)." value={announcement} maxLength={500} onChange={(e) => setAnnouncement(e.target.value)} />
          <TextInput label="وسيلة التواصل مع الدعم" value={support} maxLength={200} onChange={(e) => setSupport(e.target.value)} />
          <Button type="submit" loading={busy}>حفظ</Button>
        </form>
      )}
    </div>
  );
}
