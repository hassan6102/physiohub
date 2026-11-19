import { Badge } from "@/components/ui/badge";
import { PATIENT_STATUS } from "@/lib/constants";
import type { PatientStatus } from "@/types/models";

export function PatientStatusBadge({ status }: { status: PatientStatus }) {
  const s = PATIENT_STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
