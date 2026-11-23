import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  FileText,
  Flag,
  LayoutDashboard,
  Building2,
  Library,
  Settings,
  Shapes,
  ShieldCheck,
  SlidersHorizontal,
  Stethoscope,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; primaryOnMobile?: boolean };

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard, primaryOnMobile: true },
  { href: "/patients", label: "المرضى", icon: Users, primaryOnMobile: true },
  { href: "/appointments", label: "المواعيد", icon: CalendarDays, primaryOnMobile: true },
  { href: "/exercises", label: "مكتبة التمارين", icon: Dumbbell, primaryOnMobile: true },
  { href: "/treatment-plans", label: "البرامج العلاجية", icon: ClipboardList },
  { href: "/sessions", label: "الجلسات", icon: Stethoscope },
  { href: "/templates", label: "القوالب", icon: FileText },
  { href: "/reports", label: "التقارير", icon: BarChart3 },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

/** Items only the clinic manager gets; doctors see everything else. Enforcement is in rules/APIs, this is UX. */
export const managerNavItems: NavItem[] = [
  { href: "/team", label: "إدارة الدكاترة", icon: UserCog, primaryOnMobile: true },
  { href: "/clinic", label: "العيادة", icon: Building2 },
];
export const doctorClinicItem: NavItem = { href: "/clinic", label: "العيادة", icon: Building2 };

export function navFor(role: "manager" | "doctor" | null): NavItem[] {
  const base = navItems.filter((i) => i.href !== "/settings");
  const settings = navItems.filter((i) => i.href === "/settings");
  if (role === "manager") {
    // dashboard, patients, team, appointments first on mobile
    const [dash, pat, ...rest] = base;
    return [dash, pat, managerNavItems[0], ...rest.map((i) => ({ ...i, primaryOnMobile: i.href === "/appointments" })), managerNavItems[1], ...settings];
  }
  return [...base, doctorClinicItem, ...settings];
}

export const adminNavItems: NavItem[] = [
  { href: "/admin", label: "نظرة عامة", icon: ShieldCheck, primaryOnMobile: true },
  { href: "/admin/doctors", label: "الدكاترة", icon: UserCog, primaryOnMobile: true },
  { href: "/admin/exercises", label: "المكتبة العامة", icon: Library, primaryOnMobile: true },
  { href: "/admin/categories", label: "التصنيفات", icon: Shapes },
  { href: "/admin/reports", label: "البلاغات", icon: Flag },
  { href: "/admin/settings", label: "إعدادات المنصة", icon: SlidersHorizontal },
];
