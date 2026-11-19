"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, ClipboardList, Pencil, RotateCcw, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState, ListSkeleton } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { PatientStatusBadge } from "@/components/patients/patient-status-badge";
import { MedicalTab } from "@/components/patients/tabs/medical-tab";
import { NotesTab } from "@/components/patients/tabs/notes-tab";
import { OverviewTab } from "@/components/patients/tabs/overview-tab";
import { PlansTab } from "@/components/patients/tabs/plans-tab";
import { ProgressTab } from "@/components/patients/tabs/progress-tab";
import { SessionsTab } from "@/components/patients/tabs/sessions-tab";
import { useLoad } from "@/hooks/use-load";
import { friendlyError } from "@/lib/utils/errors";
import { archivePatient, getPatient, restorePatient, setPatientStatus } from "@/services/patients.service";

type Tab = "overview" | "medical" | "sessions" | "plans" | "progress" | "notes";

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const confirm = useConfirm();
  const { show } = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const { data: patient, loading, error, reload } = useLoad(() => getPatient(id), [id]);

  if (loading) return <ListSkeleton rows={4} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!patient) return <ErrorState message="المريض غير موجود أو ليست لديك صلاحية الوصول إليه." />;

  const archived = patient.status === "archived";

  const changeStatus = async (status: "active" | "completed" | "paused" | "inactive") => {
    try {
      await setPatientStatus(patient.id, status, patient.fullName);
      show("success", "تم تغيير الحالة.");
      reload();
    } catch (e) {
      show("error", friendlyError(e));
    }
  };

  const onArchive = async () => {
    const ok = await confirm({
      title: "أرشفة المريض",
      message: "سيُنقل المريض إلى الأرشيف وتبقى جميع بياناته وجلساته محفوظة ويمكن استعادته لاحقًا.",
      confirmLabel: "أرشفة",
      danger: true,
    });
    if (!ok) return;
    try {
      await archivePatient(patient);
      show("success", "تمت الأرشفة.");
      reload();
    } catch (e) {
      show("error", friendlyError(e));
    }
  };

  const onRestore = async () => {
    try {
      await restorePatient(patient);
      show("success", "تمت استعادة المريض.");
      reload();
    } catch (e) {
      show("error", friendlyError(e));
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title={patient.fullName}
        breadcrumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "المرضى", href: "/patients" }, { label: patient.fullName }]}
        actions={
          <>
            {!archived && (
              <>
                <Button onClick={() => router.push(`/sessions/new?patientId=${patient.id}`)}>
                  <Stethoscope className="h-4 w-4" aria-hidden />
                  تسجيل جلسة
                </Button>
                <Button variant="outline" onClick={() => router.push(`/treatment-plans/new?patientId=${patient.id}`)}>
                  <ClipboardList className="h-4 w-4" aria-hidden />
                  برنامج علاجي
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => router.push(`/patients/${patient.id}/edit`)}>
              <Pencil className="h-4 w-4" aria-hidden />
              تعديل
            </Button>
            {archived ? (
              <Button variant="outline" onClick={onRestore}>
                <RotateCcw className="h-4 w-4" aria-hidden />
                استعادة
              </Button>
            ) : (
              <Button variant="ghost" onClick={onArchive}>
                <Archive className="h-4 w-4" aria-hidden />
                أرشفة
              </Button>
            )}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <PatientStatusBadge status={patient.status} />
        {!archived && (
          <div className="w-44">
            <Select
              aria-label="تغيير الحالة"
              value={patient.status}
              onChange={(e) => changeStatus(e.target.value as "active" | "completed" | "paused" | "inactive")}
              options={[
                { value: "active", label: "نشط" },
                { value: "paused", label: "متوقف مؤقتًا" },
                { value: "completed", label: "مكتمل" },
                { value: "inactive", label: "غير نشط" },
              ]}
            />
          </div>
        )}
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "overview", label: "نظرة عامة" },
          { value: "medical", label: "التاريخ الطبي" },
          { value: "sessions", label: "الجلسات" },
          { value: "plans", label: "البرامج العلاجية" },
          { value: "progress", label: "التطور" },
          { value: "notes", label: "الملاحظات والملفات" },
        ]}
      />

      <div>
        {tab === "overview" && <OverviewTab patient={patient} />}
        {tab === "medical" && <MedicalTab patient={patient} onChanged={reload} />}
        {tab === "sessions" && <SessionsTab patientId={patient.id} archived={archived} />}
        {tab === "plans" && <PlansTab patientId={patient.id} archived={archived} />}
        {tab === "progress" && <ProgressTab patientId={patient.id} archived={archived} />}
        {tab === "notes" && <NotesTab patient={patient} onChanged={reload} />}
      </div>
    </div>
  );
}
