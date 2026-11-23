"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ban, CheckCircle2, Copy, MailPlus, Trash2, UserCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { TextInput } from "@/components/ui/form";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/states";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useLoad } from "@/hooks/use-load";
import { useAuth } from "@/lib/auth/auth-provider";
import { waLink } from "@/lib/utils/misc";
import { formatDate, relativeDays } from "@/lib/utils/date";
import { friendlyError } from "@/lib/utils/errors";
import {
  createInvite,
  getDoctorStats,
  getInvites,
  getTeam,
  revokeInvite,
  updateMember,
  type DoctorStats,
  type Member,
} from "@/services/team.service";

type Row = Member & { stats: DoctorStats | null };

async function loadTeam(): Promise<Row[]> {
  const members = await getTeam();
  // Real counts per doctor; a failing count must not hide the whole team.
  return Promise.all(members.map(async (m) => ({ ...m, stats: await getDoctorStats(m.id).catch(() => null) })));
}

export default function TeamPage() {
  const { role } = useAuth();
  const router = useRouter();
  const confirm = useConfirm();
  const { show } = useToast();
  const team = useLoad(loadTeam, [], role === "manager");
  const invites = useLoad(() => getInvites(), [], role === "manager");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", specialty: "" });
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState("");

  if (role !== "manager") return <ErrorState message="هذه الصفحة لمدير العيادة فقط." />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await createInvite(form);
      setLink(res.url);
      invites.reload();
    } catch (err) {
      show("error", friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const closeInvite = () => {
    setInviteOpen(false);
    setLink("");
    setForm({ fullName: "", email: "", specialty: "" });
  };

  const toggle = async (m: Member, disable: boolean) => {
    const ok = await confirm({
      title: disable ? "إيقاف الدكتور" : "تفعيل الدكتور",
      message: disable
        ? `سيُمنع ${m.fullName} من الدخول فورًا. تبقى بياناته ومرضاه محفوظة، ويمكنك نقل مرضاه إلى دكتور آخر.`
        : `سيستطيع ${m.fullName} الدخول إلى العيادة مرة أخرى.`,
      confirmLabel: disable ? "إيقاف" : "تفعيل",
      danger: disable,
    });
    if (!ok) return;
    try {
      await updateMember(m.id, { disabled: disable });
      show("success", disable ? "تم إيقاف الدكتور." : "تم تفعيل الدكتور.");
      team.reload();
    } catch (e) {
      show("error", friendlyError(e));
    }
  };

  const revoke = async (id: string) => {
    try {
      await revokeInvite(id);
      invites.reload();
    } catch (e) {
      show("error", friendlyError(e));
    }
  };

  const rows = team.data ?? [];
  const pending = (invites.data ?? []).filter((i) => i.status === "pending" && i.expiresAt.getTime() > Date.now());

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="إدارة الدكاترة"
        breadcrumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "إدارة الدكاترة" }]}
        actions={
          <Button onClick={() => setInviteOpen(true)}>
            <MailPlus className="h-4 w-4" aria-hidden />
            دعوة دكتور
          </Button>
        }
      />

      {team.loading ? (
        <ListSkeleton />
      ) : team.error ? (
        <ErrorState message={team.error} onRetry={team.reload} />
      ) : rows.length === 0 ? (
        <EmptyState icon={UserCog} title="لا يوجد أعضاء" />
      ) : (
        <ResponsiveTable
          rows={rows}
          columns={[
            {
              key: "name",
              header: "الاسم",
              primary: true,
              cell: (m) => (
                <div>
                  <Link href={`/team/${m.id}`} className="font-semibold text-secondary hover:underline" onClick={(e) => e.stopPropagation()}>
                    {m.fullName}
                  </Link>
                  <p className="text-xs text-muted">{m.role === "manager" ? "مدير العيادة" : m.specialty || "دكتور"}</p>
                </div>
              ),
            },
            { key: "status", header: "الحالة", cell: (m) => <Badge tone={m.status === "disabled" ? "danger" : "success"}>{m.status === "disabled" ? "موقوف" : "نشط"}</Badge> },
            { key: "p", header: "المرضى المسندون", cell: (m) => m.stats?.patients ?? "—" },
            { key: "a", header: "النشطون", cell: (m) => m.stats?.activePatients ?? "—" },
            { key: "s", header: "الجلسات", cell: (m) => m.stats?.sessions ?? "—" },
            { key: "ap", header: "المواعيد", cell: (m) => m.stats?.appointments ?? "—" },
            { key: "l", header: "آخر نشاط", cell: (m) => (m.stats?.lastActivityAt ? relativeDays(m.stats.lastActivityAt) : "—") },
          ]}
          onRowClick={(m) => router.push(`/team/${m.id}`)}
          actions={(m) =>
            m.role === "doctor" ? (
              m.status === "disabled" ? (
                <Button size="sm" variant="outline" onClick={() => toggle(m, false)}><CheckCircle2 className="h-4 w-4" aria-hidden />تفعيل</Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => toggle(m, true)}><Ban className="h-4 w-4" aria-hidden />إيقاف</Button>
              )
            ) : null
          }
        />
      )}

      {pending.length > 0 && (
        <section className="card p-4">
          <h2 className="mb-3 font-bold text-primary">دعوات بانتظار القبول</h2>
          <ul className="divide-y divide-line">
            {pending.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                <span className="min-w-0">
                  <b className="text-ink">{i.fullName}</b> <span dir="ltr" className="text-muted">{i.email}</span>
                  <span className="block text-xs text-muted">تنتهي {formatDate(i.expiresAt)}</span>
                </span>
                <Button size="sm" variant="ghost" onClick={() => revoke(i.id)} aria-label="إلغاء الدعوة"><Trash2 className="h-4 w-4 text-danger" aria-hidden /></Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Modal open={inviteOpen} onClose={closeInvite} title="دعوة دكتور إلى العيادة" size="sm">
        {link ? (
          <div className="space-y-3">
            <p className="text-sm leading-7 text-ink">
              أرسل هذا الرابط للدكتور (يعمل مرة واحدة لمدة 7 أيام). <b>لن يظهر مرة أخرى</b>، وإن ضاع ألغِ الدعوة وأنشئ غيرها.
            </p>
            <input readOnly value={link} dir="ltr" onFocus={(e) => e.currentTarget.select()} className="h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm" aria-label="رابط الدعوة" />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => navigator.clipboard.writeText(link).then(() => show("success", "تم نسخ الرابط."))}>
                <Copy className="h-4 w-4" aria-hidden />نسخ
              </Button>
              <a href={waLink(`دعوة للانضمام إلى العيادة على PhysioHub: ${link}`)} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-xl border border-line px-4 text-sm font-semibold text-primary">
                واتساب
              </a>
              <Button variant="ghost" onClick={closeInvite}>إغلاق</Button>
            </div>
            <p className="text-xs text-muted">لا يُرسل البريد تلقائيًا من المنصة؛ شارك الرابط بنفسك.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <TextInput label="اسم الدكتور" required value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
            <TextInput label="البريد الإلكتروني" type="email" required dir="ltr" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} hint="يجب أن يسجل الدكتور بنفس هذا البريد." />
            <TextInput label="التخصص (اختياري)" value={form.specialty} onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))} />
            <Button type="submit" className="w-full" loading={busy}>إنشاء رابط الدعوة</Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
