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
    if (isThemeId(storedTheme)) {
      setThemeState(storedTheme);
      setConfigurationState(readConfiguration(window.localStorage.getItem("prijClinicThemeConfiguration"), themes.find((item) => item.id === storedTheme)!.configuration));
    }
    if (!storedTheme) void fetch(`${getApiBaseUrl()}/users/me/preferences/appearance`, { credentials: "include" }).then(async (response) => response.ok ? response.json() as Promise<{ appearance?: Partial<ThemeConfiguration> & { themeId?: string } }> : null).then((resolved) => { const accountTheme = resolved?.appearance?.themeId; if (isThemeId(accountTheme)) { setThemeState(accountTheme); setConfigurationState({ ...themes.find((item) => item.id === accountTheme)!.configuration, ...resolved?.appearance }); } }).catch(() => undefined);
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
        setThemeState(nextTheme);
        setConfigurationState(themes.find((item) => item.id === nextTheme)!.configuration);
        window.localStorage.setItem("prijClinicTheme", nextTheme);
      },
      setConfiguration(nextConfiguration) { setConfigurationState(nextConfiguration); window.localStorage.setItem("prijClinicThemeConfiguration", JSON.stringify(nextConfiguration)); },
      setDoctorComfortMode(enabled) {
        setDoctorComfortModeState(enabled);
        window.localStorage.setItem("prijDoctorComfortMode", enabled ? "enabled" : "disabled");
      },
      resetTheme() {
        setThemeState(fallbackTheme);
        setConfigurationState(themes.find((item) => item.id === fallbackTheme)!.configuration);
        window.localStorage.removeItem("prijClinicTheme");
        window.localStorage.removeItem("prijClinicThemeConfiguration");
      }
    }),
    [configuration, doctorComfortMode, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function readConfiguration(raw: string | null, fallback: ThemeConfiguration) { try { const value = raw ? JSON.parse(raw) as Partial<ThemeConfiguration> : {}; return { ...fallback, ...value }; } catch { return fallback; } }

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

