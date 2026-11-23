"use client";

import { useRef, useState } from "react";
import { Eye, FileText, FileUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { DynamicForm, formatValue, validateValues, type FormValues } from "@/components/templates/dynamic-form";
import { useLoad } from "@/hooks/use-load";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { friendlyError } from "@/lib/utils/errors";
import { ALLOWED_TYPES, listPatientFiles, MAX_FILE_BYTES, openPatientFile, removePatientFile, uploadPatientFile } from "@/services/files.service";
import { updatePatientNotes } from "@/services/patients.service";
import { createRecord, getRecordsForPatient, getTemplates } from "@/services/templates.service";
import type { Patient, PatientFile, RecordDoc, Template } from "@/types/models";

const sizeLabel = (b: number) => (b > 1_048_576 ? `${(b / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export function NotesTab({ patient, onChanged }: { patient: Patient; onChanged: () => void }) {
  const { show } = useToast();
  const confirm = useConfirm();
  const archived = patient.status === "archived";

  /* ---- private notes ---- */
  const [notes, setNotes] = useState(patient.notes);
  const [savingNotes, setSavingNotes] = useState(false);
  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      await updatePatientNotes(patient.id, notes.trim());
      show("success", "تم حفظ الملاحظات.");
      onChanged();
    } catch (e) {
      show("error", friendlyError(e));
    } finally {
      setSavingNotes(false);
    }
  };

  /* ---- records from templates ---- */
  const records = useLoad(() => getRecordsForPatient(patient.id), [patient.id]);
  const [picking, setPicking] = useState(false);
  const templates = useLoad(() => getTemplates(), [], picking);
  const [template, setTemplate] = useState<Template | null>(null);
  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savingRecord, setSavingRecord] = useState(false);
  const [viewing, setViewing] = useState<RecordDoc | null>(null);

  const saveRecord = async () => {
    if (!template) return;
    const found = validateValues(template.fields, values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSavingRecord(true);
    try {
      await createRecord({ patientId: patient.id, patientName: patient.fullName, template, values });
      show("success", "تم حفظ السجل.");
      setTemplate(null);
      setPicking(false);
      setValues({});
      records.reload();
    } catch (e) {
      show("error", friendlyError(e));
    } finally {
      setSavingRecord(false);
    }
  };

  /* ---- private files ---- */
  const files = useLoad(() => listPatientFiles(patient.id), [patient.id]);
  const input = useRef<HTMLInputElement>(null);
  const [consent, setConsent] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) return show("error", "الأنواع المسموحة: PDF أو صور JPG وPNG وWebP.");
    if (file.size > MAX_FILE_BYTES) return show("error", "حجم الملف يتجاوز 10 ميجابايت.");
    setProgress(0);
    try {
      await uploadPatientFile(patient.id, file, consent, setProgress);
      show("success", "تم رفع الملف بشكل خاص.");
      files.reload();
    } catch (err) {
      show("error", friendlyError(err));
    } finally {
      setProgress(null);
    }
  };

  const openFile = async (f: PatientFile) => {
    try {
      await openPatientFile(f);
    } catch (e) {
      show("error", friendlyError(e));
    }
  };

  const removeFile = async (f: PatientFile) => {
    const ok = await confirm({ title: "حذف الملف", message: `سيتم حذف الملف «${f.name}» نهائيًا من التخزين. تبقى عملية الحذف مسجلة في سجل التعديلات.`, confirmLabel: "حذف", danger: true });
    if (!ok) return;
    try {
      await removePatientFile(f);
      show("success", "تم حذف الملف.");
      files.reload();
    } catch (e) {
      show("error", friendlyError(e));
    }
  };

  return (
    <div className="space-y-4">
      <section className="card space-y-3 p-5">
        <h2 className="text-base font-bold text-primary">ملاحظات الدكتور</h2>
        <p className="text-xs text-muted">خاصة بك فقط، ولا تظهر للمريض في رابط البرنامج.</p>
        <Textarea label="الملاحظات" value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} />
        <div className="flex justify-end">
          <Button onClick={saveNotes} loading={savingNotes} disabled={notes.trim() === patient.notes.trim()}>
            حفظ الملاحظات
          </Button>
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-primary">السجلات والتقييمات</h2>
          {!archived && (
            <Button variant="outline" size="sm" onClick={() => setPicking(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              استخدام قالب
            </Button>
          )}
        </div>
        {records.loading ? (
          <p className="text-sm text-muted">جارٍ التحميل...</p>
        ) : (records.data ?? []).length === 0 ? (
          <p className="text-sm text-muted">لم يتم إنشاء سجلات من القوالب بعد.</p>
        ) : (
          <ul className="divide-y divide-line">
            {records.data!.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{r.templateName}</p>
                  <p className="text-xs text-muted">{formatDateTime(r.createdAt)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setViewing(r)}>
                  <Eye className="h-4 w-4" aria-hidden />
                  عرض
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="text-base font-bold text-primary">الملفات والتقارير الطبية</h2>
        <p className="text-xs leading-6 text-muted">
          تُحفظ الملفات في تخزين خاص لا يمكن الوصول إليه إلا من حسابك، ولا يوجد لها رابط عام. PDF أو صور حتى 10 ميجابايت.
        </p>
        {!archived && (
          <div className="space-y-2 rounded-xl bg-canvas p-3">
            <Checkbox label="أؤكد حصولي على موافقة المريض على حفظ هذا الملف" checked={consent} onChange={setConsent} />
            <input ref={input} type="file" accept={ALLOWED_TYPES.join(",")} className="hidden" onChange={onPick} />
            <Button variant="outline" disabled={!consent || progress !== null} onClick={() => input.current?.click()}>
              <FileUp className="h-4 w-4" aria-hidden />
              {progress !== null ? `جارٍ الرفع ${progress}%` : "رفع ملف"}
            </Button>
          </div>
        )}
        {files.loading ? (
          <p className="text-sm text-muted">جارٍ التحميل...</p>
        ) : (files.data ?? []).length === 0 ? (
          <p className="text-sm text-muted">لا توجد ملفات.</p>
        ) : (
          <ul className="divide-y divide-line">
            {files.data!.map((f) => (
              <li key={f.id} className="flex items-center gap-3 py-3">
                <FileText className="h-5 w-5 shrink-0 text-secondary" aria-hidden />
                <button onClick={() => openFile(f)} className="min-w-0 flex-1 text-start">
                  <p className="truncate text-sm font-semibold text-ink">{f.name}</p>
                  <p className="text-xs text-muted">{sizeLabel(f.size)} · {formatDate(f.createdAt)}</p>
                </button>
                <button onClick={() => removeFile(f)} className="grid h-10 w-10 place-items-center rounded-xl text-danger hover:bg-danger/5" aria-label="حذف الملف">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
        open={picking}
        onClose={() => {
          setPicking(false);
          setTemplate(null);
        }}
        title={template ? template.name : "اختر قالبًا"}
        size="lg"
        footer={
          template && (
            <>
              <Button variant="outline" onClick={() => setTemplate(null)}>
                رجوع
              </Button>
              <Button loading={savingRecord} onClick={saveRecord}>
                حفظ السجل
              </Button>
            </>
          )
        }
      >
        {!template ? (
          <Select
            label="القالب"
            placeholder={templates.loading ? "جارٍ التحميل..." : "اختر"}
            value=""
            options={(templates.data ?? []).map((t) => ({ value: t.id, label: t.name }))}
            onChange={(e) => {
              setTemplate((templates.data ?? []).find((t) => t.id === e.target.value) ?? null);
              setValues({});
              setErrors({});
            }}
          />
        ) : (
          <DynamicForm fields={template.fields} values={values} errors={errors} onChange={(id, v) => setValues((s) => ({ ...s, [id]: v }))} />
        )}
      </Modal>

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title={viewing?.templateName ?? ""} size="lg">
        {viewing && (
          <dl className="space-y-3">
            {viewing.templateSnapshot.fields.map((f) => (
              <div key={f.id}>
                <dt className="text-xs font-semibold text-muted">{f.label}</dt>
                <dd className="whitespace-pre-line text-sm text-ink">{formatValue(f, viewing.values[f.id])}</dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>
    </div>
  );
}
