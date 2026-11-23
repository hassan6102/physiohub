"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Toast = { id: number; type: "success" | "error"; message: string };
const ToastContext = createContext<{ show: (type: Toast["type"], message: string) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const show = useCallback(
    (type: Toast["type"], message: string) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, type, message }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 md:bottom-6"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm animate-fade-up items-center gap-3 rounded-xl border bg-surface px-4 py-3 shadow-pop",
              t.type === "success" ? "border-accent/40" : "border-danger/40"
            )}
          >
            {t.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-danger" aria-hidden />
            )}
            <p className="flex-1 text-sm text-ink">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="p-1 text-muted" aria-label="close">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
