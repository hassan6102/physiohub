"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState, ListSkeleton } from "@/components/ui/states";
import { CategoryManager } from "@/components/exercises/category-manager";
import { useLoad } from "@/hooks/use-load";
import { getCategories } from "@/services/categories.service";

export default function AdminCategories() {
  const [open, setOpen] = useState(false);
  const cats = useLoad(() => getCategories("public", true), []);
  const list = cats.data ?? [];
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="تصنيفات المكتبة العامة" description="تغيير اسم تصنيف لا يحدّث التمارين القديمة التي تحمل الاسم السابق." actions={<Button onClick={() => setOpen(true)}><Settings2 className="h-4 w-4" aria-hidden />إدارة التصنيفات</Button>} />
      {cats.loading ? <ListSkeleton rows={3} /> : cats.error ? <ErrorState message={cats.error} onRetry={cats.reload} /> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(["bodyPart", "subcategory"] as const).map((k) => (
            <section key={k} className="card p-4">
              <h2 className="mb-3 font-bold text-primary">{k === "bodyPart" ? "الأجزاء" : "التصنيفات الفرعية"}</h2>
              <div className="flex flex-wrap gap-2">
                {list.filter((c) => c.kind === k).map((c) => <Badge key={c.id} tone="info">{c.name}</Badge>)}
              </div>
            </section>
          ))}
        </div>
      )}
      <CategoryManager open={open} onClose={() => setOpen(false)} scope="public" onChanged={cats.reload} />
    </div>
  );
}
