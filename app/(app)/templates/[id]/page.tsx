"use client";

import { use } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState, ListSkeleton } from "@/components/ui/states";
import { TemplateEditor } from "@/components/templates/template-editor";
import { useLoad } from "@/hooks/use-load";
import { getTemplate } from "@/services/templates.service";

export default function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, loading, error, reload } = useLoad(() => getTemplate(id), [id]);
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="تعديل القالب" breadcrumbs={[{ label: "القوالب", href: "/templates" }, { label: data?.name ?? "..." }]} />
      {loading ? <ListSkeleton rows={3} /> : error ? <ErrorState message={error} onRetry={reload} /> : !data ? <ErrorState message="القالب غير موجود." /> : <TemplateEditor template={data} />}
    </div>
  );
}
