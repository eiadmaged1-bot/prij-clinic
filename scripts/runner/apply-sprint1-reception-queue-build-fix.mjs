import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());

function replaceOnce(relativePath, before, after) {
  const filePath = path.join(root, relativePath);
  const source = fs.readFileSync(filePath, "utf8");
  if (!source.includes(before)) throw new Error(`Missing expected build-fix contract in ${relativePath}: ${before}`);
  fs.writeFileSync(filePath, source.replace(before, after), "utf8");
}

replaceOnce(
  "apps/web/app/mvp-page.tsx",
  'import { MobileBottomNav, doctorMinimalisticNav, receptionistMinimalisticNav } from "@/components/layout/MobileBottomNav";',
  'import { MobileBottomNav, doctorMinimalisticNav } from "@/components/layout/MobileBottomNav";'
);

replaceOnce(
  "apps/web/app/clinic-operations-page.tsx",
  '{mode === "doctor" ? <DoctorHandoff queue={visibleQueue.filter((ticket) => ["waiting", "called", "in_room"].includes(ticket.status))} orders={orders} invoices={invoices} onRefresh={load} /> : null}',
  '{mode === "doctor" ? <DoctorHandoff queue={visibleQueue.filter((ticket) => ["waiting", "called", "in_room"].includes(ticket.status))} orders={orders} onRefresh={load} /> : null}'
);

replaceOnce(
  "apps/web/app/clinic-operations-page.tsx",
  'function DoctorHandoff({ queue, orders, invoices, onRefresh }: { queue: QueueTicket[]; orders: InvestigationOrder[]; invoices: Invoice[]; onRefresh(): Promise<void> }) {',
  'function DoctorHandoff({ queue, orders, onRefresh }: { queue: QueueTicket[]; orders: InvestigationOrder[]; onRefresh(): Promise<void> }) {'
);

console.log("Sprint 1 reception and queue production-build lint blockers repaired.");
