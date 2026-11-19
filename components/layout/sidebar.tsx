"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartPulse, LogOut, ShieldCheck } from "lucide-react";
import { signOut } from "firebase/auth";
import { cn } from "@/lib/utils/cn";
import { getClientAuth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/auth-provider";
import { adminNavItems, navItems, type NavItem } from "./nav-items";

export function Sidebar({
  className,
  onNavigate,
  variant = "doctor",
}: {
  className?: string;
  onNavigate?: () => void;
  variant?: "doctor" | "admin";
}) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const items: NavItem[] = variant === "admin" ? adminNavItems : navItems;

  return (
    <aside className={cn("flex h-full w-64 flex-col border-e border-line bg-surface", className)}>
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white">
          <HeartPulse className="h-5 w-5" aria-hidden />
        </span>
        <span className="text-lg font-bold text-primary">PhysioHub</span>
        {variant === "admin" && <span className="rounded-md bg-primary-50 px-2 py-0.5 text-xs font-bold text-primary">إدارة</span>}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors",
                active ? "bg-primary text-white" : "text-ink hover:bg-primary-50"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </Link>
          );
        })}
        {variant === "doctor" && isAdmin && (
          <Link
            href="/admin"
            onClick={onNavigate}
            className="mt-3 flex h-11 items-center gap-3 rounded-xl border border-line px-3 text-sm font-semibold text-secondary hover:bg-secondary-50"
          >
            <ShieldCheck className="h-5 w-5" aria-hidden />
            لوحة المسؤول
          </Link>
        )}
        {variant === "admin" && (
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="mt-3 flex h-11 items-center gap-3 rounded-xl border border-line px-3 text-sm font-semibold text-secondary hover:bg-secondary-50"
          >
            العودة إلى لوحة الدكتور
          </Link>
        )}
      </nav>

      <div className="border-t border-line p-3">
        <button
          onClick={() => signOut(getClientAuth())}
          className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-danger hover:bg-danger/5"
        >
          <LogOut className="h-5 w-5 rtl-flip" aria-hidden />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
