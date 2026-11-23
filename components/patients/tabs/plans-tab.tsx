"use client";

import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, ListSkeleton, LoadMore } from "@/components/ui/states";
import { usePaged } from "@/hooks/use-paged";
import { PLAN_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/utils/date";
import { plansForPatientQuery } from "@/services/plans.service";
import type { TreatmentPlan } from "@/types/models";

export function PlansTab({ patientId, archived }: { patientId: string; archived: boolean }) {
  const { items, loading, loadingMore, hasMore, error, loadMore, reload } = usePaged<TreatmentPlan>({
    build: () => plansForPatientQuery(patientId),
    pageSize: 10,
    deps: [patientId],
  });

  return (
    <div className="space-y-4">
      {!archived && (
        <div className="flex justify-end">
          <Link href={`/treatment-plans/new?patientId=${patientId}`}>
            <Button>
              <Plus className="h-4 w-4" aria-hidden />
              برنامج جديد
            </Button>
          </Link>
        </div>
      )}
      {loading ? (
        <ListSkeleton rows={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState icon={ClipboardList} title="لا توجد برامج علاجية" description="أنشئ برنامجًا من تمارين مكتبتك وشاركه مع المريض برابط." />
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((p) => (
              <li key={p.id}>
                <Link href={`/treatment-plans/${p.id}`} className="card flex flex-wrap items-center justify-between gap-3 p-4 hover:border-secondary">
                  <div className="min-w-0">
                    <p className="font-bold text-ink">{p.title}</p>
                    <p className="text-sm text-muted">
                      {p.exercises.length} تمارين · من {formatDate(p.startDate)} إلى {formatDate(p.endDate)}
                    </p>
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
  );
}
