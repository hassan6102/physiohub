const LOCALE = "ar-EG-u-nu-latn";

export const formatDate = (d?: Date | null) =>
  d ? new Intl.DateTimeFormat(LOCALE, { year: "numeric", month: "short", day: "numeric" }).format(d) : "—";

export const formatTime = (d?: Date | null) =>
  d ? new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit" }).format(d) : "—";

export const formatDateTime = (d?: Date | null) => (d ? `${formatDate(d)} - ${formatTime(d)}` : "—");

export const formatMonthYear = (d: Date) =>
  new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric" }).format(d);

export const formatWeekday = (d: Date) => new Intl.DateTimeFormat(LOCALE, { weekday: "long" }).format(d);

const p2 = (n: number) => String(n).padStart(2, "0");

export function toInputDate(d?: Date | null): string {
  if (!d) return "";
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

export function toInputDateTime(d?: Date | null): string {
  if (!d) return "";
  return `${toInputDate(d)}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

export function fromInputDate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function fromInputDateTime(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
export const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};
export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
export const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

export function ageFromBirth(birth?: Date | null): number | null {
  if (!birth) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

export function daysSince(d?: Date | null): number | null {
  if (!d) return null;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

export function relativeDays(d?: Date | null): string {
  const n = daysSince(d);
  if (n === null) return "—";
  if (n <= 0) return "اليوم";
  if (n === 1) return "أمس";
  return `منذ ${n} يوم`;
}

/** YYYYMMDD key used for per-day completion ids */
export const dayKey = (d: Date) => `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}`;
