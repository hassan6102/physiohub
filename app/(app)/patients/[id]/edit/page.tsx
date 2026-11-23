"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { PatientForm } from "@/components/patients/patient-form";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState, ListSkeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useLoad } from "@/hooks/use-load";
import { toPatientForm, toPatientInput } from "@/lib/patient-mapper";
import { friendlyError } from "@/lib/utils/errors";
import type { PatientFormValues } from "@/lib/validations/patient";
import { getPatient, updatePatient } from "@/services/patients.service";

export default function EditPatientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { show } = useToast();
  const [busy, setBusy] = useState(false);
  const { data: patient, loading, error, reload } = useLoad(() => getPatient(id), [id]);

  const onSubmit = async (values: PatientFormValues) => {
    setBusy(true);
    try {
      await updatePatient(id, toPatientInput(values), patient);
      show("success", "تم حفظ التعديلات.");
      router.replace(`/patients/${id}`);
    } catch (e) {
      show("error", friendlyError(e));
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="تعديل بيانات المريض"
        breadcrumbs={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "المرضى", href: "/patients" },
          { label: patient?.fullName ?? "المريض", href: `/patients/${id}` },
          { label: "تعديل" },
        ]}
      />
      {loading ? (
        <ListSkeleton rows={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !patient ? (
        <ErrorState message="المريض غير موجود." />
      ) : (
        <div className="card p-5 sm:p-8">
          <PatientForm
            initial={toPatientForm(patient)}
            submitLabel="حفظ التعديلات"
            submitting={busy}
            onSubmit={onSubmit}
            onCancel={() => router.back()}
          />
        </div>
      )}
    </div>
  );
}
