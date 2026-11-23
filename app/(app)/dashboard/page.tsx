"use client";

import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus,
  ClipboardList,
  Dumbbell,
  Megaphone,
  Stethoscope,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoad } from "@/hooks/use-load";
import { getDoctorStats, getTeam } from "@/services/team.service";
import { useAuth } from "@/lib/auth/auth-provider";
import { APPOINTMENT_STATUS } from "@/lib/constants";
import { formatTime, relativeDays } from "@/lib/utils/date";
import { getRecentActivities } from "@/services/activity.service";
import { getPlatformSettings } from "@/services/admin.service";
import { FOLLOW_UP_DAYS, getDashboard } from "@/services/dashboard.service";

function Stat({ icon: Icon, label, value, href }: { icon: LucideIcon; label: string; value: number; href: string }) {
  return (
    <Link href={href} className="card flex items-center gap-3 p-4 transition-shadow hover:shadow-pop">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-50 text-accent-600">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-2xl font-bold text-primary">{value}</span>
        <span className="block truncate text-xs text-muted">{label}</span>
      </span>
    </Link>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-bold text-primary">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function TeamSummary() {
  const rows = useLoad(async () => {
    const team = (await getTeam()).filter((m) => m.role === "doctor" || m.practicing);
    return Promise.all(team.map(async (m) => ({ m, s: await getDoctorStats(m.id) })));
  }, []);
  return (
    <Section title="توزيع الحالات على الدكاترة" action={<Link href="/team" className="text-sm font-semibold text-secondary">إدارة الدكاترة</Link>}>
      {rows.loading ? <Skeleton className="h-24" /> : rows.error ? <ErrorState message={rows.error} onRetry={rows.reload} /> : (rows.data ?? []).length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">لم تضف دكاترة بعد. ادعُ دكتورًا من «إدارة الدكاترة».</p>
      ) : (
        <ul className="divide-y divide-line">
          {(rows.data ?? []).map(({ m, s }) => (
            <li key={m.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
              <Link href={`/team/${m.id}`} className="truncate font-semibold text-ink hover:text-secondary">{m.fullName}</Link>
              <span className="shrink-0 text-xs text-muted">{s.patients} مريض · {s.activePatients} نشط · {s.appointments} موعد</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

const none = (t: string) => <p className="py-6 text-center text-sm text-muted">{t}</p>;

const quick = [
  { href: "/patients/new", label: "إضافة مريض", icon: UserPlus },
  { href: "/sessions/new", label: "تسجيل جلسة", icon: Stethoscope },
  { href: "/exercises/new", label: "إضافة تمرين", icon: Dumbbell },
  { href: "/treatment-plans/new", label: "إنشاء برنامج", icon: ClipboardList },
  { href: "/appointments", label: "إضافة موعد", icon: CalendarPlus },
];

export default function DashboardPage() {
  const { user, role, clinic } = useAuth();
  const isManager = role === "manager";
  const dash = useLoad(() => getDashboard(), []);
  const acts = useLoad(() => getRecentActivities(8), []);
  // The announcement is optional; a failure to read it must never break the dashboard.
  const settings = useLoad(() => getPlatformSettings().catch(() => null), []);
  const d = dash.data;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">مرحبًا{user?.displayName ? `، ${user.displayName}` : ""}</h1>
        <p className="text-sm text-muted">{isManager ? `نظرة على ${clinic?.name ?? "العيادة"}: كل مرضى العيادة والدكاترة.` : `${clinic?.name ?? "العيادة"} — مرضاك ومواعيدك اليوم.`}</p>
      </div>

      {settings.data?.announcement && (
        <div className="flex items-start gap-3 rounded-2xl border border-accent bg-accent-50 p-4 text-sm" role="note">
          <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" aria-hidden />
          <p className="whitespace-pre-line leading-7 text-ink">{settings.data.announcement}</p>
        </div>
      )}

      {role === "doctor" && clinic && (
        <div className="card flex flex-wrap items-center gap-x-6 gap-y-1 p-4 text-sm">
          <span className="font-bold text-primary">{clinic.name}</span>
          {clinic.phone && <span dir="ltr" className="text-muted">{clinic.phone}</span>}
          {clinic.address && <span className="text-muted">{clinic.address}</span>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {quick.map((q) => (
          <Link key={q.href} href={q.href} className="flex min-h-12 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-primary hover:bg-canvas">
            <q.icon className="h-5 w-5 text-secondary" aria-hidden />
            {q.label}
          </Link>
        ))}
      </div>

      {dash.error ? (
        <ErrorState message={dash.error} onRetry={dash.reload} />
      ) : dash.loading || !d ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            <Stat icon={Users} label="إجمالي المرضى" value={d.totalPatients} href="/patients" />
            <Stat icon={Users} label="المرضى النشطون" value={d.activePatients} href="/patients" />
            <Stat icon={UserPlus} label="جدد آخر 30 يومًا" value={d.newPatients} href="/patients" />
            <Stat icon={Stethoscope} label="جلسات اليوم" value={d.sessionsToday} href="/sessions" />
            <Stat icon={CalendarDays} label="مواعيد قادمة" value={d.upcomingAppointments} href="/appointments" />
            <Stat icon={ClipboardList} label="برامج منشورة" value={d.publishedPlans} href="/treatment-plans" />
            <Stat icon={Users} label={`يحتاجون متابعة (${FOLLOW_UP_DAYS} يومًا)`} value={d.followUpCount} href="/patients" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {isManager && <TeamSummary />}
            <Section title="جدول اليوم" action={<Link href="/appointments" className="text-sm font-semibold text-secondary">كل المواعيد</Link>}>
              {d.todaySchedule.length === 0 ? (
                none("لا توجد مواعيد اليوم.")
              ) : (
                <ul className="divide-y divide-line">
                  {d.todaySchedule.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2 py-2.5">
                      <div className="min-w-0">
                        <Link href={`/patients/${a.patientId}`} className="block truncate font-semibold text-ink hover:text-secondary">{a.patientName}</Link>
                        <span className="text-xs text-muted" dir="ltr">{formatTime(a.startsAt)}</span>
                      </div>
                      <Badge tone={APPOINTMENT_STATUS[a.status].tone}>{APPOINTMENT_STATUS[a.status].label}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="أحدث المرضى" action={<Link href="/patients" className="text-sm font-semibold text-secondary">عرض الكل</Link>}>
              {d.recentPatients.length === 0 ? (
                none("لم تضف مرضى بعد.")
              ) : (
                <ul className="divide-y divide-line">
                  {d.recentPatients.map((p) => (
                    <li key={p.id} className="py-2.5">
                      <Link href={`/patients/${p.id}`} className="block truncate font-semibold text-ink hover:text-secondary">{p.fullName}</Link>
                      <span className="text-xs text-muted">{p.chiefComplaint || "—"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="مرضى بحاجة إلى متابعة">
              {d.followUp.length === 0 ? (
                none(`لا يوجد مرضى نشطون بدون نشاط منذ ${FOLLOW_UP_DAYS} يومًا.`)
              ) : (
                <ul className="divide-y divide-line">
                  {d.followUp.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2 py-2.5">
                      <Link href={`/patients/${p.id}`} className="truncate font-semibold text-ink hover:text-secondary">{p.fullName}</Link>
                      <span className="shrink-0 text-xs text-warning">{relativeDays(p.lastActivityAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="آخر الأنشطة">
              {acts.loading ? (
                <Skeleton className="h-24" />
              ) : acts.error ? (
                none("تعذر تحميل الأنشطة.")
              ) : (acts.data ?? []).length === 0 ? (
                none("لا توجد أنشطة بعد.")
              ) : (
                <ul className="divide-y divide-line">
                  {(acts.data ?? []).map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                      <span className="text-ink">{a.message}</span>
                      <span className="shrink-0 text-xs text-muted">{relativeDays(a.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        </>
      )}
    </div>
  );
}
