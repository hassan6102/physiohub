"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { SessionForm } from "@/components/sessions/session-form";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";
import { emptySessionForm, toSessionInput } from "@/lib/session-mapper";
import { friendlyError } from "@/lib/utils/errors";
import type { SessionFormValues } from "@/lib/validations/session";
import { createSession } from "@/services/sessions.service";

function NewSession() {
  const router = useRouter();
  const params = useSearchParams();
  const patientId = params.get("patientId") ?? "";
  const { show } = useToast();
  const [busy, setBusy] = useState(false);

  const onSubmit = async (values: SessionFormValues, patientName: string) => {
    setBusy(true);
    try {
      await createSession(toSessionInput(values, patientName));
      show("success", "تم تسجيل الجلسة.");
      router.replace(`/patients/${values.patientId}`);
    } catch (e) {
      show("error", friendlyError(e));
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="تسجيل جلسة"
        breadcrumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "الجلسات", href: "/sessions" }, { label: "جلسة جديدة" }]}
      />
      <div className="card p-5 sm:p-8">
        <SessionForm
          initial={emptySessionForm(patientId)}
          lockPatient={Boolean(patientId)}
          submitLabel="حفظ الجلسة"
          submitting={busy}
          onSubmit={onSubmit}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <NewSession />
    </Suspense>
  );
}
