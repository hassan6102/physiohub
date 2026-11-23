"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";

export function AppShell({ children, variant = "doctor" }: { children: React.ReactNode; variant?: "doctor" | "admin" }) {
  const { user, loading, isAdmin, clinicId, clinic } = useAuth();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (variant === "admin") { if (!isAdmin) router.replace("/dashboard"); }
    else if (!clinicId) router.replace("/setup");
  }, [loading, user, isAdmin, clinicId, variant, router]);

  // Client-side guard is UX only; data access is enforced by Firestore rules and server routes.
  if (loading || !user || (variant === "admin" ? !isAdmin : !clinicId)) {
    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-10" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  const initial = (user.displayName ?? user.email ?? "؟").trim().charAt(0);

  return (
    <div className="min-h-dvh md:flex">
      <Sidebar variant={variant} className="sticky top-0 hidden h-dvh md:flex print:hidden" />

      {drawer && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-ink/40" onClick={() => setDrawer(false)} aria-label="إغلاق" />
          <div className="absolute inset-y-0 start-0 w-72 max-w-[85vw] animate-fade-up">
            <Sidebar variant={variant} className="w-full" onNavigate={() => setDrawer(false)} />
            <button
              onClick={() => setDrawer(false)}
              className="absolute end-3 top-3 grid h-10 w-10 place-items-center rounded-xl text-muted"
              aria-label="إغلاق"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur md:px-8 print:hidden">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-50 text-sm font-bold text-primary">{initial}</span>
          <p className="truncate text-sm font-semibold text-ink">{user.displayName ?? user.email}</p>
          {variant === "doctor" && clinic && (
            <div className="ms-auto flex min-w-0 items-center gap-2">
              {clinic.logoUrl && /* eslint-disable-next-line @next/next/no-img-element */ <img src={clinic.logoUrl} alt="" referrerPolicy="no-referrer" className="h-8 w-8 rounded-lg object-cover" />}
              <span className="truncate text-sm font-bold text-primary">{clinic.name}</span>
            </div>
          )}
        </header>
        <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10 print:p-0">{children}</main>
      </div>

      <BottomNav variant={variant} onMore={() => setDrawer(true)} />
    </div>
  );
}
