"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Archive, ClipboardList, Eye, Pencil, Plus, RotateCcw, Search, Stethoscope, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { RowMenu } from "@/components/ui/menu";
import { PageHeader } from "@/components/ui/page-header";
import { ResponsiveTable, type Column } from "@/components/ui/responsive-table";
import { EmptyState, ErrorState, ListSkeleton, LoadMore } from "@/components/ui/states";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { PatientStatusBadge } from "@/components/patients/patient-status-badge";
import { useLoad } from "@/hooks/use-load";
import { usePaged } from "@/hooks/use-paged";
import { ageFromBirth, formatDate } from "@/lib/utils/date";
import { friendlyError } from "@/lib/utils/errors";
import { matchesQuery } from "@/lib/utils/misc";
import { archivePatient, loadPatientsForSearch, patientsQuery, restorePatient } from "@/services/patients.service";
import type { Patient, PatientStatus } from "@/types/models";

type StatusFilter = PatientStatus | "all";
type Sort = "createdAt" | "lastActivityAt";

export default function PatientsPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const { show } = useToast();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<Sort>("createdAt");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const searching = debounced.length > 0;

  // Browsing mode: server-side filter + sort + pagination.
  const paged = usePaged<Patient>({
    build: () => patientsQuery({ status, sort }),
    pageSize: 20,
    deps: [status, sort],
    enabled: !searching,
  });

  // Search mode: loads up to 300 patients once, then filters in the browser (name, phone, diagnosis).
  const all = useLoad(() => loadPatientsForSearch(), [], searching);

  const searchResults = useMemo(() => {
    if (!searching || !all.data) return [];
    return all.data
      .filter((p) => (status === "all" ? p.status !== "archived" : p.status === status))
      .filter((p) => matchesQuery(debounced, p.fullName, p.phone, p.diagnosis, p.chiefComplaint))
      .sort((a, b) => b[sort].getTime() - a[sort].getTime());
  }, [searching, all.data, debounced, status, sort]);

  const rows = searching ? searchResults : paged.items;
  const loading = searching ? all.loading : paged.loading;
  const error = searching ? all.error : paged.error;

  const onArchive = async (p: Patient) => {
    const ok = await confirm({
      title: "أرشفة المريض",
      message: `سيتم نقل ${p.fullName} إلى الأرشيف. تبقى كل بياناته وجلساته محفوظة ويمكنك استعادته في أي وقت.`,
      confirmLabel: "أرشفة",
      danger: true,
    });
    if (!ok) return;
    try {
      await archivePatient(p);
      show("success", "تمت أرشفة المريض.");
      searching ? all.reload() : paged.reload();
    } catch (e) {
      show("error", friendlyError(e));
    }
  };

  const onRestore = async (p: Patient) => {
    try {
      await restorePatient(p);
      show("success", "تمت استعادة المريض.");
      searching ? all.reload() : paged.reload();
    } catch (e) {
      show("error", friendlyError(e));
    }
  };

  const columns: Column<Patient>[] = [
    {
      key: "name",
      header: "الاسم",
      primary: true,
      cell: (p) => (
        <div>
          <p className="font-semibold text-ink">{p.fullName}</p>
          {p.diagnosis && <p className="max-w-xs truncate text-xs text-muted">{p.diagnosis}</p>}
        </div>
      ),
    },
    { key: "phone", header: "الهاتف", cell: (p) => <span dir="ltr">{p.phone}</span> },
    { key: "age", header: "العمر", cell: (p) => ageFromBirth(p.birthDate) ?? "—" },
    { key: "gender", header: "الجنس", cell: (p) => (p.gender === "female" ? "أنثى" : "ذكر") },
    { key: "created", header: "تاريخ التسجيل", cell: (p) => formatDate(p.createdAt) },
    { key: "last", header: "آخر جلسة", cell: (p) => formatDate(p.lastVisitAt) },
    { key: "status", header: "الحالة", cell: (p) => <PatientStatusBadge status={p.status} /> },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="المرضى"
        breadcrumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "المرضى" }]}
        actions={
          <Button onClick={() => router.push("/patients/new")}>
            <Plus className="h-4 w-4" aria-hidden />
            إضافة مريض
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو رقم الهاتف أو التشخيص"
            aria-label="بحث"
            className="h-11 w-full rounded-xl border border-line bg-surface ps-10 pe-3 text-base focus:border-secondary focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <Select
          aria-label="الحالة"
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          options={[
            { value: "all", label: "كل الحالات" },
            { value: "active", label: "نشط" },
            { value: "paused", label: "متوقف مؤقتًا" },
            { value: "completed", label: "مكتمل" },
            { value: "inactive", label: "غير نشط" },
            { value: "archived", label: "المؤرشفون" },
          ]}
        />
        <Select
          aria-label="الترتيب"
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          options={[
            { value: "createdAt", label: "الأحدث تسجيلًا" },
            { value: "lastActivityAt", label: "آخر زيارة" },
          ]}
        />
      </div>

      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={() => (searching ? all.reload() : paged.reload())} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title={searching ? "لا توجد نتائج مطابقة" : "لا يوجد مرضى بعد"}
          description={searching ? "جرّب كلمة بحث مختلفة أو غيّر الفلتر." : "ابدأ بإضافة أول مريض لتسجيل جلساته وبرامجه العلاجية."}
          action={
            !searching && (
              <Button onClick={() => router.push("/patients/new")}>
                <Plus className="h-4 w-4" aria-hidden />
                إضافة مريض
              </Button>
            )
          }
        />
      ) : (
        <>
          <ResponsiveTable
            rows={rows}
            columns={columns}
            onRowClick={(p) => router.push(`/patients/${p.id}`)}
            actions={(p) => (
              <RowMenu
                items={[
                  { label: "فتح الملف", icon: Eye, onClick: () => router.push(`/patients/${p.id}`) },
                  { label: "تسجيل جلسة", icon: Stethoscope, onClick: () => router.push(`/sessions/new?patientId=${p.id}`), hidden: p.status === "archived" },
                  { label: "برنامج علاجي", icon: ClipboardList, onClick: () => router.push(`/treatment-plans/new?patientId=${p.id}`), hidden: p.status === "archived" },
                  { label: "تعديل", icon: Pencil, onClick: () => router.push(`/patients/${p.id}/edit`) },
                  { label: "أرشفة", icon: Archive, danger: true, onClick: () => onArchive(p), hidden: p.status === "archived" },
                  { label: "استعادة", icon: RotateCcw, onClick: () => onRestore(p), hidden: p.status !== "archived" },
                ]}
              />
            )}
          />
          {!searching && <LoadMore hasMore={paged.hasMore} loading={paged.loadingMore} onClick={paged.loadMore} />}
          {searching && all.data && all.data.length >= 300 && (
            <p className="mt-3 text-center text-xs text-muted">البحث يشمل آخر 300 مريض مسجل.</p>
          )}
        </>
      )}
    </div>
  );
}
