"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select, Textarea, TextInput } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { PatientSelect } from "@/components/shared/patient-select";
import { APPOINTMENT_STATUS } from "@/lib/constants";
import { formatTime, fromInputDateTime, toInputDateTime } from "@/lib/utils/date";
import { friendlyError } from "@/lib/utils/errors";
import { createAppointment, findConflicts, updateAppointment } from "@/services/appointments.service";
import type { Appointment, AppointmentStatus } from "@/types/models";

const DURATIONS = [15, 30, 45, 60, 90, 120].map((n) => ({ value: String(n), label: `${n} دقيقة` }));

export function AppointmentForm({
  open,
  onClose,
  onSaved,
  appointment,
  defaultDate,
  defaultPatientId,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  appointment?: Appointment | null;
  defaultDate?: Date;
  defaultPatientId?: string;
}) {
  // The parent remounts this component through `key`, so initial state is enough.
  const { show } = useToast();
  const base = appointment?.startsAt ?? (defaultDate ? new Date(new Date(defaultDate).setHours(10, 0, 0, 0)) : new Date());
  const [patientId, setPatientId] = useState(appointment?.patientId ?? defaultPatientId ?? "");
  const [patientName, setPatientName] = useState(appointment?.patientName ?? "");
  const [when, setWhen] = useState(toInputDateTime(base));
  const [duration, setDuration] = useState(String(appointment?.durationMin ?? 45));
  const [status, setStatus] = useState<AppointmentStatus>(appointment?.status ?? "scheduled");
  const [notes, setNotes] = useState(appointment?.notes ?? "");
  const [error, setError] = useState("");
  const [conflicts, setConflicts] = useState<Appointment[]>([]);
  const [saving, setSaving] = useState(false);

  const save = async (ignoreConflicts = false) => {
    const startsAt = fromInputDateTime(when);
    if (!patientId) return setError("اختر المريض.");
    if (!startsAt) return setError("حدد التاريخ والوقت.");
    setError("");
    setSaving(true);
    try {
      if (!ignoreConflicts) {
        const c = await findConflicts(startsAt, Number(duration), appointment?.id);
        if (c.length) {
          setConflicts(c);
          setSaving(false);
          return;
        }
      }
      let name = patientName;
      if (!name && appointment) name = appointment.patientName;
      const data = { patientId, patientName: name, startsAt, durationMin: Number(duration), status, notes: notes.trim() };
      if (appointment) await updateAppointment(appointment.id, data);
      else await createAppointment(data);
      show("success", "تم حفظ الموعد.");
      onSaved();
      onClose();
    } catch (e) {
      show("error", friendlyError(e));
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={appointment ? "تعديل الموعد" : "موعد جديد"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          {conflicts.length > 0 ? <Button onClick={() => save(true)} disabled={saving}>حفظ رغم التعارض</Button> : <Button onClick={() => save()} disabled={saving}>حفظ</Button>}
        </>
      }
    >
      <div className="space-y-4">
        <PatientSelect value={patientId} disabled={Boolean(appointment)} onChange={(id, n) => { setPatientId(id); setPatientName(n); }} error={error && !patientId ? error : undefined} />
        <TextInput label="التاريخ والوقت" type="datetime-local" dir="ltr" value={when} onChange={(e) => { setWhen(e.target.value); setConflicts([]); }} error={error && patientId ? error : undefined} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="المدة" value={duration} onChange={(e) => { setDuration(e.target.value); setConflicts([]); }} options={DURATIONS} />
          <Select label="الحالة" value={status} onChange={(e) => setStatus(e.target.value as AppointmentStatus)} options={Object.entries(APPOINTMENT_STATUS).map(([value, v]) => ({ value, label: v.label }))} />
        </div>
        <Textarea label="ملاحظات" value={notes} onChange={(e) => setNotes(e.target.value)} />
        {conflicts.length > 0 && (
          <div className="flex gap-2 rounded-xl bg-warning/10 p-3 text-sm" role="alert">
            <AlertTriangle className="h-5 w-5 shrink-0 text-warning" aria-hidden />
            <div>
              <p className="font-bold">يوجد تعارض مع مواعيد أخرى:</p>
              <ul className="list-disc ps-5">{conflicts.map((c) => <li key={c.id}>{c.patientName} — {formatTime(c.startsAt)}</li>)}</ul>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
