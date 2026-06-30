"use client";

import Link from "next/link";
import { ThreeDMedicalIcon, type IconName } from "../../../components/ThreeDMedicalIcon";
import { AppShell, SafetyAlert } from "../../mvp-page";

const referenceCards: Array<{
  title: string;
  description: string;
  href: string;
  icon: IconName;
  badge: string;
}> = [
  {
    title: "Medication terminology",
    description: "Ingredient, family, interaction, and terminology references. Catalog metadata only.",
    href: "/admin/medications",
    icon: "prescription",
    badge: "Catalog"
  },
  {
    title: "Drug labels",
    description: "Official label source registry and review queue. Doctor review remains required.",
    href: "/medications",
    icon: "reports",
    badge: "Labels"
  },
  {
    title: "Herbs",
    description: "Herbal and supplement reference source placeholders with safety review flags.",
    href: "/medications/herbals",
    icon: "files",
    badge: "Reference"
  },
  {
    title: "Egypt/Gulf drug market",
    description: "Country, source, connector, product, and variant metadata. Not patient directions.",
    href: "/admin/drug-market",
    icon: "prescription",
    badge: "Market"
  },
  {
    title: "Guidelines",
    description: "Guideline source registry, import policy, private vault, and review workflow.",
    href: "/guidelines/sources",
    icon: "reports",
    badge: "Sources"
  },
  {
    title: "Protocol Atlas",
    description: "Structured women's health protocol catalog with verification workflow.",
    href: "/admin/protocol-atlas",
    icon: "ai",
    badge: "Atlas"
  },
  {
    title: "Calculators/Formulas",
    description: "Future validated calculator registry. No autonomous diagnosis or prescribing.",
    href: "/protocol-atlas",
    icon: "settings",
    badge: "Planned"
  }
];

export default function ReferenceDataPage() {
  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>Reference Data</h1>
          </div>
          <span className="badge warning">No patient data</span>
        </div>
        <p className="muted">
          Bootstrap and review clinical reference sources separately from patient workflow data.
        </p>
      </section>

      <SafetyAlert />

      <section className="module-grid">
        {referenceCards.map((card) => (
          <Link className="module-card" href={card.href} key={card.title}>
            <ThreeDMedicalIcon name={card.icon} size="md" />
            <span className="badge accent">{card.badge}</span>
            <strong>{card.title}</strong>
            <p className="muted">{card.description}</p>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
