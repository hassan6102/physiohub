"use client";

import { Select } from "@/components/ui/form";
import { useLoad } from "@/hooks/use-load";
import { getPatientOptions } from "@/services/patients.service";

export function PatientSelect({
  value,
  onChange,
  error,
  disabled,
  label = "المريض",
}: {
  value: string;
  onChange: (id: string, name: string) => void;
  error?: string;
  disabled?: boolean;
  label?: string;
}) {
  const { data, loading, error: loadError } = useLoad(() => getPatientOptions(), []);
  const options = (data ?? []).map((p) => ({ value: p.id, label: p.fullName }));
  return (
    <Select
      label={label}
      required
      disabled={disabled || loading}
      value={value}
      placeholder={loading ? "جارٍ التحميل..." : "اختر المريض"}
      options={options}
      error={error ?? (loadError ?? undefined)}
      onChange={(e) => {
        const id = e.target.value;
        onChange(id, options.find((o) => o.value === id)?.label ?? "");
      }}
    />
  );
}
