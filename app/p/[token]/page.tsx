"use client";

import { use, useCallback, useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/form";
import { PlanView } from "@/components/plans/plan-view";
import { dayKey } from "@/lib/utils/date";
import type { PortalPlan } from "@/types/models";

type Completion = { exerciseKey: string; day: string };
type Fail = { status: number; message: string; requiresPin?: boolean };

const pinKey = (t: string) => `physiohub:pin:${t.slice(0, 8)}`;
const readPin = (t: string) => {
  try { return sessionStorage.getItem(pinKey(t)) ?? ""; } catch { return ""; }
};
const savePin = (t: string, v: string) => {
  try { v ? sessionStorage.setItem(pinKey(t), v) : sessionStorage.removeItem(pinKey(t)); } catch { /* ignore */ }
};

export default function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [plan, setPlan] = useState<PortalPlan | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [fail, setFail] = useState<Fail | null>(null);
  const [pin, setPin] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(
    async (p: string) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/shared/${token}`, { cache: "no-store", headers: p ? { "x-share-pin": p } : {} });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (res.status === 401 || res.status === 429) savePin(token, "");
          setFail({ status: res.status, message: data.error ?? "تعذر فتح البرنامج.", requiresPin: data.requiresPin });
          setPlan(null);
          return;
        }
        const today = dayKey(new Date());
        setPlan(data.plan);
        setDone(new Set((data.completions as Completion[]).filter((c) => c.day === today).map((c) => c.exerciseKey)));
        setFail(null);
        if (p) savePin(token, p);
      } catch {
        setFail({ status: 0, message: "تعذر الاتصال بالإنترنت. حاول مرة أخرى." });
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load(readPin(token));
  }, [load, token]);

  const toggle = async (key: string) => {
    const wasDone = done.has(key);
    setPending(key);
    setNote("");
    try {
      const res = await fetch(`/api/shared/${token}/completions`, {
        method: wasDone ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json", "x-share-pin": readPin(token) },
        body: JSON.stringify({ exerciseKey: key, day: dayKey(new Date()) }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "تعذر الحفظ.");
      }
      setDone((s) => {
        const n = new Set(s);
        wasDone ? n.delete(key) : n.add(key);
        return n;
      });
    } catch (e) {
      setNote((e as Error).message);
    } finally {
      setPending(null);
    }
  };

  if (loading && !plan)
    return (
      <main className="grid min-h-screen place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" aria-label="جارٍ التحميل" />
      </main>
    );

  if (fail?.requiresPin)
    return (
      <main className="mx-auto grid min-h-screen max-w-sm place-items-center p-4">
        <form
          className="card w-full space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (pin) load(pin);
          }}
        >
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent-50 text-accent-600"><Lock className="h-6 w-6" aria-hidden /></span>
          <h1 className="text-center text-lg font-bold text-primary">برنامج محمي برمز تحقق</h1>
          <TextInput label="رمز التحقق" inputMode="numeric" dir="ltr" autoComplete="off" maxLength={8} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} />
          {fail.status !== 401 || pin ? <p className="text-sm text-danger" role="alert">{fail.message}</p> : null}
          <Button type="submit" className="w-full" disabled={!pin || loading}>فتح البرنامج</Button>
        </form>
      </main>
    );

  if (fail || !plan)
    return (
      <main className="mx-auto grid min-h-screen max-w-sm place-items-center p-4 text-center">
        <div className="card space-y-2 p-6" role="alert">
          <h1 className="text-lg font-bold text-primary">لا يمكن فتح البرنامج</h1>
          <p className="text-sm text-muted">{fail?.message ?? "تعذر فتح البرنامج."}</p>
          <p className="text-xs text-muted">تواصل مع أخصائيك للحصول على رابط جديد.</p>
        </div>
      </main>
    );

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4 pb-16">
      {note && <p className="rounded-xl bg-danger/10 p-3 text-sm text-danger" role="alert">{note}</p>}
      <PlanView plan={plan} doneKeys={done} onToggle={toggle} pendingKey={pending} />
      <p className="text-center text-xs text-muted">PhysioHub</p>
    </main>
  );
}
