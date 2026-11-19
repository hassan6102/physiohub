"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Copy, Download, Dumbbell, Flag, Heart, Pencil, Plus, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { RowMenu } from "@/components/ui/menu";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState, ListSkeleton, LoadMore } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/form";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { CategoryManager } from "@/components/exercises/category-manager";
import { ExerciseCard } from "@/components/exercises/exercise-card";
import { ExerciseDetail } from "@/components/exercises/exercise-detail";
import { useLoad } from "@/hooks/use-load";
import { usePaged } from "@/hooks/use-paged";
import { useAuth } from "@/lib/auth/auth-provider";
import { friendlyError } from "@/lib/utils/errors";
import { matchesQuery } from "@/lib/utils/misc";
import { createExerciseReport } from "@/services/admin.service";
import { getCategories } from "@/services/categories.service";
import {
  deleteExercise,
  duplicateExercise,
  getMyExercises,
  importPublicExercise,
  publicExercisesQuery,
  setFavorite,
} from "@/services/exercises.service";
import type { Exercise } from "@/types/models";

type Tab = "mine" | "public";
type Sort = "updated" | "recent";

export default function ExercisesPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const { show } = useToast();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("mine");
  const [search, setSearch] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [sub, setSub] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("updated");
  const [detail, setDetail] = useState<Exercise | null>(null);
  const [managing, setManaging] = useState(false);
  const [reporting, setReporting] = useState<Exercise | null>(null);
  const [reason, setReason] = useState("");

  const cats = useLoad(() => getCategories("doctor"), []);
  // The public library keeps its own category list; names are shared strings, so filters use the doctor's lists.
  const mine = useLoad(() => getMyExercises(), [], tab === "mine");
  const pub = usePaged<Exercise>({ build: publicExercisesQuery, pageSize: 24, deps: [], enabled: tab === "public" });

  const source = tab === "mine" ? mine.data ?? [] : pub.items;
  const rows = useMemo(() => {
    const list = source
      .filter((e) => !bodyPart || e.bodyPart === bodyPart)
      .filter((e) => !sub || e.subcategory === sub)
      .filter((e) => tab !== "mine" || !favOnly || e.favorite)
      .filter((e) => matchesQuery(search, e.nameAr, e.nameEn, e.description, e.muscles.join(" ")));
    if (tab === "mine" && sort === "recent")
      return list.filter((e) => e.lastUsedAt).sort((a, b) => b.lastUsedAt!.getTime() - a.lastUsedAt!.getTime());
    return list;
  }, [source, bodyPart, sub, favOnly, search, sort, tab]);

  const loading = tab === "mine" ? mine.loading : pub.loading;
  const error = tab === "mine" ? mine.error : pub.error;
  const reload = () => (tab === "mine" ? mine.reload() : pub.reload());

  const categories = cats.data ?? [];

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      show("success", ok);
      mine.reload();
    } catch (e) {
      show("error", friendlyError(e));
    }
  };

  const toggleFav = (e: Exercise) =>
    act(async () => {
      await setFavorite(e.id, !e.favorite);
    }, e.favorite ? "تمت الإزالة من المفضلة." : "تمت الإضافة إلى المفضلة.");

  const remove = async (e: Exercise) => {
    const ok = await confirm({
      title: "حذف التمرين",
      message: `سيتم حذف «${e.nameAr}» من مكتبتك. البرامج العلاجية التي تستخدمه تحتفظ بنسختها ولا تتأثر.`,
      confirmLabel: "حذف",
      danger: true,
    });
    if (ok) {
      setDetail(null);
      await act(() => deleteExercise(e.id), "تم حذف التمرين.");
    }
  };

  const importOne = async (e: Exercise) => {
    try {
      await importPublicExercise(e);
      show("success", "تمت إضافة التمرين إلى مكتبتك. يمكنك تعديله بحرية دون التأثير على المكتبة العامة.");
      setDetail(null);
    } catch (err) {
      show("error", friendlyError(err));
    }
  };

  const sendReport = async () => {
    if (!reporting || reason.trim().length < 3) return show("error", "اكتب سبب البلاغ.");
    try {
      await createExerciseReport(reporting, reason.trim(), user?.displayName ?? user?.email ?? "");
      show("success", "تم إرسال البلاغ للمراجعة. شكرًا لك.");
      setReporting(null);
      setReason("");
    } catch (err) {
      show("error", friendlyError(err));
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="مكتبة التمارين"
        breadcrumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "مكتبة التمارين" }]}
        actions={
          <>
            <Button variant="outline" onClick={() => setManaging(true)}>
              <Settings2 className="h-4 w-4" aria-hidden />
              التصنيفات
            </Button>
            <Button onClick={() => router.push("/exercises/new")}>
              <Plus className="h-4 w-4" aria-hidden />
              إضافة تمرين
            </Button>
          </>
        }
      />

      <Tabs
        value={tab}
        onChange={(t) => {
          setTab(t);
          setFavOnly(false);
        }}
        tabs={[
          { value: "mine", label: "مكتبتي" },
          { value: "public", label: "المكتبة العامة" },
        ]}
      />

      <div className="my-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن تمرين"
          aria-label="بحث"
          className="h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-base focus:border-secondary focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <Select
          aria-label="الجزء المستهدف"
          value={bodyPart}
          onChange={(e) => setBodyPart(e.target.value)}
          placeholder="كل الأجزاء"
          options={categories.filter((c) => c.kind === "bodyPart").map((c) => ({ value: c.name, label: c.name }))}
        />
        <Select
          aria-label="التصنيف الفرعي"
          value={sub}
          onChange={(e) => setSub(e.target.value)}
          placeholder="كل التصنيفات"
          options={categories.filter((c) => c.kind === "subcategory").map((c) => ({ value: c.name, label: c.name }))}
        />
        {tab === "mine" && (
          <div className="flex gap-2">
            <Button variant={favOnly ? "primary" : "outline"} onClick={() => setFavOnly((f) => !f)} aria-pressed={favOnly}>
              <Heart className="h-4 w-4" aria-hidden />
              المفضلة
            </Button>
            <Button variant={sort === "recent" ? "primary" : "outline"} onClick={() => setSort((s) => (s === "recent" ? "updated" : "recent"))} aria-pressed={sort === "recent"}>
              آخر المستخدمة
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title={tab === "mine" ? "لا توجد تمارين مطابقة" : "المكتبة العامة فارغة أو لا توجد نتائج"}
          description={
            tab === "mine"
              ? "أضف تمرينك الأول برابط فيديو YouTube، أو استورد تمارين من المكتبة العامة."
              : "يضيف مسؤول المنصة التمارين العامة، ويمكنك نسخ أي تمرين إلى مكتبتك."
          }
          action={
            tab === "mine" && (
              <Link href="/exercises/new">
                <Button>
                  <Plus className="h-4 w-4" aria-hidden />
                  إضافة تمرين
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((e) => (
              <ExerciseCard
                key={e.id}
                exercise={e}
                onOpen={() => setDetail(e)}
                onToggleFavorite={tab === "mine" ? () => toggleFav(e) : undefined}
                footer={
                  tab === "mine" ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => router.push(`/exercises/${e.id}`)}>
                        <Pencil className="h-4 w-4" aria-hidden />
                        تعديل
                      </Button>
                      <RowMenu
                        items={[
                          { label: "نسخ وتعديل", icon: Copy, onClick: () => act(async () => { const id = await duplicateExercise(e); router.push(`/exercises/${id}`); }, "تم إنشاء نسخة.") },
                          { label: "حذف", icon: Trash2, danger: true, onClick: () => remove(e) },
                        ]}
                      />
                    </>
                  ) : (
                    <>
                      <Button size="sm" onClick={() => importOne(e)}>
                        <Download className="h-4 w-4" aria-hidden />
                        إضافة إلى مكتبتي
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setReporting(e)} aria-label="إبلاغ عن مشكلة">
                        <Flag className="h-4 w-4" aria-hidden />
                      </Button>
                    </>
                  )
                }
              />
            ))}
          </div>
          {tab === "public" && <LoadMore hasMore={pub.hasMore} loading={pub.loadingMore} onClick={pub.loadMore} />}
        </>
      )}

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.nameAr ?? ""} size="lg">
        {detail && (
          <div className="space-y-4">
            <ExerciseDetail exercise={detail} />
            <div className="flex flex-wrap gap-2 border-t border-line pt-4">
              {tab === "mine" ? (
                <>
                  <Button onClick={() => router.push(`/exercises/${detail.id}`)}>
                    <Pencil className="h-4 w-4" aria-hidden />
                    تعديل
                  </Button>
                  <Button variant="danger" onClick={() => remove(detail)}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                    حذف
                  </Button>
                </>
              ) : (
                <Button onClick={() => importOne(detail)}>
                  <Download className="h-4 w-4" aria-hidden />
                  إضافة إلى مكتبتي
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(reporting)}
        onClose={() => setReporting(null)}
        title="الإبلاغ عن مشكلة في التمرين"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setReporting(null)}>
              إلغاء
            </Button>
            <Button onClick={sendReport}>إرسال البلاغ</Button>
          </>
        }
      >
        <Textarea label={`سبب البلاغ عن «${reporting?.nameAr ?? ""}»`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="مثال: الفيديو لا يعمل، أو التعليمات غير دقيقة" />
      </Modal>

      <CategoryManager open={managing} onClose={() => setManaging(false)} onChanged={cats.reload} />
    </div>
  );
}
