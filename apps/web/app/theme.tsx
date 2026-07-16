"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";

export type AppThemeId = "prij-heritage" | "clinic-premium" | "lavender" | "rose" | "minimal-clean" | "compact-operations" | "high-contrast";

export type ThemeConfiguration = { accent: string; sidebar: "light" | "dark" | "accent"; typography: "system" | "clinical" | "arabic-friendly"; fontScale: number; density: "compact" | "comfortable"; cardRadius: number; shadow: "none" | "soft" | "strong"; border: "subtle" | "clear"; tableDensity: "compact" | "comfortable"; iconDensity: "minimal" | "standard"; reducedMotion: boolean; contrast: "standard" | "high" };

export type AppTheme = {
  id: AppThemeId;
  name: string;
  description: string;
  tone: string;
  configuration: ThemeConfiguration;
};

const baseConfiguration: ThemeConfiguration = { accent: "#0f766e", sidebar: "dark", typography: "system", fontScale: 1, density: "comfortable", cardRadius: 12, shadow: "soft", border: "subtle", tableDensity: "compact", iconDensity: "standard", reducedMotion: false, contrast: "standard" };

export const themes: AppTheme[] = [
  {
    id: "prij-heritage",
    name: "Dr Maged Premium",
    description: "Warm paper workspace, ink sidebar, teal actions, terracotta active state, and patient-file-first clinic patterns.",
    tone: "Premium clinic",
    configuration: { ...baseConfiguration, accent: "#9a5b3f", sidebar: "dark", typography: "arabic-friendly" }
  },
  {
    id: "clinic-premium",
    name: "Clinical Green",
    description: "Modern clinical workspace with sidebar navigation and calm teal accents.",
    tone: "Clinical green",
    configuration: { ...baseConfiguration, accent: "#087f5b" }
  },
  {
    id: "lavender",
    name: "Lavender",
    description: "Calm violet accents with a light clinical surface.",
    tone: "Calm workspace",
    configuration: { ...baseConfiguration, accent: "#7c3aed", sidebar: "accent" }
  },
  {
    id: "rose",
    name: "Rose",
    description: "Warm rose accents for women’s health workspaces.",
    tone: "Warm clinical",
    configuration: { ...baseConfiguration, accent: "#be185d", sidebar: "accent" }
  },
  {
    id: "minimal-clean",
    name: "Minimal White",
    description: "Mostly white and slate, with less visual weight for daily use.",
    tone: "Quiet daily use",
    configuration: { ...baseConfiguration, accent: "#334155", sidebar: "light", shadow: "none", cardRadius: 6 }
  },
  {
    id: "compact-operations",
    name: "Compact Operations",
    description: "Denser spacing for reception, queue, billing, and admin work.",
    tone: "Dense operations",
    configuration: { ...baseConfiguration, density: "compact", cardRadius: 6, tableDensity: "compact", iconDensity: "minimal" }
  },
  {
    id: "high-contrast",
    name: "High Contrast",
    description: "Strong borders, high contrast, and reduced decoration for accessibility.",
    tone: "Accessible contrast",
    configuration: { ...baseConfiguration, accent: "#005fcc", shadow: "none", border: "clear", contrast: "high" }
  }
];

const fallbackTheme: AppThemeId = "prij-heritage";
const legacyThemeIds: Record<string, AppThemeId> = {
  default: "prij-heritage",
  "dr-maged-premium": "prij-heritage",
  "prij-premium": "prij-heritage",
  "clinical-green": "clinic-premium",
  "minimal-white": "minimal-clean"
};

type ThemeContextValue = {
  theme: AppThemeId;
  doctorComfortMode: boolean;
  setTheme: (theme: AppThemeId) => void;
  configuration: ThemeConfiguration;
  setConfiguration: (configuration: ThemeConfiguration) => void;
  setDoctorComfortMode: (enabled: boolean) => void;
  resetTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppThemeId>(fallbackTheme);
  const [doctorComfortMode, setDoctorComfortModeState] = useState(false);
  const [configuration, setConfigurationState] = useState<ThemeConfiguration>(themes.find((item) => item.id === fallbackTheme)!.configuration);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("prijClinicTheme");
    const resolvedStoredTheme = resolveThemeId(storedTheme);
    if (storedTheme && resolvedStoredTheme) {
      const selected = getTheme(resolvedStoredTheme);
      setThemeState(selected.id);
      setConfigurationState(readConfiguration(window.localStorage.getItem("prijClinicThemeConfiguration"), selected.configuration));
      if (storedTheme !== selected.id) window.localStorage.setItem("prijClinicTheme", selected.id);
    } else if (storedTheme) {
      window.localStorage.removeItem("prijClinicTheme");
      window.localStorage.removeItem("prijClinicThemeConfiguration");
    }
    if (!resolvedStoredTheme) void fetch(`${getApiBaseUrl()}/users/me/preferences/appearance`, { credentials: "include" }).then(async (response) => response.ok ? response.json() as Promise<{ appearance?: unknown }> : null).then((resolved) => {
      const appearance = isRecord(resolved?.appearance) ? resolved.appearance : null;
      const accountTheme = resolveThemeId(appearance?.themeId);
      if (accountTheme) { const selected = getTheme(accountTheme); setThemeState(selected.id); setConfigurationState(sanitizeThemeConfiguration(appearance, selected.configuration)); }
    }).catch(() => undefined);
    setDoctorComfortModeState(window.localStorage.getItem("prijDoctorComfortMode") === "enabled");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.sidebar = configuration.sidebar;
    document.documentElement.dataset.density = configuration.density;
    document.documentElement.dataset.contrast = configuration.contrast;
    document.documentElement.dataset.reducedMotion = configuration.reducedMotion ? "true" : "false";
    document.documentElement.style.setProperty("--accent", configuration.accent);
    document.documentElement.style.setProperty("--font-scale", String(configuration.fontScale));
    document.documentElement.style.setProperty("--theme-card-radius", `${configuration.cardRadius}px`);
  }, [configuration, theme]);

  useEffect(() => {
    document.documentElement.dataset.doctorComfortMode = doctorComfortMode ? "enabled" : "disabled";
  }, [doctorComfortMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      configuration,
      doctorComfortMode,
      setTheme(nextTheme) {
        const selected = getTheme(resolveThemeId(nextTheme) ?? fallbackTheme);
        setThemeState(selected.id);
        setConfigurationState(selected.configuration);
        window.localStorage.setItem("prijClinicTheme", selected.id);
      },
      setConfiguration(nextConfiguration) { const safe = sanitizeThemeConfiguration(nextConfiguration, getTheme(theme).configuration); setConfigurationState(safe); window.localStorage.setItem("prijClinicThemeConfiguration", JSON.stringify(safe)); },
      setDoctorComfortMode(enabled) {
        setDoctorComfortModeState(enabled);
        window.localStorage.setItem("prijDoctorComfortMode", enabled ? "enabled" : "disabled");
      },
      resetTheme() {
        setThemeState(fallbackTheme);
        setConfigurationState(getTheme(fallbackTheme).configuration);
        window.localStorage.removeItem("prijClinicTheme");
        window.localStorage.removeItem("prijClinicThemeConfiguration");
      }
    }),
    [configuration, doctorComfortMode, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function readConfiguration(raw: string | null, fallback: ThemeConfiguration) { try { return sanitizeThemeConfiguration(raw ? JSON.parse(raw) : {}, fallback); } catch { return fallback; } }

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("ThemeProvider is required.");
  }
  return context;
}

export function isThemeId(value: unknown): value is AppThemeId {
  return typeof value === "string" && themes.some((theme) => theme.id === value);
}

export function resolveThemeId(value: unknown): AppThemeId | null {
  if (isThemeId(value)) return value;
  return typeof value === "string" ? legacyThemeIds[value.trim().toLowerCase()] ?? null : null;
}

export function getTheme(value: unknown): AppTheme {
  const id = resolveThemeId(value) ?? fallbackTheme;
  return themes.find((theme) => theme.id === id) ?? themes[0]!;
}

export function sanitizeThemeConfiguration(value: unknown, fallback: ThemeConfiguration): ThemeConfiguration {
  const candidate = isRecord(value) ? value : {};
  return {
    accent: typeof candidate.accent === "string" && /^#[0-9a-f]{6}$/i.test(candidate.accent) ? candidate.accent : fallback.accent,
    sidebar: oneOf(candidate.sidebar, ["light", "dark", "accent"], fallback.sidebar),
    typography: oneOf(candidate.typography, ["system", "clinical", "arabic-friendly"], fallback.typography),
    fontScale: boundedNumber(candidate.fontScale, 0.8, 1.5, fallback.fontScale),
    density: oneOf(candidate.density, ["compact", "comfortable"], fallback.density),
    cardRadius: boundedNumber(candidate.cardRadius, 0, 32, fallback.cardRadius),
    shadow: oneOf(candidate.shadow, ["none", "soft", "strong"], fallback.shadow),
    border: oneOf(candidate.border, ["subtle", "clear"], fallback.border),
    tableDensity: oneOf(candidate.tableDensity, ["compact", "comfortable"], fallback.tableDensity),
    iconDensity: oneOf(candidate.iconDensity, ["minimal", "standard"], fallback.iconDensity),
    reducedMotion: typeof candidate.reducedMotion === "boolean" ? candidate.reducedMotion : fallback.reducedMotion,
    contrast: oneOf(candidate.contrast, ["standard", "high"], fallback.contrast)
  };
}

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function boundedNumber(value: unknown, min: number, max: number, fallback: number) { return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max ? value : fallback; }
function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T { return typeof value === "string" && allowed.includes(value as T) ? value as T : fallback; }

