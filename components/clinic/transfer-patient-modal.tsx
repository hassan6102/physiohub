"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/utils/errors";
import { canBeAssigned, transferPatient, type Member } from "@/services/team.service";

/** Manager-only. Moves the responsibility for a patient; nothing is deleted and authors are kept. */
export function TransferPatientModal({
  open,
  onClose,
  patient,
  team,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  patient: { id: string; fullName: string; assignedDoctorId?: string } | null;
  team: Member[];
  onDone: () => void;
}) {
  const { show } = useToast();
  const [to, setTo] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const options = team.filter((m) => canBeAssigned(m) && m.id !== patient?.assignedDoctorId).map((m) => ({ value: m.id, label: m.fullName }));
  const current = team.find((m) => m.id === patient?.assignedDoctorId)?.fullName ?? "—";
  const target = team.find((m) => m.id === to)?.fullName ?? "";

  const close = () => {
    setTo("");
    setConfirming(false);
    onClose();
  };

  const run = async () => {
    if (!patient || !to) return;
    setBusy(true);
    try {
      await transferPatient(patient.id, to);
      show("success", `تم نقل ${patient.fullName} إلى ${target}.`);
      close();
      onDone();
    } catch (e) {
      show("error", friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open && Boolean(patient)}
      onClose={close}
      title="نقل المريض إلى دكتور آخر"
      size="sm"
      footer={
        confirming ? (
          <>
            <Button variant="outline" onClick={() => setConfirming(false)} disabled={busy}>رجوع</Button>
            <Button onClick={run} loading={busy}>تأكيد النقل</Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={close}>إلغاء</Button>
            <Button onClick={() => setConfirming(true)} disabled={!to}>
              <ArrowLeftRight className="h-4 w-4" aria-hidden />
              متابعة
            </Button>
          </>
        )
      }
    >
      {confirming ? (
        <div className="space-y-3 text-sm leading-7 text-ink">
          <p>
            سيتم نقل <b>{patient?.fullName}</b> من <b>{current}</b> إلى <b>{target}</b>.
          </p>
          <ul className="list-disc space-y-1 ps-5 text-muted">
            <li>يختفي المريض من قائمة الدكتور السابق ويظهر عند الدكتور الجديد.</li>
            <li>تبقى كل البيانات والجلسات والبرامج والمواعيد محفوظة دون حذف.</li>
            <li>تبقى الجلسات منسوبة للدكتور الذي نفّذها.</li>
            <li>تُسجَّل العملية في سجل التدقيق.</li>
          </ul>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            الدكتور الحالي: <b className="text-ink">{current}</b>
          </p>
          {options.length === 0 ? (
            <p className="text-sm text-warning">لا يوجد دكتور آخر نشط في العيادة لنقل المريض إليه.</p>
          ) : (
            <Select label="الدكتور الجديد" required placeholder="اختر الدكتور" options={options} value={to} onChange={(e) => setTo(e.target.value)} />
          )}
        </div>
      )}
    </Modal>
  );
}
