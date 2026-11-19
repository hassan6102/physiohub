"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Copy, Pencil, Send, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState, ListSkeleton } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { AdherencePanel } from "@/components/plans/adherence-panel";
import { PlanBuilder } from "@/components/plans/plan-builder";
import { PlanView } from "@/components/plans/plan-view";
import { SharePanel } from "@/components/plans/share-panel";
import { useLoad } from "@/hooks/use-load";
import { PLAN_STATUS } from "@/lib/constants";
import { toPortalPlan } from "@/lib/plan-utils";
import { friendlyError } from "@/lib/utils/errors";
import { deleteDraftPlan, duplicatePlan, getPlan, setPlanStatus } from "@/services/plans.service";
import type { PlanStatus } from "@/types/models";

type Tab = "view" | "share" | "adherence";

export default function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const confirm = useConfirm();
  const { show } = useToast();
  const { data: plan, loading, error, reload } = useLoad(() => getPlan(id), [id]);
  const [tab, setTab] = useState<Tab>("view");
  const [editing, setEditing] = useState(false);

  if (loading) return <ListSkeleton rows={3} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!plan) return <ErrorState message="البرنامج غير موجود." />;

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      show("success", ok);
      reload();
    } catch (e) {
      show("error", friendlyError(e));
    }
  };
  const status = (s: PlanStatus, ok: string) => run(() => setPlanStatus(plan, s), ok);

  if (editing)
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="تعديل البرنامج" breadcrumbs={[{ label: "البرامج العلاجية", href: "/treatment-plans" }, { label: plan.title }]} />
        <p className="mb-4 rounded-xl bg-warning/10 p-3 text-sm">الروابط المشتركة تعرض النسخة المنشورة الحالية، فالتعديل سيظهر للمريض فور الحفظ إن كان البرنامج منشورًا.</p>
        <PlanBuilder planId={plan.id} lockPatient initial={plan} />
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={plan.title}
        description={`المريض: ${plan.patientName}`}
        breadcrumbs={[{ label: "البرامج العلاجية", href: "/treatment-plans" }, { label: plan.title }]}
        actions={
          <>
            <Badge tone={PLAN_STATUS[plan.status].tone}>{PLAN_STATUS[plan.status].label}</Badge>
            <Button variant="outline" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" aria-hidden />تعديل</Button>
            {plan.status === "draft" && <Button onClick={() => status("published", "تم نشر البرنامج.")}><Send className="h-4 w-4" aria-hidden />نشر</Button>}
            <Button variant="outline" onClick={async () => { try { const n = await duplicatePlan(plan); router.push(`/treatment-plans/${n}`); } catch (e) { show("error", friendlyError(e)); } }}>
              <Copy className="h-4 w-4" aria-hidden />نسخ
            </Button>
            {plan.status !== "archived" && (
              <Button variant="outline" onClick={async () => { if (await confirm({ title: "أرشفة البرنامج", message: "ستتوقف الروابط عن العمل لأن البرنامج لن يكون منشورًا.", confirmLabel: "أرشفة" })) status("archived", "تمت الأرشفة."); }}>
                <Archive className="h-4 w-4" aria-hidden />أرشفة
              </Button>
            )}
            {plan.status === "draft" && (
              <Button variant="danger" onClick={async () => { if (await confirm({ title: "حذف المسودة", message: "سيتم حذف المسودة نهائيًا.", confirmLabel: "حذف", danger: true })) { try { await deleteDraftPlan(plan.id); router.push("/treatment-plans"); } catch (e) { show("error", friendlyError(e)); } } }}>
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            )}
          </>
        }
      />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "view", label: "البرنامج" }, { value: "share", label: "المشاركة" }, { value: "adherence", label: "الالتزام" }]} />
      <div className="mt-4">
        {tab === "view" && <PlanView plan={toPortalPlan(plan)} />}
        {tab === "share" && <SharePanel plan={plan} />}
        {tab === "adherence" && <AdherencePanel plan={plan} />}
      </div>
    </div>
  );
}
