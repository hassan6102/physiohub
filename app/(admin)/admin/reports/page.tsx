"use client";

import { Check, Flag, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useLoad } from "@/hooks/use-load";
import { formatDate } from "@/lib/utils/date";
import { friendlyError } from "@/lib/utils/errors";
import { listReports, setReportStatus } from "@/services/admin.service";

export default function AdminReports() {
  const { data, loading, error, reload } = useLoad(() => listReports(), []);
  const { show } = useToast();
  const set = async (id: string, s: "open" | "resolved") => {
    try {
      await setReportStatus(id, s);
      reload();
    } catch (e) {
      show("error", friendlyError(e));
    }
  };
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="بلاغات التمارين" />
      {loading ? <ListSkeleton /> : error ? <ErrorState message={error} onRetry={reload} /> : (data ?? []).length === 0 ? (
        <EmptyState icon={Flag} title="لا توجد بلاغات" />
      ) : (
        <ul className="space-y-3">
          {(data ?? []).map((r) => (
            <li key={r.id} className="card flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-bold text-ink">{r.exerciseName}</p>
                <p className="mt-1 whitespace-pre-line text-sm leading-7 text-ink">{r.reason}</p>
                <p className="mt-1 text-xs text-muted">{r.doctorName || "طبيب"} · {formatDate(r.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={r.status === "open" ? "warning" : "success"}>{r.status === "open" ? "مفتوح" : "تمت المعالجة"}</Badge>
                {r.status === "open" ? (
                  <Button size="sm" variant="outline" onClick={() => set(r.id, "resolved")}><Check className="h-4 w-4" aria-hidden />تمت المعالجة</Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => set(r.id, "open")}><RotateCcw className="h-4 w-4" aria-hidden />إعادة فتح</Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
