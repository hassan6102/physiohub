"use client";

import Link from "next/link";
import { Dumbbell, Flag, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoad } from "@/hooks/use-load";
import { getAdminCounts } from "@/services/admin.service";

export default function AdminHome() {
  const { data, loading, error, reload } = useLoad(() => getAdminCounts(), []);
  const cards = [
    { label: "الأطباء المسجلون", value: data?.doctors, icon: Users, href: "/admin/doctors" },
    { label: "التمارين العامة", value: data?.publicExercises, icon: Dumbbell, href: "/admin/exercises" },
    { label: "بلاغات مفتوحة", value: data?.openReports, icon: Flag, href: "/admin/reports" },
  ];
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="لوحة إدارة المنصة" />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {cards.map((c) =>
            loading ? (
              <Skeleton key={c.label} className="h-20" />
            ) : (
              <Link key={c.label} href={c.href} className="card flex items-center gap-3 p-4 hover:shadow-pop">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-50 text-accent-600"><c.icon className="h-5 w-5" aria-hidden /></span>
                <span>
                  <span className="block text-2xl font-bold text-primary">{c.value ?? 0}</span>
                  <span className="text-xs text-muted">{c.label}</span>
                </span>
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}
