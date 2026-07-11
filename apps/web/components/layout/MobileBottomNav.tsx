"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThreeDMedicalIcon, type IconName } from "../ThreeDMedicalIcon";

export type MobileNavItem = { key: string; href: string; label: string; labelAr: string; icon: IconName };
export const doctorMinimalisticNav: MobileNavItem[] = [
  { key: "today", href: "/doctor", label: "Today", labelAr: "اليوم", icon: "calendar" },
  { key: "search", href: "/patients", label: "Search", labelAr: "بحث", icon: "search" },
  { key: "new-patient", href: "/patients/new?source=doctor-quick-create", label: "New Patient", labelAr: "مريضة جديدة", icon: "patients" },
  { key: "current-visit", href: "/doctor/visit", label: "Current Visit", labelAr: "الزيارة الحالية", icon: "encounter" },
  { key: "account", href: "/admin/appearance", label: "Account", labelAr: "الحساب", icon: "settings" }
];
export const receptionistMinimalisticNav: MobileNavItem[] = [
  { key: "today", href: "/reception/today", label: "Today", labelAr: "اليوم", icon: "calendar" },
  { key: "search", href: "/patients", label: "Search", labelAr: "بحث", icon: "search" },
  { key: "new-patient", href: "/patients/new", label: "New Patient", labelAr: "مريضة جديدة", icon: "patients" },
  { key: "queue", href: "/queue", label: "Queue", labelAr: "الانتظار", icon: "queue" },
  { key: "account", href: "/admin/appearance", label: "Account", labelAr: "الحساب", icon: "settings" }
];

export function MobileBottomNav({ items, arabic = false }: { items: MobileNavItem[]; arabic?: boolean }) {
  const pathname = usePathname();
  return <nav className="mobile-bottom-nav" aria-label={arabic ? "التنقل الرئيسي" : "Primary mobile navigation"} dir={arabic ? "rtl" : "ltr"}>{items.map((item) => <Link aria-current={pathname === item.href ? "page" : undefined} className={pathname === item.href ? "active" : ""} href={item.href} key={item.key}><ThreeDMedicalIcon name={item.icon} size="sm" /><span>{arabic ? item.labelAr : item.label}</span></Link>)}</nav>;
}
