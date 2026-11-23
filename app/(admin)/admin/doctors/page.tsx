"use client";

import { useState } from "react";
import { Ban, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/states";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useLoad } from "@/hooks/use-load";
import { formatDate } from "@/lib/utils/date";
import { friendlyError } from "@/lib/utils/errors";
import { listDoctors, setDoctorDisabled } from "@/services/admin.service";
import { matchesQuery } from "@/lib/utils/misc";
import { Users } from "lucide-react";

export default function AdminDoctors() {
  const { data, loading, error, reload } = useLoad(() => listDoctors(), []);
  const confirm = useConfirm();
  const { show } = useToast();
  const [q, setQ] = useState("");
  const rows = (data ?? []).filter((d) => matchesQuery(q, d.fullName, d.email, d.clinicName, d.specialty));

  const toggle = async (uid: string, name: string, disable: boolean) => {
    if (!(await confirm({ title: disable ? "تعطيل الحساب" : "تفعيل الحساب", message: `${disable ? "سيتم منع" : "سيتم السماح لـ"} ${name} ${disable ? "من الدخول وإنهاء جلساته الحالية." : "بالدخول مرة أخرى."}`, confirmLabel: disable ? "تعطيل" : "تفعيل", danger: disable }))) return;
    try {
      await setDoctorDisabled(uid, disable);
      show("success", disable ? "تم تعطيل الحساب." : "تم تفعيل الحساب.");
      reload();
    } catch (e) {
      show("error", friendlyError(e));
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="الأطباء" description="تعطيل الحساب ينفَّذ على الخادم ويمنع الدخول وبيانات Firestore معًا." />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم أو البريد" aria-label="بحث" className="mb-4 h-11 w-full rounded-xl border border-line bg-surface px-3.5 sm:max-w-sm" />
      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Users} title="لا يوجد أطباء" />
      ) : (
        <ResponsiveTable
          rows={rows.map((r) => ({ ...r, id: r.uid }))}
          columns={[
            { key: "n", header: "الاسم", primary: true, cell: (r) => r.fullName },
            { key: "e", header: "البريد", cell: (r) => <span dir="ltr">{r.email}</span> },
            { key: "s", header: "التخصص", cell: (r) => r.specialty || "—" },
            { key: "c", header: "التسجيل", cell: (r) => formatDate(r.createdAt) },
            { key: "st", header: "الحالة", cell: (r) => <Badge tone={r.status === "disabled" ? "danger" : "success"}>{r.status === "disabled" ? "معطّل" : "نشط"}</Badge> },
          ]}
          actions={(r) =>
            r.status === "disabled" ? (
              <Button size="sm" variant="outline" onClick={() => toggle(r.uid, r.fullName, false)}><CheckCircle2 className="h-4 w-4" aria-hidden />تفعيل</Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => toggle(r.uid, r.fullName, true)}><Ban className="h-4 w-4" aria-hidden />تعطيل</Button>
            )
          }
        />
      )}
    </div>
  );
}
