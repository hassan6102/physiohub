"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-provider";
import { getTeam, type Member } from "@/services/team.service";
import { useLoad } from "./use-load";

/** Clinic team for the manager (doctor names, assignable doctors). Doctors cannot list the team. */
export function useTeam() {
  const { role } = useAuth();
  const enabled = role === "manager";
  const { data, loading, error, reload } = useLoad<Member[]>(() => getTeam(), [], enabled);
  const members = data ?? [];
  const names = useMemo(() => new Map(members.map((m) => [m.id, m.fullName])), [members]);
  return { members, names, loading: enabled && loading, error, reload };
}
