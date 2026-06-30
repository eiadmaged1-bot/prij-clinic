"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import {
  type AppThemeId,
  isThemeId,
  normalizeThemeId,
  themeRegistry
} from "../lib/theme-registry";

export type { AppThemeId };

export type AppTheme = {
  id: AppThemeId;
  name: string;
  description: string;
  tone: string;
};

export const themes: AppTheme[] = themeRegistry.map((theme) => ({
  id: theme.id,
  name: theme.displayName,
  description: theme.description,
  tone: theme.layoutVariant.replace("-", " ")
}));

const fallbackTheme: AppThemeId = "luxury-clinic";

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
      setThemeState(normalizeThemeId(storedTheme));
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme(nextTheme) {
        const normalized = normalizeThemeId(nextTheme);
        setThemeState(normalized);
        window.localStorage.setItem("prijClinicTheme", normalized);
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
export { isThemeId };

