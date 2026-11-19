"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type MenuItem = { label: string; icon?: LucideIcon; onClick: () => void; danger?: boolean; hidden?: boolean };

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const VIEWPORT_PADDING = 8;
const MENU_GAP = 4;

type MenuPosition = { top: number; left: number };

export function RowMenu({ items, label = "إجراءات" }: { items: MenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const visible = items.filter((i) => !i.hidden);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isRtl = getComputedStyle(trigger).direction === "rtl" || document.documentElement.dir === "rtl";

    const preferredLeft = isRtl ? triggerRect.left : triggerRect.right - menuRect.width;
    const maxLeft = Math.max(VIEWPORT_PADDING, vw - menuRect.width - VIEWPORT_PADDING);
    const left = Math.min(Math.max(VIEWPORT_PADDING, preferredLeft), maxLeft);

    const spaceBelow = vh - triggerRect.bottom - VIEWPORT_PADDING;
    const spaceAbove = triggerRect.top - VIEWPORT_PADDING;
    const openUpward = spaceBelow < menuRect.height + MENU_GAP && spaceAbove > spaceBelow;

    let top = openUpward
      ? triggerRect.top - menuRect.height - MENU_GAP
      : triggerRect.bottom + MENU_GAP;

    const maxTop = Math.max(VIEWPORT_PADDING, vh - menuRect.height - VIEWPORT_PADDING);
    top = Math.min(Math.max(VIEWPORT_PADDING, top), maxTop);

    setPosition({ top, left });
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    updatePosition();
  }, [open, updatePosition, visible.length]);

  useEffect(() => {
    if (!open) return;

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    const onScroll = (e: Event) => {
      const target = e.target;
      if (menuRef.current && target instanceof Node && menuRef.current.contains(target)) return;
      setOpen(false);
    };

    const onResize = () => {
      setOpen(false);
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const portalTarget = open && visible.length > 0 && typeof document !== "undefined" ? document.body : null;

  return (
    <div className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="menu"
        className="grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-canvas"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      {portalTarget &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={label}
            onClick={(e) => e.stopPropagation()}
            style={
              position
                ? { top: position.top, left: position.left }
                : { top: -9999, left: -9999, visibility: "hidden" }
            }
            className={cn(
              "fixed z-[70] max-h-[calc(100dvh-16px)] min-w-44 max-w-[calc(100vw-16px)] overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-pop",
              position && "animate-fade-up"
            )}
          >
            {visible.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  item.onClick();
                }}
                className={cn(
                  "flex h-11 w-full items-center gap-2.5 rounded-lg px-3 text-start text-sm font-semibold hover:bg-canvas",
                  item.danger ? "text-danger" : "text-ink"
                )}
              >
                {item.icon && <item.icon className="h-4 w-4 shrink-0" aria-hidden />}
                {item.label}
              </button>
            ))}
          </div>,
          portalTarget
        )}
    </div>
  );
}
