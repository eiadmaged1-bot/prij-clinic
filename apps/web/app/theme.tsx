"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type AppThemeId = "prij-heritage" | "clinic-premium" | "medicolize-portal" | "incision-portal" | "minimal-clean" | "compact-operations";

export type AppTheme = {
  id: AppThemeId;
  name: string;
  description: string;
  tone: string;
};

export const themes: AppTheme[] = [
  {
    id: "prij-heritage",
    name: "Prij Heritage",
    description: "Warm paper workspace, ink sidebar, teal actions, terracotta active state, and patient-file-first clinic patterns.",
    tone: "Heritage clinic OS"
  },
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

const fallbackTheme: AppThemeId = "prij-heritage";

type ThemeContextValue = {
  theme: AppThemeId;
  setTheme: (theme: AppThemeId) => void;
  resetTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppThemeId>(fallbackTheme);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("prijClinicTheme");
    if (isThemeId(storedTheme)) {
      setThemeState(storedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme(nextTheme) {
        setThemeState(nextTheme);
        window.localStorage.setItem("prijClinicTheme", nextTheme);
      },
      resetTheme() {
        setThemeState(fallbackTheme);
        window.localStorage.removeItem("prijClinicTheme");
      }
    }),
    [theme]
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

