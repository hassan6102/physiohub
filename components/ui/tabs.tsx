"use client";

import { cn } from "@/lib/utils/cn";

export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
}: {
  value: T;
  onChange: (v: T) => void;
  tabs: { value: T; label: string }[];
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0 print:hidden" role="tablist">
      <div className="flex min-w-max gap-1 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={value === t.value}
            onClick={() => onChange(t.value)}
            className={cn(
              "h-11 whitespace-nowrap border-b-2 px-4 text-sm font-semibold transition-colors",
              value === t.value ? "border-primary text-primary" : "border-transparent text-muted hover:text-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
