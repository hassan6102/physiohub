export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Arabic-friendly normalization for client-side search. */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ً-ٰٟ]/g, "") // diacritics
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .trim();
}

export function matchesQuery(q: string, ...fields: (string | undefined | null)[]): boolean {
  const needle = normalizeText(q);
  if (!needle) return true;
  return fields.some((f) => f && normalizeText(f).includes(needle));
}

export function splitLines(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function splitCommas(text: string): string[] {
  return text
    .split(/[,،]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function waLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
