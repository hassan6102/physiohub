"use client";

import Link from "next/link";
import { ClipboardList, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLAN_STATUS } from "@/lib/constants";
import { useLoad } from "@/hooks/use-load";
import { ageFromBirth, formatDate, relativeDays } from "@/lib/utils/date";
import { getDocs, limit, query } from "firebase/firestore";
import { plansForPatientQuery } from "@/services/plans.service";
import { countSessionsForPatient } from "@/services/sessions.service";
import { fromSnap } from "@/services/base";
import type { Patient, TreatmentPlan } from "@/types/models";

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-ink">{value || "—"}</dd>
    </div>
  );
}

export function OverviewTab({ patient }: { patient: Patient }) {
  const count = useLoad(() => countSessionsForPatient(patient.id), [patient.id]);
  const plans = useLoad(async () => {
    const snap = await getDocs(query(plansForPatientQuery(patient.id), limit(5)));
    return snap.docs.map((d) => fromSnap<TreatmentPlan>(d));
  }, [patient.id]);
  const age = ageFromBirth(patient.birthDate);
  const current = (plans.data ?? []).filter((p) => p.status === "published");

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="card p-5 lg:col-span-2">
        <h2 className="mb-4 text-base font-bold text-primary">بيانات المريض</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Info label="رقم الهاتف" value={<span dir="ltr">{patient.phone}</span>} />
          <Info label="البريد الإلكتروني" value={patient.email && <span dir="ltr">{patient.email}</span>} />
          <Info label="العمر" value={age !== null ? `${age} سنة` : ""} />
          <Info label="الجنس" value={patient.gender === "female" ? "أنثى" : "ذكر"} />
          <Info label="العنوان" value={patient.address} />
          <Info label="تاريخ الميلاد" value={patient.birthDate ? formatDate(patient.birthDate) : ""} />
          <div className="sm:col-span-2">
            <Info label="الشكوى الرئيسية" value={patient.chiefComplaint} />
          </div>
          <Info label="التشخيص" value={patient.diagnosis} />
          <Info label="أهداف العلاج" value={patient.treatmentGoals} />
        </dl>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="text-base font-bold text-primary">ملخص</h2>
        <dl className="grid grid-cols-2 gap-4">
          <Info label="عدد الجلسات" value={count.loading ? "..." : String(count.data ?? 0)} />
          <Info label="أول زيارة" value={formatDate(patient.createdAt)} />
          <Info label="آخر زيارة" value={patient.lastVisitAt ? `${formatDate(patient.lastVisitAt)} (${relativeDays(patient.lastVisitAt)})` : "لا توجد جلسات"} />
        </dl>
        <div className="flex flex-col gap-2">
          <Link href={`/sessions/new?patientId=${patient.id}`}>
            <Button className="w-full">
              <Stethoscope className="h-4 w-4" aria-hidden />
              تسجيل جلسة
            </Button>
          </Link>
          <Link href={`/treatment-plans/new?patientId=${patient.id}`}>
            <Button variant="outline" className="w-full">
              <ClipboardList className="h-4 w-4" aria-hidden />
              برنامج علاجي جديد
            </Button>
          </Link>
        </div>
      </section>

      <section className="card p-5 lg:col-span-3">
        <h2 className="mb-3 text-base font-bold text-primary">البرامج العلاجية الحالية</h2>
        {plans.loading ? (
          <p className="text-sm text-muted">جارٍ التحميل...</p>
        ) : current.length === 0 ? (
          <p className="text-sm text-muted">لا يوجد برنامج منشور لهذا المريض.</p>
        ) : (
          <ul className="divide-y divide-line">
            {current.map((p) => (
              <li key={p.id}>
                <Link href={`/treatment-plans/${p.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-secondary">
                  <span className="font-semibold">{p.title}</span>
                  <Badge tone={PLAN_STATUS[p.status].tone}>{PLAN_STATUS[p.status].label}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
