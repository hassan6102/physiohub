"use client";

import { ErrorState } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoad } from "@/hooks/use-load";
import { computeAdherence } from "@/lib/plan-utils";
import { getCompletionsForPlan } from "@/services/plans.service";
import type { TreatmentPlan } from "@/types/models";

export function AdherencePanel({ plan }: { plan: TreatmentPlan }) {
  const { data, loading, error, reload } = useLoad(() => getCompletionsForPlan(plan.id), [plan.id]);
  if (loading) return <Skeleton className="h-32 w-full" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const all = computeAdherence(plan, data ?? []);
  return (
    <section className="card space-y-4 p-5">
      <h2 className="text-lg font-bold text-primary">التزام المريض</h2>
      {!plan.startDate ? (
        <p className="text-sm text-muted">حدّد تاريخ بداية للبرنامج لحساب نسبة الالتزام.</p>
      ) : (
        <>
          <p className="text-3xl font-bold text-secondary">{all.percent ?? 0}%</p>
          <p className="text-sm text-muted">{all.done} من {all.expected} تمرين مخطط له حتى اليوم</p>
          <ul className="space-y-2">
            {plan.exercises.map((e) => {
              const r = computeAdherence({ ...plan, exercises: [e] }, data ?? []);
              return (
                <li key={e.key} className="space-y-1">
                  <div className="flex justify-between text-sm"><span>{e.snapshot.nameAr}</span><span className="text-muted">{r.percent ?? 0}%</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-line"><div className="h-full bg-accent" style={{ width: `${r.percent ?? 0}%` }} /></div>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <p className="text-xs leading-6 text-muted">الأرقام تعتمد على تسجيل المريض بنفسه، ولا تثبت جودة الأداء أو صحة تنفيذ التمرين. المريض الذي لا يفتح الرابط لا يظهر له إنجاز.</p>
    </section>
  );
}
