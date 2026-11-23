"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { toPatientForm, toPatientInput } from "@/lib/patient-mapper";
import { formatDate } from "@/lib/utils/date";
import { friendlyError } from "@/lib/utils/errors";
import { updatePatient } from "@/services/patients.service";
import type { Patient } from "@/types/models";

type Key = "medicalHistory" | "previousInjuries" | "previousSurgeries" | "medications" | "treatmentGoals";
const FIELDS: { key: Key; label: string }[] = [
  { key: "medicalHistory", label: "التاريخ المرضي" },
  { key: "previousInjuries", label: "الإصابات السابقة" },
  { key: "previousSurgeries", label: "العمليات السابقة" },
  { key: "medications", label: "الأدوية والعوامل الطبية المهمة" },
  { key: "treatmentGoals", label: "أهداف العلاج" },
];

export function MedicalTab({ patient, onChanged }: { patient: Patient; onChanged: () => void }) {
  const { show } = useToast();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Record<Key, string>>(() => pick(patient));

  const save = async () => {
    setBusy(true);
    try {
      const base = toPatientForm(patient);
      await updatePatient(patient.id, toPatientInput({ ...base, ...draft }), patient);
      show("success", "تم حفظ التاريخ الطبي.");
      setEditing(false);
      onChanged();
    } catch (e) {
      show("error", friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="card grid gap-4 p-5 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold text-muted">الشكوى الرئيسية</p>
          <p className="mt-0.5 text-sm">{patient.chiefComplaint || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted">تاريخ بداية المشكلة</p>
          <p className="mt-0.5 text-sm">{formatDate(patient.problemStartDate)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted">التشخيص المسجل</p>
          <p className="mt-0.5 text-sm">{patient.diagnosis || "—"}</p>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-primary">التاريخ الطبي</h2>
          {!editing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDraft(pick(patient));
                setEditing(true);
              }}
            >
              <Pencil className="h-4 w-4" aria-hidden />
              تعديل
            </Button>
          )}
        </div>
        {editing ? (
          <>
            {FIELDS.map((f) => (
              <Textarea key={f.key} label={f.label} value={draft[f.key]} onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))} />
            ))}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(false)}>
                إلغاء
              </Button>
              <Button loading={busy} onClick={save}>
                حفظ
              </Button>
            </div>
          </>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <dt className="text-xs font-semibold text-muted">{f.label}</dt>
                <dd className="mt-0.5 whitespace-pre-line text-sm text-ink">{patient[f.key] || "—"}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </div>
  );
}

function pick(p: Patient): Record<Key, string> {
  return {
    medicalHistory: p.medicalHistory,
    previousInjuries: p.previousInjuries,
    previousSurgeries: p.previousSurgeries,
    medications: p.medications,
    treatmentGoals: p.treatmentGoals,
  };
}
