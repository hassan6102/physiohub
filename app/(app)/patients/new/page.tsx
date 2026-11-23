"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-provider";
import { useTeam } from "@/hooks/use-team";
import { canBeAssigned } from "@/services/team.service";
import { ErrorState, ListSkeleton } from "@/components/ui/states";
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
  const { role } = useAuth();
  const team = useTeam();
  const doctorOptions = role === "manager" ? team.members.filter(canBeAssigned).map((m) => ({ value: m.id, label: m.fullName })) : undefined;

  const onSubmit = async (values: PatientFormValues) => {
    setBusy(true);
    try {
      const id = await createPatient(toPatientInput(values));
      show("success", "تمت إضافة المريض بنجاح.");
      router.replace(`/patients/${id}`);
    } catch (e) {
      show("error", friendlyError(e));
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
        {role === "manager" && team.loading ? (
          <ListSkeleton rows={3} />
        ) : role === "manager" && team.error ? (
          <ErrorState message={team.error} onRetry={team.reload} />
        ) : role === "manager" && doctorOptions && doctorOptions.length === 0 ? (
          <ErrorState message="لا يوجد دكتور نشط لإسناد المريض إليه. ادعُ دكتورًا من صفحة «إدارة الدكاترة» أولًا." />
        ) : (
          <PatientForm initial={emptyPatientForm} submitLabel="حفظ المريض" submitting={busy} onSubmit={onSubmit} onCancel={() => router.back()} doctorOptions={doctorOptions} />
        )}
      </div>
    </div>
  );
}
