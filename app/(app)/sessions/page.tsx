"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Plus, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { ResponsiveTable, type Column } from "@/components/ui/responsive-table";
import { EmptyState, ErrorState, ListSkeleton, LoadMore } from "@/components/ui/states";
import { usePaged } from "@/hooks/use-paged";
import { ATTENDANCE } from "@/lib/constants";
import { formatDate, formatTime } from "@/lib/utils/date";
import { matchesQuery } from "@/lib/utils/misc";
import { allSessionsQuery } from "@/services/sessions.service";
import type { Attendance, Session } from "@/types/models";

export default function SessionsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [attendance, setAttendance] = useState<Attendance | "all">("all");
  const { items, loading, loadingMore, hasMore, error, loadMore, reload } = usePaged<Session>({
    build: allSessionsQuery,
    pageSize: 25,
    deps: [],
  });

  // Filters apply to the pages loaded so far; "عرض المزيد" loads older sessions.
  const rows = useMemo(
    () =>
      items
        .filter((s) => !s.deletedAt)
        .filter((s) => attendance === "all" || s.attendance === attendance)
        .filter((s) => matchesQuery(search, s.patientName, s.symptoms, s.assessment)),
    [items, search, attendance]
  );

  const columns: Column<Session>[] = [
    { key: "patient", header: "المريض", primary: true, cell: (s) => <span className="font-semibold">{s.patientName}</span> },
    { key: "date", header: "التاريخ", cell: (s) => formatDate(s.date) },
    { key: "time", header: "الوقت", cell: (s) => `${formatTime(s.date)} · ${s.durationMin} د` },
    { key: "pain", header: "الألم", cell: (s) => (s.painArrival === null ? "—" : `${s.painArrival}/10`) },
    { key: "att", header: "الحضور", cell: (s) => <Badge tone={ATTENDANCE[s.attendance].tone}>{ATTENDANCE[s.attendance].label}</Badge> },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="الجلسات"
        breadcrumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "الجلسات" }]}
        actions={
          <Button onClick={() => router.push("/sessions/new")}>
            <Plus className="h-4 w-4" aria-hidden />
            تسجيل جلسة
          </Button>
        }
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث باسم المريض أو الأعراض"
          aria-label="بحث"
          className="h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-base focus:border-secondary focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <Select
          aria-label="الحضور"
          value={attendance}
          onChange={(e) => setAttendance(e.target.value as Attendance | "all")}
          options={[
            { value: "all", label: "كل الحالات" },
            ...(Object.keys(ATTENDANCE) as Attendance[]).map((k) => ({ value: k, label: ATTENDANCE[k].label })),
          ]}
        />
      </div>

      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="لا توجد جلسات"
          description="سجّل أول جلسة من ملف المريض أو من الزر أعلاه."
        />
      ) : (
        <>
          <ResponsiveTable rows={rows} columns={columns} onRowClick={(s) => router.push(`/sessions/${s.id}`)} />
          <LoadMore hasMore={hasMore} loading={loadingMore} onClick={loadMore} />
        </>
      )}
    </div>
  );
}
