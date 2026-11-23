"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Ban, CheckCircle2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { EmptyState, ErrorState, ListSkeleton, LoadMore } from "@/components/ui/states";
import { PatientStatusBadge } from "@/components/patients/patient-status-badge";
import { TransferPatientModal } from "@/components/clinic/transfer-patient-modal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useLoad } from "@/hooks/use-load";
import { usePaged } from "@/hooks/use-paged";
import { useTeam } from "@/hooks/use-team";
import { useAuth } from "@/lib/auth/auth-provider";
import { formatDate, relativeDays } from "@/lib/utils/date";
import { friendlyError } from "@/lib/utils/errors";
import { patientsQuery } from "@/services/patients.service";
import { getDoctorStats, getMember, updateMember } from "@/services/team.service";
import type { Patient } from "@/types/models";

export default function DoctorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { role } = useAuth();
  const confirm = useConfirm();
  const { show } = useToast();
  const team = useTeam();
  const member = useLoad(() => getMember(id), [id], role === "manager");
  const stats = useLoad(() => getDoctorStats(id), [id], role === "manager");
  const patients = usePaged<Patient>({ build: () => patientsQuery({ status: "all", sort: "createdAt", doctorId: id }), pageSize: 20, deps: [id], enabled: role === "manager" });
  const [form, setForm] = useState({ fullName: "", specialty: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [transferring, setTransferring] = useState<Patient | null>(null);

  useEffect(() => {
    if (member.data) setForm({ fullName: member.data.fullName, specialty: member.data.specialty ?? "", phone: member.data.phone ?? "" });
  }, [member.data]);

  if (role !== "manager") return <ErrorState message="هذه الصفحة لمدير العيادة فقط." />;
  if (member.loading) return <ListSkeleton rows={3} />;
  if (member.error) return <ErrorState message={member.error} onRetry={member.reload} />;
  const m = member.data;
  if (!m) return <ErrorState message="الدكتور غير موجود في عيادتك." />;
  const isDoctor = m.role === "doctor";

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateMember(m.id, form);
      show("success", "تم حفظ بيانات الدكتور.");
      member.reload();
      team.reload();
    } catch (err) {
      show("error", friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (disable: boolean) => {
    const ok = await confirm({
      title: disable ? "إيقاف الدكتور" : "تفعيل الدكتور",
      message: disable ? "سيُمنع من الدخول فورًا وتبقى بياناته ومرضاه محفوظة." : "سيستطيع الدخول مرة أخرى.",
      confirmLabel: disable ? "إيقاف" : "تفعيل",
      danger: disable,
    });
    if (!ok) return;
    try {
      await updateMember(m.id, { disabled: disable });
      show("success", disable ? "تم الإيقاف." : "تم التفعيل.");
      member.reload();
    } catch (err) {
      show("error", friendlyError(err));
    }
  };

  const s = stats.data;
  const cards = [
    { label: "المرضى المسندون", value: s?.patients },
    { label: "المرضى النشطون", value: s?.activePatients },
    { label: "الجلسات المنفَّذة", value: s?.sessions },
    { label: "المواعيد", value: s?.appointments },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={m.fullName}
        breadcrumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "إدارة الدكاترة", href: "/team" }, { label: m.fullName }]}
        actions={
          isDoctor &&
          (m.status === "disabled" ? (
            <Button variant="outline" onClick={() => toggle(false)}><CheckCircle2 className="h-4 w-4" aria-hidden />تفعيل</Button>
          ) : (
            <Button variant="outline" onClick={() => toggle(true)}><Ban className="h-4 w-4" aria-hidden />إيقاف</Button>
          ))
        }
      />

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Badge tone={m.status === "disabled" ? "danger" : "success"}>{m.status === "disabled" ? "موقوف" : "نشط"}</Badge>
        <span className="text-muted">{m.role === "manager" ? "مدير العيادة" : "دكتور"}</span>
        <span dir="ltr" className="text-muted">{m.email}</span>
        <span className="text-muted">آخر نشاط: {s?.lastActivityAt ? relativeDays(s.lastActivityAt) : "—"}</span>
        {m.createdAt && <span className="text-muted">انضم {formatDate(m.createdAt)}</span>}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <p className="text-2xl font-bold text-primary">{stats.loading ? "…" : c.value ?? "—"}</p>
            <p className="text-xs text-muted">{c.label}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted">«الجلسات المنفَّذة» تُحسب بحسب من سجّلها، وتبقى له حتى بعد نقل المريض. أما المرضى والمواعيد فبحسب المسؤولية الحالية.</p>

      {isDoctor && (
        <form onSubmit={save} className="card grid gap-4 p-5 sm:grid-cols-3">
          <TextInput label="الاسم" required value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
          <TextInput label="التخصص" value={form.specialty} onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))} />
          <TextInput label="الهاتف" dir="ltr" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <div className="sm:col-span-3"><Button type="submit" loading={busy}>حفظ البيانات</Button></div>
        </form>
      )}

      <section>
        <h2 className="mb-3 font-bold text-primary">مرضى {m.fullName}</h2>
        {patients.loading ? (
          <ListSkeleton rows={3} />
        ) : patients.error ? (
          <ErrorState message={patients.error} onRetry={patients.reload} />
        ) : patients.items.length === 0 ? (
          <EmptyState icon={Users} title="لا يوجد مرضى مسندون لهذا الدكتور" />
        ) : (
          <>
            <ResponsiveTable
              rows={patients.items}
              columns={[
                { key: "n", header: "الاسم", primary: true, cell: (p) => <Link href={`/patients/${p.id}`} className="font-semibold text-secondary hover:underline" onClick={(e) => e.stopPropagation()}>{p.fullName}</Link> },
                { key: "s", header: "الحالة", cell: (p) => <PatientStatusBadge status={p.status} /> },
                { key: "v", header: "آخر جلسة", cell: (p) => formatDate(p.lastVisitAt) },
              ]}
              onRowClick={(p) => router.push(`/patients/${p.id}`)}
              actions={(p) => (p.status === "archived" ? null : <Button size="sm" variant="outline" onClick={() => setTransferring(p)}>نقل</Button>)}
            />
            <LoadMore hasMore={patients.hasMore} loading={patients.loadingMore} onClick={patients.loadMore} />
          </>
        )}
      </section>

      <TransferPatientModal open={Boolean(transferring)} onClose={() => setTransferring(null)} patient={transferring} team={team.members} onDone={() => { patients.reload(); stats.reload(); }} />
    </div>
  );
}
