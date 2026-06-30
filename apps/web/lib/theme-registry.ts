export type DensityMode = "compact" | "comfortable" | "large" | "magnified";

export type ThemeLayoutVariant = "clinical-shell" | "portal-shell" | "launcher-shell" | "operations-shell";
export type ThemeCardStyle = "glass" | "clean" | "raised" | "dense" | "high-contrast";
export type ThemeSidebarStyle = "navy" | "purple" | "light" | "compact" | "dark";
export type ThemeIconStyle = "premium-3d" | "clean-3d" | "compact-3d" | "high-contrast-3d";

export type AppThemeId =
  | "luxury-clinic"
  | "medicolize-portal"
  | "incision-clean"
  | "compact-operations"
  | "senior-doctor-large"
  | "dark-navy"
  | "clinic-premium"
  | "incision-portal"
  | "minimal-clean";

export type AppThemeDefinition = {
  id: AppThemeId;
  displayName: string;
  description: string;
  accent: string;
  densityDefault: DensityMode;
  supportsDark: boolean;
  layoutVariant: ThemeLayoutVariant;
  cardStyle: ThemeCardStyle;
  sidebarStyle: ThemeSidebarStyle;
  iconStyle: ThemeIconStyle;
  aliases?: AppThemeId[];
};

export const themeRegistry: AppThemeDefinition[] = [
  {
    id: "luxury-clinic",
    displayName: "Luxury Clinic",
    description: "Off-white clinical workspace with deep navy text, teal accents, and readable glass surfaces.",
    accent: "#0f8f8c",
    densityDefault: "comfortable",
    supportsDark: false,
    layoutVariant: "clinical-shell",
    cardStyle: "glass",
    sidebarStyle: "navy",
    iconStyle: "premium-3d",
    aliases: ["clinic-premium", "minimal-clean"]
  },
  {
    id: "medicolize-portal",
    displayName: "Medicolize Portal",
    description: "Original clinic-portal style with a deep purple sidebar, white content, compact badges, and patient search.",
    accent: "#14b8a6",
    densityDefault: "comfortable",
    supportsDark: false,
    layoutVariant: "portal-shell",
    cardStyle: "clean",
    sidebarStyle: "purple",
    iconStyle: "premium-3d"
  },
  {
    id: "incision-clean",
    displayName: "Incision Clean",
    description: "Bright launcher-style workspace with rounded app cards, subtle shadows, and teal/dark borders.",
    accent: "#0f8f8c",
    densityDefault: "comfortable",
    supportsDark: false,
    layoutVariant: "launcher-shell",
    cardStyle: "raised",
    sidebarStyle: "light",
    iconStyle: "clean-3d",
    aliases: ["incision-portal"]
  },
  {
    id: "compact-operations",
    displayName: "Compact Operations",
    description: "Dense but readable layout optimized for reception, queue, billing, and finance workflows.",
    accent: "#0b7f7d",
    densityDefault: "compact",
    supportsDark: false,
    layoutVariant: "operations-shell",
    cardStyle: "dense",
    sidebarStyle: "compact",
    iconStyle: "compact-3d"
  },
  {
    id: "senior-doctor-large",
    displayName: "Senior Doctor Large",
    description: "Larger text, larger controls, higher contrast, and fewer tiny affordances for older doctors.",
    accent: "#075985",
    densityDefault: "large",
    supportsDark: false,
    layoutVariant: "clinical-shell",
    cardStyle: "high-contrast",
    sidebarStyle: "navy",
    iconStyle: "high-contrast-3d"
  },
  {
    id: "dark-navy",
    displayName: "Dark Navy",
    description: "Premium dark clinical UI with readable contrast and no pure black surfaces.",
    accent: "#2dd4bf",
    densityDefault: "comfortable",
    supportsDark: true,
    layoutVariant: "clinical-shell",
    cardStyle: "glass",
    sidebarStyle: "dark",
    iconStyle: "premium-3d"
  }
];

export const legacyThemeAliases: Record<AppThemeId, AppThemeId> = {
  "clinic-premium": "luxury-clinic",
  "minimal-clean": "luxury-clinic",
  "incision-portal": "incision-clean",
  "luxury-clinic": "luxury-clinic",
  "medicolize-portal": "medicolize-portal",
  "incision-clean": "incision-clean",
  "compact-operations": "compact-operations",
  "senior-doctor-large": "senior-doctor-large",
  "dark-navy": "dark-navy"
};

export const importantPatientTabs = [
  "Summary",
  "Medical",
  "Clinical",
  "Appointments",
  "Queue",
  "Encounters",
  "Prescriptions",
  "Medications",
  "Allergies",
  "Investigations",
  "Reports",
  "Pregnancy",
  "Ultrasound",
  "Gynecology",
  "Protocol Atlas",
  "AI Snapshot",
  "Billing",
  "Consents",
  "Files",
  "Timeline"
];

export function normalizeThemeId(value: unknown): AppThemeId {
  if (typeof value !== "string") return "luxury-clinic";
  return legacyThemeAliases[value as AppThemeId] ?? "luxury-clinic";
}

export function isThemeId(value: unknown): value is AppThemeId {
  return typeof value === "string" && value in legacyThemeAliases;
}

export function normalizeDensityMode(value: unknown): DensityMode {
  if (value === "comfort") return "comfortable";
  if (value === "compact" || value === "comfortable" || value === "large" || value === "magnified") return value;
  return "comfortable";
}
