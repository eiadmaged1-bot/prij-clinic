import type { IconName } from "../components/ThreeDMedicalIcon";

export type NavLink = {
  href: string;
  label: string;
  icon: IconName;
};

export type NavGroup = {
  title: string;
  links: NavLink[];
};

export const navigationGroups: NavGroup[] = [
  {
    title: "Operations",
    links: [
      { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
      { href: "/doctor", label: "Doctor Mode", icon: "doctor" },
      { href: "/patients", label: "Patients", icon: "patients" },
      { href: "/patients/new", label: "New Patient", icon: "patients" },
      { href: "/appointments", label: "Appointments", icon: "calendar" },
      { href: "/calendar", label: "Calendar", icon: "calendar" },
      { href: "/queue", label: "Queue", icon: "queue" }
    ]
  },
  {
    title: "Clinical",
    links: [
      { href: "/doctor/visit", label: "Guided Visit", icon: "encounter" },
      { href: "/protocol-atlas", label: "Protocol Atlas", icon: "ai" },
      { href: "/medications", label: "Medications", icon: "prescription" },
      { href: "/drug-market", label: "Drug Market", icon: "prescription" },
      { href: "/guidelines", label: "Evidence Library", icon: "reports" },
      { href: "/encounters", label: "Visits", icon: "encounter" },
      { href: "/prescriptions", label: "Prescriptions", icon: "prescription" },
      { href: "/investigations", label: "Orders", icon: "investigations" },
      { href: "/reports", label: "Reports", icon: "reports" }
    ]
  },
  {
    title: "OB/Pregnancy",
    links: [
      { href: "/pregnancies", label: "Pregnancy", icon: "pregnancy" },
      { href: "/ultrasound", label: "Ultrasound", icon: "ultrasound" }
    ]
  },
  {
    title: "Finance",
    links: [{ href: "/billing", label: "Billing", icon: "billing" }]
  },
  {
    title: "Safety/Admin",
    links: [
      { href: "/consents", label: "Consents", icon: "consent" },
      { href: "/ai-drafts", label: "AI Draft Review", icon: "ai" }
    ]
  }
];

export const adminNavigationGroup: NavGroup = {
  title: "Admin",
  links: [
    { href: "/admin", label: "Control Center", icon: "admin" },
    { href: "/admin/reference-data", label: "Reference Data", icon: "files" },
    { href: "/admin/medications", label: "Medication Catalog", icon: "prescription" },
    { href: "/admin/drug-market", label: "Drug Market Admin", icon: "prescription" },
    { href: "/admin/protocol-atlas", label: "Protocol Verification", icon: "ai" },
    { href: "/admin/appearance", label: "Appearance", icon: "settings" },
    { href: "/admin/accounts", label: "Accounts", icon: "reception" }
  ]
};

export const portalModules = navigationGroups.flatMap((group) =>
  group.links.map((link) => ({
    ...link,
    category: group.title
  }))
);
