"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

const workflowGroups = [
  {
    key: "note",
    label: "Visit note",
    entry: "encounter",
    modules: [
      ["encounter", "Summary note"],
      ["complaint", "Presenting complaint"],
      ["history", "Guided history"],
      ["examination", "Examination"],
      ["impression", "Assessment"]
    ]
  },
  {
    key: "orders",
    label: "Orders & plan",
    entry: "prescription",
    modules: [
      ["prescription", "Prescription"],
      ["investigations", "Investigations"],
      ["ultrasound", "Ultrasound"],
      ["follow-up", "Follow-up"]
    ]
  },
  {
    key: "review",
    label: "Review",
    entry: "finish",
    modules: [["finish", "Review and sign"]]
  }
] as const;

export function CalmVisitNavigation() {
  const pathname = usePathname();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const route = useMemo(() => parseVisitRoute(pathname), [pathname]);

  useEffect(() => {
    setTarget(null);
    if (!route) return;

    let observer: MutationObserver | null = null;
    const attach = () => {
      const nextTarget = document.querySelector<HTMLElement>(".active-visit-tabs");
      if (!nextTarget) return false;
      setTarget(nextTarget);
      observer?.disconnect();
      return true;
    };

    if (!attach()) {
      observer = new MutationObserver(() => {
        attach();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => observer?.disconnect();
  }, [pathname, route]);

  if (!route || !target) return null;

  const activeGroup = workflowGroups.find((group) => group.modules.some(([module]) => module === route.module)) ?? workflowGroups[0];
  const basePath = `/patients/${route.patientId}/visits/${route.visitId}`;

  return createPortal(
    <div className="calm-workflow-navigation" data-module={route.module}>
      <div className="calm-workflow-tabs" aria-label="Visit workflow">
        {workflowGroups.map((group) => (
          <Link
            aria-current={activeGroup.key === group.key ? "page" : undefined}
            className={activeGroup.key === group.key ? "active" : ""}
            href={`${basePath}/${group.entry}`}
            key={group.key}
          >
            {group.label}
          </Link>
        ))}
      </div>

      <label className="visit-section-picker">
        <span>Current section</span>
        <select
          aria-label="Current visit section"
          onChange={(event) => window.location.assign(`${basePath}/${event.target.value}`)}
          value={route.module}
        >
          {activeGroup.modules.map(([module, label]) => (
            <option key={module} value={module}>{label}</option>
          ))}
        </select>
      </label>
    </div>,
    target
  );
}

function parseVisitRoute(pathname: string | null) {
  const match = pathname?.match(/^\/patients\/([^/]+)\/visits\/([^/]+)\/([^/?#]+)/);
  if (!match) return null;
  return {
    patientId: match[1]!,
    visitId: match[2]!,
    module: match[3]!
  };
}
