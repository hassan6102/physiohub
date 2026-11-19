import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils/cn";

const fieldBase =
  "w-full rounded-xl border border-line bg-surface px-3.5 text-base text-ink placeholder:text-muted focus:border-secondary focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:bg-canvas";

export function Field({
  label,
  error,
  hint,
  required,
  children,
  htmlFor,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
        {label}
        {required && <span className="ms-1 text-danger">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; hint?: string };
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, required, ...props },
  ref
) {
  const id = useId();
  return (
    <Field label={label} error={error} hint={hint} required={required} htmlFor={id}>
      <textarea ref={ref} id={id} rows={3} className={cn(fieldBase, "py-2.5", error && "border-danger", className)} {...props} />
    </Field>
  );
});

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
};
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, placeholder, className, required, ...props },
  ref
) {
  const id = useId();
  const seen = new Set<string>();
  const uniqueOptions = options.filter((o) => {
    if (seen.has(o.value)) return false;
    seen.add(o.value);
    return true;
  });
  const control = (
    <select ref={ref} id={id} className={cn(fieldBase, "h-11 appearance-none bg-no-repeat pe-9", error && "border-danger", className)} {...props}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {uniqueOptions.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
  if (!label) return control;
  return (
    <Field label={label} error={error} required={required} htmlFor={id}>
      {control}
    </Field>
  );
});

export function TextInput({
  label,
  error,
  hint,
  className,
  required,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const id = useId();
  return (
    <Field label={label} error={error} hint={hint} required={required} htmlFor={id}>
      <input id={id} className={cn(fieldBase, "h-11", error && "border-danger", className)} {...props} />
    </Field>
  );
}

export function Checkbox({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 rounded border-line accent-[#1D7180]"
      />
      {label}
    </label>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex w-full rounded-xl border border-line bg-canvas p-1" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-10 flex-1 rounded-lg px-3 text-sm font-semibold transition-colors",
            value === o.value ? "bg-surface text-primary shadow-card" : "text-muted"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
