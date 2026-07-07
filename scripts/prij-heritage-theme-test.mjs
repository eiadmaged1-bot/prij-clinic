import { readFile } from "node:fs/promises";
import { makeRecorder } from "./security-route-manifest.mjs";

const record = makeRecorder("PRIJ-HERITAGE");

function includesAll(source, labels, context) {
  for (const label of labels) {
    if (!source.includes(label)) throw new Error(`${context} missing ${label}`);
  }
}

async function main() {
  const [theme, css, shell, components, registry] = await Promise.all([
    readFile("apps/web/app/theme.tsx", "utf8"),
    readFile("apps/web/app/globals.css", "utf8"),
    readFile("apps/web/app/mvp-page.tsx", "utf8"),
    readFile("apps/web/components/prij-heritage.tsx", "utf8"),
    readFile("apps/web/app/navigation-registry.ts", "utf8")
  ]);

  includesAll(theme, ['"prij-heritage"', "Prij Heritage", 'fallbackTheme: AppThemeId = "prij-heritage"'], "theme registry");
  record.pass("Prij Heritage is registered and defaulted");

  includesAll(css, ["--pc-ink: #16302c", "--pc-paper: #faf7f2", "--pc-teal: #2f6f62", "--pc-terracotta: #c6714b", "--font-display", "--font-sans", "--font-mono", ".theme-prij-heritage .sidebar"], "heritage CSS");
  record.pass("Prij Heritage tokens and shell styles load");

  includesAll(shell, ["Patient search", "New Patient", "Dr Maged Attia Clinics OS", "Women&apos;s health"], "app shell");
  includesAll(registry, ["Dashboard", "Patients", "Doctor workflow", "Reception queue", "Calendar", "Finance", "Orders", "Medications", "Admin / Owner Control"], "navigation registry");
  record.pass("sidebar and topbar use Prij Heritage clinic OS labels");

  includesAll(components, ["ClinicShell", "Sidebar", "Topbar", "KpiCard", "StatusChip", "PatientHeader", "PregnancyRibbon", "DataCard", "TimelineRow", "EmptyState", "ActionButton", "PageHeader", "SectionCard", "TrustBadge"], "component module");
  record.pass("Prij Heritage reusable components are present");
}

await main().catch((error) => record.fail("Prij Heritage theme", error));
record.summary();
