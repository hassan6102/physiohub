"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { adminNavItems, navItems } from "./nav-items";

export function BottomNav({ onMore, variant = "doctor" }: { onMore: () => void; variant?: "doctor" | "admin" }) {
  const pathname = usePathname();
  const items = (variant === "admin" ? adminNavItems : navItems).filter((i) => i.primaryOnMobile).slice(0, 4);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden print:hidden"
      aria-label="التنقل الرئيسي"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold",
                  active ? "text-primary" : "text-muted"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span className="max-w-full truncate px-1">{label}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <button
            onClick={onMore}
            className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold text-muted"
          >
            <Menu className="h-5 w-5" aria-hidden />
            المزيد
          </button>
        </li>
      </ul>
    </nav>
  );
}
