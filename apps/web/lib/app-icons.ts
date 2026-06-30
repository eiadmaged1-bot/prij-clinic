import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Ambulance,
  ArchiveRestore,
  BadgeDollarSign,
  Bell,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  CreditCard,
  FileArchive,
  FileHeart,
  FilePlus2,
  FileText,
  FlaskConical,
  HeartPulse,
  Hospital,
  LayoutDashboard,
  LockKeyhole,
  MessageCircle,
  Microscope,
  Package,
  Pill,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
  Tablet,
  TestTube2,
  UserCog,
  UserPlus,
  Users,
  WalletCards
} from "lucide-react";

export type AppIconName =
  | "dashboard"
  | "patients"
  | "new-patient"
  | "calendar"
  | "appointments"
  | "queue"
  | "doctor-mode"
  | "encounters"
  | "prescriptions"
  | "medication-center"
  | "drug-market"
  | "medication-safety"
  | "allergies"
  | "investigations"
  | "lab-orders"
  | "radiology"
  | "reports"
  | "pregnancy"
  | "ultrasound"
  | "gynecology"
  | "protocol-atlas"
  | "ai-drafts"
  | "guideline-center"
  | "billing"
  | "payments"
  | "invoices"
  | "daily-closing"
  | "finance-reports"
  | "consents"
  | "attachments"
  | "timeline"
  | "owner-control"
  | "settings"
  | "users-roles"
  | "audit-logs"
  | "backup-restore"
  | "security"
  | "support"
  | "whatsapp"
  | "inventory"
  | "analytics"
  | "search";

export type IconTone = "teal" | "navy" | "violet" | "amber" | "rose" | "slate" | "green" | "cyan";

export type AppIconDefinition = {
  name: AppIconName;
  label: string;
  icon: LucideIcon;
  tone: IconTone;
};

export const appIcons: Record<AppIconName, AppIconDefinition> = {
  dashboard: { name: "dashboard", label: "Dashboard", icon: LayoutDashboard, tone: "teal" },
  patients: { name: "patients", label: "Patients", icon: Users, tone: "teal" },
  "new-patient": { name: "new-patient", label: "New Patient", icon: UserPlus, tone: "green" },
  calendar: { name: "calendar", label: "Calendar", icon: CalendarDays, tone: "cyan" },
  appointments: { name: "appointments", label: "Appointments", icon: Clock3, tone: "cyan" },
  queue: { name: "queue", label: "Queue", icon: ClipboardList, tone: "amber" },
  "doctor-mode": { name: "doctor-mode", label: "Doctor Mode", icon: Stethoscope, tone: "navy" },
  encounters: { name: "encounters", label: "Encounters", icon: FileHeart, tone: "navy" },
  prescriptions: { name: "prescriptions", label: "Prescriptions", icon: Pill, tone: "rose" },
  "medication-center": { name: "medication-center", label: "Medication Center", icon: Tablet, tone: "rose" },
  "drug-market": { name: "drug-market", label: "Drug Market", icon: Package, tone: "amber" },
  "medication-safety": { name: "medication-safety", label: "Medication Safety", icon: ShieldCheck, tone: "green" },
  allergies: { name: "allergies", label: "Allergies", icon: Bell, tone: "rose" },
  investigations: { name: "investigations", label: "Investigations", icon: FlaskConical, tone: "violet" },
  "lab-orders": { name: "lab-orders", label: "Lab Orders", icon: TestTube2, tone: "violet" },
  radiology: { name: "radiology", label: "Radiology", icon: Activity, tone: "cyan" },
  reports: { name: "reports", label: "Reports", icon: FileText, tone: "slate" },
  pregnancy: { name: "pregnancy", label: "Pregnancy", icon: HeartPulse, tone: "rose" },
  ultrasound: { name: "ultrasound", label: "Ultrasound", icon: Microscope, tone: "violet" },
  gynecology: { name: "gynecology", label: "Gynecology", icon: Hospital, tone: "teal" },
  "protocol-atlas": { name: "protocol-atlas", label: "Protocol Atlas", icon: ClipboardCheck, tone: "green" },
  "ai-drafts": { name: "ai-drafts", label: "AI Drafts", icon: Sparkles, tone: "violet" },
  "guideline-center": { name: "guideline-center", label: "Guideline Center", icon: FileArchive, tone: "green" },
  billing: { name: "billing", label: "Billing", icon: ReceiptText, tone: "amber" },
  payments: { name: "payments", label: "Payments", icon: CreditCard, tone: "green" },
  invoices: { name: "invoices", label: "Invoices", icon: BadgeDollarSign, tone: "amber" },
  "daily-closing": { name: "daily-closing", label: "Daily Closing", icon: WalletCards, tone: "green" },
  "finance-reports": { name: "finance-reports", label: "Finance Reports", icon: ClipboardList, tone: "navy" },
  consents: { name: "consents", label: "Consents", icon: ShieldCheck, tone: "green" },
  attachments: { name: "attachments", label: "Attachments", icon: FilePlus2, tone: "slate" },
  timeline: { name: "timeline", label: "Timeline", icon: Activity, tone: "cyan" },
  "owner-control": { name: "owner-control", label: "Owner Control Center", icon: UserCog, tone: "violet" },
  settings: { name: "settings", label: "Settings", icon: UserCog, tone: "slate" },
  "users-roles": { name: "users-roles", label: "Users and Roles", icon: Users, tone: "violet" },
  "audit-logs": { name: "audit-logs", label: "Audit Logs", icon: ClipboardCheck, tone: "slate" },
  "backup-restore": { name: "backup-restore", label: "Backup and Restore", icon: ArchiveRestore, tone: "green" },
  security: { name: "security", label: "Security", icon: LockKeyhole, tone: "navy" },
  support: { name: "support", label: "Support", icon: Ambulance, tone: "cyan" },
  whatsapp: { name: "whatsapp", label: "WhatsApp placeholder", icon: MessageCircle, tone: "green" },
  inventory: { name: "inventory", label: "Inventory placeholder", icon: Package, tone: "amber" },
  analytics: { name: "analytics", label: "Analytics placeholder", icon: Activity, tone: "cyan" },
  search: { name: "search", label: "Search", icon: Search, tone: "slate" }
};
