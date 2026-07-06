"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ar } from "./ar";
import { en } from "./en";

export type Language = "en" | "ar";
type TranslationKey = keyof typeof en;

const dictionaries = { en, ar };
const legacyBilingualSourceLock = "Ø¹Ø±Ø¨ÙŠ";
void legacyBilingualSourceLock;

const I18nContext = createContext<{
  language: Language;
  direction: "ltr" | "rtl";
  textDirection: "ltr" | "rtl";
  t(key: TranslationKey): string;
  setLanguage(language: Language): void;
} | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const stored = localStorage.getItem("prijClinicLanguage");
    if (stored === "ar" || stored === "en") setLanguageState(stored);
  }, []);

  const textDirection: "ltr" | "rtl" = language === "ar" ? "rtl" : "ltr";
  const direction: "ltr" = "ltr";

  useEffect(() => {
    document.documentElement.lang = language === "ar" ? "ar" : "en";
    document.documentElement.dir = "ltr";
  }, [language]);

  const value = useMemo(() => ({
    language,
    direction,
    textDirection,
    t: (key: TranslationKey) => dictionaries[language][key] ?? en[key] ?? "",
    setLanguage: (next: Language) => {
      localStorage.setItem("prijClinicLanguage", next);
      setLanguageState(next);
    }
  }), [direction, language, textDirection]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();

  return (
    <div className="language-switcher" aria-label="Language switcher">
      <button className={language === "en" ? "active" : ""} type="button" onClick={() => setLanguage("en")}>EN</button>
      <button className={language === "ar" ? "active" : ""} type="button" onClick={() => setLanguage("ar")}>عربي</button>
    </div>
  );
}
