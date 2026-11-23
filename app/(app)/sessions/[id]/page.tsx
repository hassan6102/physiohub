"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { SessionForm } from "@/components/sessions/session-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState, ListSkeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useLoad } from "@/hooks/use-load";
import { toSessionForm, toSessionInput } from "@/lib/session-mapper";
import { formatDateTime } from "@/lib/utils/date";
import { friendlyError } from "@/lib/utils/errors";
import type { SessionFormValues } from "@/lib/validations/session";
import { getAuditFor } from "@/services/activity.service";
import { deleteSession, getSession, restoreSession, updateSession } from "@/services/sessions.service";

const ACTION_LABEL = { create: "إنشاء", update: "تعديل", archive: "أرشفة", restore: "استعادة", delete: "حذف", transfer: "نقل", } as const;

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { show } = useToast();
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reason, setReason] = useState("");
  const { data: session, loading, error, reload } = useLoad(() => getSession(id), [id]);
  const audit = useLoad(() => getAuditFor(id), [id]);

  const onSubmit = async (values: SessionFormValues) => {
    if (!session) return;
    setBusy(true);
    try {
      await updateSession(id, toSessionInput(values, session.patientName), session);
      show("success", "تم حفظ التعديلات.");
      router.replace(`/patients/${session.patientId}`);
    } catch (e) {
      show("error", friendlyError(e));
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await deleteSession(id, reason.trim());
      show("success", "تم حذف الجلسة. تبقى محفوظة في سجل التعديلات ويمكن استعادتها.");
      setDeleting(false);
      reload();
      audit.reload();
    } catch (e) {
      show("error", friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    try {
      await restoreSession(id);
      show("success", "تمت استعادة الجلسة.");
      reload();
      audit.reload();
    } catch (e) {
      show("error", friendlyError(e));
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="الجلسة"
        breadcrumbs={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الجلسات", href: "/sessions" },
          { label: session ? session.patientName : "جلسة" },
        ]}
        actions={
          session &&
          (session.deletedAt ? (
            <Button variant="outline" onClick={restore}>
              <RotateCcw className="h-4 w-4" aria-hidden />
              استعادة
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setDeleting(true)}>
              <Trash2 className="h-4 w-4" aria-hidden />
              حذف
            </Button>
          ))
        }
      />

      {loading ? (
        <ListSkeleton rows={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !session ? (
        <ErrorState message="الجلسة غير موجودة." />
      ) : (
        <>
          <p className="text-sm text-muted">
            المريض: <Link href={`/patients/${session.patientId}`} className="font-semibold text-secondary">{session.patientName}</Link>
            {session.deletedAt && <Badge tone="danger" className="ms-2">محذوفة</Badge>}
          </p>
          <div className="card p-5 sm:p-8">
            <SessionForm
              initial={toSessionForm(session)}
              lockPatient
              submitLabel="حفظ التعديلات"
              submitting={busy}
              onSubmit={onSubmit}
              onCancel={() => router.back()}
            />
          </div>

          <section className="card p-5">
            <h2 className="mb-3 text-base font-bold text-primary">سجل التعديلات</h2>
            {audit.data && audit.data.length > 0 ? (
              <ul className="divide-y divide-line">
                {audit.data.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                    <span>
                      <Badge tone="info" className="me-2">{ACTION_LABEL[a.action]}</Badge>
                      {a.summary}
                    </span>
                    <span className="text-xs text-muted">{formatDateTime(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">{audit.loading ? "جارٍ التحميل..." : "لا توجد تعديلات مسجلة."}</p>
            )}
          </section>
        </>
      )}

      <Modal
        open={deleting}
        onClose={() => setDeleting(false)}
        title="حذف الجلسة"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleting(false)}>
              إلغاء
            </Button>
            <Button variant="danger" loading={busy} onClick={confirmDelete}>
              حذف الجلسة
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-ink">لن تظهر الجلسة في القوائم، لكنها تبقى محفوظة في السجل الطبي ويمكنك استعادتها.</p>
        <Textarea label="سبب الحذف (اختياري)" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Modal>
    </div>
  );
}
