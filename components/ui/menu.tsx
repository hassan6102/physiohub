"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type MenuItem = { label: string; icon?: LucideIcon; onClick: () => void; danger?: boolean; hidden?: boolean };

export function RowMenu({ items, label = "إجراءات" }: { items: MenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const visible = items.filter((i) => !i.hidden);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-expanded={open}
        className="grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-canvas"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute end-0 top-11 z-30 min-w-44 animate-fade-up rounded-xl border border-line bg-surface p-1 shadow-pop">
          {visible.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={cn(
                "flex h-11 w-full items-center gap-2.5 rounded-lg px-3 text-sm font-semibold hover:bg-canvas",
                item.danger ? "text-danger" : "text-ink"
              )}
            >
              {item.icon && <item.icon className="h-4 w-4" aria-hidden />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
