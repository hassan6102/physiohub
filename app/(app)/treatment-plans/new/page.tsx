"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { PlanBuilder } from "@/components/plans/plan-builder";

function Inner() {
  const patientId = useSearchParams().get("patientId") ?? "";
  return <PlanBuilder initial={patientId ? { patientId } : undefined} />;
}

export default function NewPlanPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="برنامج علاجي جديد" breadcrumbs={[{ label: "البرامج العلاجية", href: "/treatment-plans" }, { label: "جديد" }]} />
      <Suspense fallback={null}>
        <Inner />
      </Suspense>
    </div>
  );
}
