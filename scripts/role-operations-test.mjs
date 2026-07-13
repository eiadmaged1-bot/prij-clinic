import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [doctor, reception, calendar, operations, chat, chatService] = await Promise.all([
  readFile("apps/web/app/doctor/page.tsx", "utf8"),
  readFile("apps/web/app/reception/page.tsx", "utf8"),
  readFile("apps/web/app/calendar/page.tsx", "utf8"),
  readFile("apps/web/app/clinic-operations-page.tsx", "utf8"),
  readFile("apps/web/app/staff-chat/page.tsx", "utf8"),
  readFile("apps/api/src/staff-chat/staff-chat.service.ts", "utf8")
]);

for (const action of ["Open next patient", "Find patient", "Start new visit"]) assert(doctor.includes(action), `doctor action missing: ${action}`);
assert(!doctor.includes("OB/GYN Templates") && !doctor.includes("doctor-step-strip"), "doctor dashboard must stay operational and compact");
for (const action of ["Search patient", "New Patient", "Returning Patient / QR", "Queue", "Appointments"]) assert(reception.includes(action) || reception.includes(action.replaceAll(" ", "")), `reception action missing: ${action}`);
assert(calendar.includes('activeTab === "appointments"') && calendar.includes('activeTab === "edd"'), "appointments and EDD must render as separate tabs");
for (const filter of ["Day", "Week", "Month", "Doctor", "Branch", "Status"]) assert(calendar.includes(filter) || calendar.includes(filter.toLowerCase()), `calendar control missing: ${filter}`);
assert(operations.includes("canViewFinance") && operations.includes('reportRole === "owner"') && operations.includes('reportRole === "reception"') && operations.includes('reportRole === "doctor"'), "reports must be permission- and role-specific");
assert(!operations.includes('<h2>Owner daily summary</h2><span className="badge">Business</span></div><ul className="feature-list"><li>Manual') || operations.includes('reportRole === "owner"'), "owner finance must not render unconditionally");
assert(chat.includes("disabled={!active}") && chat.includes("unread") && chat.includes("branchName"), "messages require a selected conversation and display branch/unread context");
assert(chatService.includes("unreadByConversation") && chatService.includes("branchName"), "message API must supply unread and branch metadata");

console.log("Doctor, reception, queue, calendar, reports, and messages role workflow PASS");
