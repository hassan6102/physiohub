import { cn } from "@/lib/utils/cn";

const tones = {
  success: "bg-accent-50 text-accent-600",
  info: "bg-secondary-50 text-secondary",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  neutral: "bg-canvas text-muted border border-line",
};

export function Badge({ tone = "neutral", children, className }: { tone?: keyof typeof tones; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}
