"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

const macroGroups = [
  { key: "summary", label: "Summary", groups: ["overview"] },
  { key: "care", label: "Clinical care", groups: ["visits", "investigations", "prescriptions"] },
  { key: "evidence", label: "Evidence & more", groups: ["guidelines"] }
] as const;

type OriginalGroup = { key: string; label: string; button: HTMLButtonElement };

export function CalmPatientNavigation() {
  const pathname = usePathname();
  const isPatientFile = /^\/patients\/[^/]+\/?$/.test(pathname ?? "");
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [originalGroups, setOriginalGroups] = useState<OriginalGroup[]>([]);
  const [activeKey, setActiveKey] = useState("overview");

  useEffect(() => {
    setTarget(null);
    setOriginalGroups([]);
    if (!isPatientFile) return;

    let observer: MutationObserver | null = null;
    const sync = () => {
      const nextTarget = document.querySelector<HTMLElement>(".hybrid-workspace-tabs");
      if (!nextTarget) return false;
      const buttons = Array.from(nextTarget.querySelectorAll<HTMLButtonElement>(":scope > button[data-tab-key]"));
      if (!buttons.length) return false;
      setTarget(nextTarget);
      setOriginalGroups(buttons.map((button) => ({ key: button.dataset.tabKey ?? "", label: button.textContent?.trim() || button.dataset.tabKey || "Section", button })));
      setActiveKey(buttons.find((button) => button.classList.contains("active"))?.dataset.tabKey ?? buttons[0]?.dataset.tabKey ?? "overview");
      return true;
    };

    sync();
    observer = new MutationObserver(() => { sync(); });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    return () => observer?.disconnect();
  }, [isPatientFile, pathname]);

  const visibleMacros = useMemo(() => macroGroups.filter((macro) => macro.groups.some((key) => originalGroups.some((group) => group.key === key))), [originalGroups]);
  const activeMacro = visibleMacros.find((macro) => macro.groups.some((key) => key === activeKey)) ?? visibleMacros[0];
  const careGroups = originalGroups.filter((group) => macroGroups[1].groups.some((key) => key === group.key));

  if (!target || !activeMacro) return null;

  function activate(key: string) {
    originalGroups.find((group) => group.key === key)?.button.click();
    setActiveKey(key);
  }

  return createPortal(
    <div className="calm-patient-workspace-navigation">
      <div className="calm-patient-macro-tabs" aria-label="Patient workspace">
        {visibleMacros.map((macro) => {
          const destination = macro.groups.find((key) => originalGroups.some((group) => group.key === key));
          return <button className={activeMacro.key === macro.key ? "active" : ""} key={macro.key} type="button" onClick={() => destination && activate(destination)}>{macro.label}</button>;
        })}
      </div>
      {activeMacro.key === "care" && careGroups.length > 1 ? <label className="calm-patient-section-picker"><span>Care section</span><select aria-label="Patient care section" value={activeKey} onChange={(event) => activate(event.target.value)}>{careGroups.map((group) => <option key={group.key} value={group.key}>{group.label}</option>)}</select></label> : null}
    </div>,
    target
  );
}
