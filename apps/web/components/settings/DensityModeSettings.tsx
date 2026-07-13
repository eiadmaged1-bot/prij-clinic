"use client";
import { useInterfaceMode, type DensityMode } from "@/lib/interface-mode";

export function DensityModeSettings({ language = "en" }: { language?: "en" | "ar" }) {
  const { densityMode, updatePreferences } = useInterfaceMode();
  const labels: Record<DensityMode, { en: string; ar: string }> = { COMPACT: { en: "Compact", ar: "مضغوط" }, COMFORTABLE: { en: "Comfortable", ar: "مريح" }, LARGE: { en: "Large", ar: "كبير" } };
  return <fieldset className="appearance-options" dir={language === "ar" ? "rtl" : "ltr"}><legend>{language === "ar" ? "كثافة العرض" : "Density"}</legend>{(Object.keys(labels) as DensityMode[]).map((value) => <label className="appearance-option" key={value}><input checked={densityMode === value} name="density-mode" onChange={() => void updatePreferences({ densityMode: value })} type="radio" /><span>{labels[value][language]}</span></label>)}</fieldset>;
}
