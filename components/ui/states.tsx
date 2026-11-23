import { AlertTriangle, type LucideIcon } from "lucide-react";
import { Button } from "./button";
import { Skeleton } from "./skeleton";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card grid place-items-center gap-3 px-6 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-50 text-accent-600">
        <Icon className="h-7 w-7" aria-hidden />
      </span>
      <p className="text-base font-bold text-ink">{title}</p>
      {description && <p className="max-w-md text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card grid place-items-center gap-3 px-6 py-10 text-center" role="alert">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-danger/10 text-danger">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </span>
      <p className="text-sm text-ink">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card divide-y divide-line">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoadMore({ hasMore, loading, onClick }: { hasMore: boolean; loading: boolean; onClick: () => void }) {
  if (!hasMore) return null;
  return (
    <div className="flex justify-center pt-4">
      <Button variant="outline" onClick={onClick} loading={loading}>
        عرض المزيد
      </Button>
    </div>
  );
}
