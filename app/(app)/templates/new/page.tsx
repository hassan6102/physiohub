"use client";

import { PageHeader } from "@/components/ui/page-header";
import { TemplateEditor } from "@/components/templates/template-editor";

export default function NewTemplatePage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="قالب جديد" breadcrumbs={[{ label: "القوالب", href: "/templates" }, { label: "جديد" }]} />
      <TemplateEditor />
    </div>
  );
}
