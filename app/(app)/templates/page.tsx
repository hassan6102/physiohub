"use client";

import Link from "next/link";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/states";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useLoad } from "@/hooks/use-load";
import { friendlyError } from "@/lib/utils/errors";
import { deleteTemplate, getTemplates } from "@/services/templates.service";

export default function TemplatesPage() {
  const { data, loading, error, reload } = useLoad(() => getTemplates(), []);
  const confirm = useConfirm();
  const { show } = useToast();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="القوالب"
        description="قوالب لتسجيل التقييم والمتابعة، تستخدمها عند إضافة جلسة."
        breadcrumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "القوالب" }]}
        actions={<Link href="/templates/new"><Button><Plus className="h-4 w-4" aria-hidden />قالب جديد</Button></Link>}
      />
      {loading ? <ListSkeleton /> : error ? <ErrorState message={error} onRetry={reload} /> : (data ?? []).length === 0 ? (
        <EmptyState icon={FileText} title="لا توجد قوالب" description="أنشئ قالبك الأول." />
      ) : (
        <ul className="space-y-3">
          {data!.map((t) => (
            <li key={t.id} className="card flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-ink">{t.name} {t.isDefault && <Badge tone="info">افتراضي</Badge>}</p>
                <p className="text-sm text-muted">{t.fields.length} حقل{t.description ? ` · ${t.description}` : ""}</p>
              </div>
              <Link href={`/templates/${t.id}`}><Button size="sm" variant="outline"><Pencil className="h-4 w-4" aria-hidden />تعديل</Button></Link>
              <Button size="sm" variant="ghost" className="text-danger" aria-label="حذف"
                onClick={async () => {
                  if (!(await confirm({ title: "حذف القالب", message: "السجلات القديمة المبنية عليه تحتفظ بنسختها.", confirmLabel: "حذف", danger: true }))) return;
                  try { await deleteTemplate(t.id); show("success", "تم الحذف."); reload(); } catch (e) { show("error", friendlyError(e)); }
                }}>
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
