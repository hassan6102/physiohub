import type { ZodTypeAny } from "zod";

/** Runs a zod schema and returns a flat { field: Arabic message } map (empty when valid). */
export function fieldErrors(schema: ZodTypeAny, values: unknown): Record<string, string> {
  const result = schema.safeParse(values);
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
