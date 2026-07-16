"use client";

import Link from "next/link";
import { DermatologyWorkspace } from "@/components/medications/DermatologyWorkspace";
import { useI18n } from "@/i18n/useI18n";
import { AppShell } from "../mvp-page";

export default function DermatologyPage() {
  const { t } = useI18n();
  return <AppShell>
    <section className="page-header"><div className="header-row"><div><p className="eyebrow">{t("knowledge")}</p><h1>{t("dermatologyKnowledgeTopic")}</h1><p className="muted">{t("dermatologySafety")}</p></div><Link className="button secondary compact" href="/medications">{t("openDrugAtlas")}</Link></div></section>
    <DermatologyWorkspace />
  </AppShell>;
}
