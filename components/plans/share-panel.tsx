"use client";

import { useState } from "react";
import { Copy, Link2, MessageCircle, ShieldOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextInput, Select } from "@/components/ui/form";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { ErrorState, ListSkeleton } from "@/components/ui/states";
import { useLoad } from "@/hooks/use-load";
import { formatDateTime } from "@/lib/utils/date";
import { friendlyError } from "@/lib/utils/errors";
import { waLink } from "@/lib/utils/misc";
import { getSharesForPlan } from "@/services/plans.service";
import { createShare, revokeShare } from "@/services/shares.client";
import type { SharedProgram, TreatmentPlan } from "@/types/models";

const EXPIRY = [
  { value: "7", label: "7 أيام" },
  { value: "30", label: "30 يومًا" },
  { value: "90", label: "90 يومًا" },
  { value: "never", label: "بدون انتهاء" },
];

function status(s: SharedProgram): { label: string; tone: "success" | "danger" | "neutral" } {
  if (s.revoked) return { label: "ملغى", tone: "danger" };
  if (s.expiresAt && s.expiresAt < new Date()) return { label: "منتهي", tone: "neutral" };
  return { label: "نشط", tone: "success" };
}

export function SharePanel({ plan }: { plan: TreatmentPlan }) {
  const { show } = useToast();
  const confirm = useConfirm();
  const shares = useLoad(() => getSharesForPlan(plan.id), [plan.id]);
  const [expiry, setExpiry] = useState("30");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState<{ url: string; pin: string } | null>(null);
  const published = plan.status === "published";

  const create = async () => {
    if (pin && !/^\d{4,8}$/.test(pin)) return show("error", "رمز التحقق يجب أن يكون من 4 إلى 8 أرقام.");
    setBusy(true);
    try {
      const r = await createShare({ planId: plan.id, expiresInDays: expiry === "never" ? null : Number(expiry), pin: pin || null });
      setFresh({ url: r.url, pin });
      setPin("");
      shares.reload();
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to create share link:", e);
      }
      show("error", friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      show("success", "تم النسخ.");
    } catch {
      show("error", "تعذر النسخ، انسخ الرابط يدويًا.");
    }
  };

  const revoke = async (s: SharedProgram) => {
    if (!(await confirm({ title: "إلغاء الرابط", message: "لن يتمكن المريض من فتح هذا الرابط بعد الآن.", confirmLabel: "إلغاء الرابط", danger: true }))) return;
    try {
      await revokeShare(s.id);
      show("success", "تم إلغاء الرابط.");
      shares.reload();
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to revoke share link:", e);
      }
      show("error", friendlyError(e));
    }
  };

  return (
    <section className="card space-y-4 p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold text-primary">
        <Link2 className="h-5 w-5" aria-hidden />
        مشاركة البرنامج مع المريض
      </h2>
      {!published ? (
        <p className="text-sm text-muted">انشر البرنامج أولًا ليمكن مشاركته.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Select label="مدة الصلاحية" value={expiry} onChange={(e) => setExpiry(e.target.value)} options={EXPIRY} />
            <TextInput label="رمز تحقق (اختياري)" inputMode="numeric" dir="ltr" maxLength={8} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="4-8 أرقام" />
            <Button type="button" onClick={create} loading={busy}>إنشاء رابط</Button>
          </div>
          {fresh && (
            <div className="space-y-3 rounded-xl border border-accent bg-accent-50 p-4">
              <p className="text-sm font-bold text-ink">الرابط جاهز. يظهر مرة واحدة فقط، انسخه الآن.</p>
              <p dir="ltr" className="break-all rounded-lg bg-surface p-2 text-xs">{fresh.url}</p>
              {fresh.pin && <p className="text-sm">رمز التحقق: <b dir="ltr">{fresh.pin}</b> (أرسله للمريض بشكل منفصل)</p>}
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => copy(fresh.url)}><Copy className="h-4 w-4" aria-hidden />نسخ الرابط</Button>
                <a href={waLink(`برنامجك العلاجي: ${fresh.url}`)} target="_blank" rel="noopener noreferrer">
                  <Button type="button" size="sm" variant="outline"><MessageCircle className="h-4 w-4" aria-hidden />واتساب</Button>
                </a>
              </div>
            </div>
          )}
        </>
      )}
      {shares.loading ? (
        <ListSkeleton rows={2} />
      ) : shares.error ? (
        <ErrorState message={shares.error} onRetry={shares.reload} />
      ) : (shares.data ?? []).length > 0 ? (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {shares.data!.map((s) => {
            const st = status(s);
            return (
              <li key={s.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                <Badge tone={st.tone}>{st.label}</Badge>
                {s.hasPin && <Badge tone="info">برمز تحقق</Badge>}
                <span className="text-muted">أُنشئ {formatDateTime(s.createdAt)}</span>
                <span className="text-muted">{s.expiresAt ? `ينتهي ${formatDateTime(s.expiresAt)}` : "بدون انتهاء"}</span>
                {st.label === "نشط" && (
                  <Button type="button" size="sm" variant="ghost" className="ms-auto text-danger" onClick={() => revoke(s)}>
                    <ShieldOff className="h-4 w-4" aria-hidden />إلغاء
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
