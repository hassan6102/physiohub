"use client";

import Link from "next/link";
import { Plus, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, ListSkeleton, LoadMore } from "@/components/ui/states";
import { SessionTimeline } from "@/components/sessions/session-timeline";
import { usePaged } from "@/hooks/use-paged";
import { sessionsForPatientQuery } from "@/services/sessions.service";
import type { Session } from "@/types/models";

export function SessionsTab({ patientId, archived }: { patientId: string; archived: boolean }) {
  const { items, loading, loadingMore, hasMore, error, loadMore, reload } = usePaged<Session>({
    build: () => sessionsForPatientQuery(patientId),
    pageSize: 15,
    deps: [patientId],
  });

  return (
    <div className="space-y-4">
      {!archived && (
        <div className="flex justify-end">
          <Link href={`/sessions/new?patientId=${patientId}`}>
            <Button>
              <Plus className="h-4 w-4" aria-hidden />
              تسجيل جلسة
            </Button>
          </Link>
        </div>
      )}
      {loading ? (
        <ListSkeleton rows={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState icon={Stethoscope} title="لا توجد جلسات بعد" description="ستظهر هنا جميع الجلسات مرتبة من الأحدث إلى الأقدم." />
      ) : (
        <>
          <SessionTimeline sessions={items} />
          <LoadMore hasMore={hasMore} loading={loadingMore} onClick={loadMore} />
        </>
      )}
    </div>
  );
}
