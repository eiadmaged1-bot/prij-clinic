"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ar } from "./ar";
import { en } from "./en";

export type Language = "en" | "ar";
type TranslationKey = keyof typeof en;
const dictionaries = { en, ar };
const LANGUAGE_KEY = "prijClinicLanguage";
const LANGUAGE_EVENT = "prij:i18n:changed";

const I18nContext = createContext<{
  language: Language;
  direction: "ltr" | "rtl";
  textDirection: "ltr" | "rtl";
  locale: "en-US" | "ar-EG";
  t(key: TranslationKey): string;
  setLanguage(language: Language): void;
} | null>(null);

function applyDocumentLanguage(language: Language) {
  const direction = language === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = language;
  document.documentElement.dir = direction;
  document.body?.classList.toggle("rtl-layout", language === "ar");
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    const next = stored === "ar" ? "ar" : "en";
    setLanguageState(next);
    applyDocumentLanguage(next);
    const syncLanguage = () => {
      const current = localStorage.getItem(LANGUAGE_KEY) === "ar" ? "ar" : "en";
      setLanguageState(current);
      applyDocumentLanguage(current);
    };
    window.addEventListener(LANGUAGE_EVENT, syncLanguage);
    window.addEventListener("storage", syncLanguage);
    return () => {
      window.removeEventListener(LANGUAGE_EVENT, syncLanguage);
      window.removeEventListener("storage", syncLanguage);
    };
  }, []);

  const direction: "ltr" | "rtl" = language === "ar" ? "rtl" : "ltr";
  const locale: "en-US" | "ar-EG" = language === "ar" ? "ar-EG" : "en-US";

  useEffect(() => applyDocumentLanguage(language), [language]);

  const value = useMemo(() => ({
    language,
    direction,
    textDirection: direction,
    locale,
    t: (key: TranslationKey) => dictionaries[language][key] ?? en[key] ?? "",
    setLanguage: (next: Language) => {
      localStorage.setItem(LANGUAGE_KEY, next);
      applyDocumentLanguage(next);
      setLanguageState(next);
      window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT));
    }
  }), [direction, language, locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();
  const label = language === "ar" ? "تبديل اللغة" : "Language switcher";
  return <div className="language-switcher" aria-label={label}><button aria-pressed={language === "ar"} className={language === "ar" ? "active" : ""} lang="ar" type="button" onClick={() => setLanguage("ar")}>عربي</button><button aria-pressed={language === "en"} className={language === "en" ? "active" : ""} lang="en" type="button" onClick={() => setLanguage("en")}>EN</button></div>;
}
