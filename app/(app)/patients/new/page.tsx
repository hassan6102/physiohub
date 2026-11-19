"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { PatientForm } from "@/components/patients/patient-form";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";
import { toPatientInput } from "@/lib/patient-mapper";
import { friendlyError } from "@/lib/utils/errors";
import { emptyPatientForm, type PatientFormValues } from "@/lib/validations/patient";
import { createPatient } from "@/services/patients.service";

export default function NewPatientPage() {
  const router = useRouter();
  const { show } = useToast();
  const [busy, setBusy] = useState(false);
  const submittingRef = useRef(false);

  const onSubmit = async (values: PatientFormValues) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setBusy(true);
    try {
      const id = await createPatient(toPatientInput(values));
      show("success", "تمت إضافة المريض بنجاح.");
      router.replace(`/patients/${id}`);
    } catch (e) {
      show("error", friendlyError(e));
      submittingRef.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="إضافة مريض"
        breadcrumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "المرضى", href: "/patients" }, { label: "مريض جديد" }]}
      />
      <div className="card p-5 sm:p-8">
        <PatientForm initial={emptyPatientForm} submitLabel="حفظ المريض" submitting={busy} onSubmit={onSubmit} onCancel={() => router.back()} />
      </div>
    </div>
  );
}
