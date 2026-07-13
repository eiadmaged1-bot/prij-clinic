"use client";
import { useInterfaceMode, type InterfaceMode } from "@/lib/interface-mode";

export function InterfaceModeSettings({ language = "en" }: { language?: "en" | "ar" }) {
  const { interfaceMode, updatePreferences } = useInterfaceMode();
  const options: Array<{ value: InterfaceMode; label: string; description: string }> = language === "ar" ? [
    { value: "OPTIMIZED", label: "محسّن", description: "مساحة عمل كاملة للعيادة مع تنقل أوضح وأدوات مجمعة." },
    { value: "MINIMALISTIC", label: "مبسّط", description: "سير عمل موجه بسيط بعناصر أقل وتنقل مناسب للهاتف." }
  ] : [
    { value: "OPTIMIZED", label: "Optimized", description: "Full clinic workspace with cleaner navigation and grouped tools." },
    { value: "MINIMALISTIC", label: "Minimalistic", description: "Simple guided workflow with fewer visible controls and mobile-first navigation." }
  ];
  return <fieldset className="appearance-options" dir={language === "ar" ? "rtl" : "ltr"}><legend>{language === "ar" ? "وضع الواجهة" : "Interface Mode"}</legend>{options.map((option) => <label className="appearance-option" key={option.value}><input checked={interfaceMode === option.value} name="interface-mode" onChange={() => void updatePreferences({ interfaceMode: option.value })} type="radio" /><span><strong>{option.label}</strong><small>{option.description}</small></span></label>)}</fieldset>;
}
