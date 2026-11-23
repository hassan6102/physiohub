import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 space-y-3 print:mb-3">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="مسار التنقل" className="print:hidden">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
            {breadcrumbs.map((b, i) => (
              <li key={i} className="flex items-center gap-1">
                {b.href ? (
                  <Link href={b.href} className="hover:text-primary">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-ink">{b.label}</span>
                )}
                {i < breadcrumbs.length - 1 && <ChevronLeft className="h-4 w-4" aria-hidden />}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-primary">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 print:hidden">{actions}</div>}
      </div>
    </div>
  );
}
