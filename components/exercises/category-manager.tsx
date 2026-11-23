"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/utils/errors";
import { addCategory, deleteCategory, getCategories, renameCategory, reorderCategories } from "@/services/categories.service";
import type { Category } from "@/types/models";

type Scope = "doctor" | "public";

/** Add, rename, reorder and delete categories. Move buttons work on touch screens too. */
export function CategoryManager({
  open,
  onClose,
  scope = "doctor",
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  scope?: Scope;
  onChanged: () => void;
}) {
  const { show } = useToast();
  const confirm = useConfirm();
  const [kind, setKind] = useState<Category["kind"]>("bodyPart");
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await getCategories(scope, true));
    } catch (e) {
      show("error", friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const list = items.filter((c) => c.kind === kind).sort((a, b) => a.order - b.order);

  const run = async (fn: () => Promise<void>, ok?: string) => {
    try {
      await fn();
      if (ok) show("success", ok);
      await load();
      onChanged();
    } catch (e) {
      show("error", friendlyError(e));
    }
  };

  const add = () => {
    const n = name.trim();
    if (!n) return;
    if (list.some((c) => c.name === n)) return show("error", "هذا التصنيف موجود بالفعل.");
    setName("");
    void run(() => addCategory(scope, kind, n, list.length), "تمت الإضافة.");
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const ids = list.map((c) => c.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    void run(() => reorderCategories(scope, ids));
  };

  const remove = async (c: Category) => {
    const ok = await confirm({
      title: "حذف التصنيف",
      message: `سيتم حذف «${c.name}» من القائمة. التمارين الحالية تحتفظ بقيمتها ولا تتأثر.`,
      confirmLabel: "حذف",
      danger: true,
    });
    if (ok) void run(() => deleteCategory(scope, c.id), "تم الحذف.");
  };

  return (
    <Modal open={open} onClose={onClose} title="إدارة التصنيفات" size="md">
      <div className="space-y-4">
        <Tabs
          value={kind}
          onChange={setKind}
          tabs={[
            { value: "bodyPart", label: "الأجزاء المستهدفة" },
            { value: "subcategory", label: "التصنيفات الفرعية" },
          ]}
        />
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="اسم تصنيف جديد"
            aria-label="اسم تصنيف جديد"
            className="h-11 min-w-0 flex-1 rounded-xl border border-line px-3.5 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <Button onClick={add}>
            <Plus className="h-4 w-4" aria-hidden />
            إضافة
          </Button>
        </div>

        {loading && list.length === 0 ? (
          <p className="text-sm text-muted">جارٍ التحميل...</p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {list.map((c, i) => (
              <li key={c.id} className="flex items-center gap-1 px-2 py-1.5">
                {editing?.id === c.id ? (
                  <>
                    <input
                      autoFocus
                      value={editing.name}
                      onChange={(e) => setEditing({ id: c.id, name: e.target.value })}
                      className="h-10 min-w-0 flex-1 rounded-lg border border-line px-2.5"
                      aria-label="الاسم الجديد"
                    />
                    <IconBtn label="حفظ" onClick={() => editing.name.trim() && run(async () => { await renameCategory(scope, c.id, editing.name); setEditing(null); }, "تم التعديل.")}>
                      <Check className="h-4 w-4 text-success" />
                    </IconBtn>
                    <IconBtn label="إلغاء" onClick={() => setEditing(null)}>
                      <X className="h-4 w-4" />
                    </IconBtn>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 truncate ps-2 text-sm font-semibold">{c.name}</span>
                    <IconBtn label="تحريك لأعلى" disabled={i === 0} onClick={() => move(i, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="تحريك لأسفل" disabled={i === list.length - 1} onClick={() => move(i, 1)}>
                      <ArrowDown className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="تعديل الاسم" onClick={() => setEditing({ id: c.id, name: c.name })}>
                      <Pencil className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="حذف" onClick={() => remove(c)}>
                      <Trash2 className="h-4 w-4 text-danger" />
                    </IconBtn>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted">تغيير اسم تصنيف لا يغيّر التمارين المحفوظة سابقًا؛ هي تحتفظ بالاسم القديم.</p>
      </div>
    </Modal>
  );
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-muted hover:bg-canvas disabled:opacity-30"
    >
      {children}
    </button>
  );
}
