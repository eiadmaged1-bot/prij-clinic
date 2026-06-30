"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type AppThemeId = "clinic-premium" | "medicolize-portal" | "incision-portal" | "minimal-clean" | "compact-operations";
export type DensityMode = "comfortable" | "compact";
export type ScaleMode = "normal" | "magnified";
export type MotionMode = "normal" | "reduced";

export type AppTheme = {
  id: AppThemeId;
  name: string;
  description: string;
  tone: string;
};

export const themes: AppTheme[] = [
  {
    id: "clinic-premium",
    name: "Original Premium",
    description: "Modern clinical workspace with sidebar navigation and calm teal accents.",
    tone: "Premium clinic"
  },
  {
    id: "medicolize-portal",
    name: "Clinic Portal",
    description: "Owner-focused operating portal with a dark sidebar, search top bar, compact badges, and patient-centered navigation.",
    tone: "Owner portal"
  },
  {
    id: "incision-portal",
    name: "Incision Portal",
    description: "Clean app launcher cards with a simple top header and rounded tiles.",
    tone: "Portal cards"
  },
  {
    id: "minimal-clean",
    name: "Minimal Clean",
    description: "Mostly white and slate, with less visual weight for daily use.",
    tone: "Quiet daily use"
  },
  {
    id: "compact-operations",
    name: "Compact Operations",
    description: "Denser spacing for reception, queue, billing, and admin work.",
    tone: "Dense operations"
  }
];

const fallbackTheme: AppThemeId = "clinic-premium";

type ThemeContextValue = {
  theme: AppThemeId;
  density: DensityMode;
  scale: ScaleMode;
  motion: MotionMode;
  setTheme: (theme: AppThemeId) => void;
  setDensity: (density: DensityMode) => void;
  setScale: (scale: ScaleMode) => void;
  setMotion: (motion: MotionMode) => void;
  resetTheme: () => void;
  resetDisplayPreferences: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppThemeId>(fallbackTheme);
  const [density, setDensityState] = useState<DensityMode>("comfortable");
  const [scale, setScaleState] = useState<ScaleMode>("normal");
  const [motion, setMotionState] = useState<MotionMode>("normal");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("prijClinicTheme");
    if (isThemeId(storedTheme)) {
      setThemeState(storedTheme);
    }
    const storedDensity = window.localStorage.getItem("prijClinicDensity");
    const storedScale = window.localStorage.getItem("prijClinicScale");
    const storedMotion = window.localStorage.getItem("prijClinicMotion");
    if (isDensityMode(storedDensity)) setDensityState(storedDensity);
    if (isScaleMode(storedScale)) setScaleState(storedScale);
    if (isMotionMode(storedMotion)) setMotionState(storedMotion);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.density = density;
    document.documentElement.dataset.scale = scale;
    document.documentElement.dataset.motion = motion;
  }, [density, motion, scale, theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      density,
      scale,
      motion,
      setTheme(nextTheme) {
        setThemeState(nextTheme);
        window.localStorage.setItem("prijClinicTheme", nextTheme);
      },
      setDensity(nextDensity) {
        setDensityState(nextDensity);
        window.localStorage.setItem("prijClinicDensity", nextDensity);
      },
      setScale(nextScale) {
        setScaleState(nextScale);
        window.localStorage.setItem("prijClinicScale", nextScale);
      },
      setMotion(nextMotion) {
        setMotionState(nextMotion);
        window.localStorage.setItem("prijClinicMotion", nextMotion);
      },
      resetTheme() {
        setThemeState(fallbackTheme);
        window.localStorage.removeItem("prijClinicTheme");
      },
      resetDisplayPreferences() {
        setDensityState("comfortable");
        setScaleState("normal");
        setMotionState("normal");
        window.localStorage.removeItem("prijClinicDensity");
        window.localStorage.removeItem("prijClinicScale");
        window.localStorage.removeItem("prijClinicMotion");
      }
    }),
    [density, motion, scale, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

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

export function isDensityMode(value: unknown): value is DensityMode {
  return value === "comfortable" || value === "compact";
}

export function isScaleMode(value: unknown): value is ScaleMode {
  return value === "normal" || value === "magnified";
}

export function isMotionMode(value: unknown): value is MotionMode {
  return value === "normal" || value === "reduced";
}
