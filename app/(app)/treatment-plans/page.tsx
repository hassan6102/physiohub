"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClipboardList, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState, ListSkeleton, LoadMore } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { usePaged } from "@/hooks/use-paged";
import { PLAN_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/utils/date";
import { plansQuery } from "@/services/plans.service";
import type { PlanStatus, TreatmentPlan } from "@/types/models";

export default function PlansPage() {
  const router = useRouter();
  const [tab, setTab] = useState<PlanStatus | "all">("all");
  const { items, loading, error, hasMore, loadingMore, loadMore, reload } = usePaged<TreatmentPlan>({ build: plansQuery, pageSize: 20, deps: [] });
  const rows = items.filter((p) => tab === "all" || p.status === tab);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="البرامج العلاجية"
        breadcrumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "البرامج العلاجية" }]}
        actions={<Button onClick={() => router.push("/treatment-plans/new")}><Plus className="h-4 w-4" aria-hidden />برنامج جديد</Button>}
      />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "all", label: "الكل" }, { value: "draft", label: "مسودات" }, { value: "published", label: "منشورة" }, { value: "archived", label: "مؤرشفة" }]} />
      <div className="mt-4">
        {loading ? <ListSkeleton /> : error ? <ErrorState message={error} onRetry={reload} /> : rows.length === 0 ? (
          <EmptyState icon={ClipboardList} title="لا توجد برامج" description="أنشئ برنامجًا علاجيًا من تمارين مكتبتك وشاركه مع المريض برابط آمن."
            action={<Link href="/treatment-plans/new"><Button><Plus className="h-4 w-4" aria-hidden />برنامج جديد</Button></Link>} />
        ) : (
          <>
            <ul className="space-y-3">
              {rows.map((p) => (
                <li key={p.id}>
                  <Link href={`/treatment-plans/${p.id}`} className="card flex flex-wrap items-center gap-3 p-4 transition-shadow hover:shadow-pop">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-ink">{p.title}</p>
                      <p className="truncate text-sm text-muted">{p.patientName} · {p.exercises.length} تمرين · آخر تعديل {formatDate(p.updatedAt)}</p>
                    </div>
                    <Badge tone={PLAN_STATUS[p.status].tone}>{PLAN_STATUS[p.status].label}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
            <LoadMore hasMore={hasMore} loading={loadingMore} onClick={loadMore} />
          </>
        )}
      </div>
    </div>
  );
}
