"use client";

import { createContext, useContext, useMemo } from "react";
import ar from "@/locales/ar.json";

// The platform is Arabic-only (RTL). The translation layer is kept so that
// shared labels live in locales/ar.json and a language can be added later.
type Ctx = { locale: "ar"; dir: "rtl"; t: (key: string) => string };

function lookup(dict: unknown, key: string): string | undefined {
  const value = key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[part];
    return undefined;
  }, dict);
  return typeof value === "string" ? value : undefined;
}

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<Ctx>(
    () => ({ locale: "ar", dir: "rtl", t: (key) => lookup(ar, key) ?? key }),
    []
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
