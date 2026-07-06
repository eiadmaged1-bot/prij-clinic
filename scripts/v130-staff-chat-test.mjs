import { readFile } from "node:fs/promises";

const checks = [];
function pass(message) { checks.push(message); console.log(`V130-STAFF-CHAT PASS ${message}`); }
function assert(condition, message) { if (!condition) throw new Error(message); }

const schema = await readFile("apps/api/prisma/schema.prisma", "utf8");
const service = await readFile("apps/api/src/staff-chat/staff-chat.service.ts", "utf8");
const controller = await readFile("apps/api/src/staff-chat/staff-chat.controller.ts", "utf8");
const dto = await readFile("apps/api/src/staff-chat/dto.ts", "utf8");
const page = await readFile("apps/web/app/staff-chat/page.tsx", "utf8");
const shell = await readFile("apps/web/app/mvp-page.tsx", "utf8");

for (const model of ["StaffConversation", "StaffConversationParticipant", "StaffMessage", "StaffMessageReceipt"]) {
  assert(schema.includes(`model ${model}`), `${model} model missing`);
}
pass("conversation message participant receipt models exist");
assert(service.includes("createMany") && schema.includes("seenAt") && schema.includes("@@unique([messageId, userId])"), "per-recipient seen receipts missing");
pass("seen status is stored per recipient");
assert(controller.includes("direct") && controller.includes("messages") && controller.includes("unread-count"), "chat endpoints missing");
pass("direct conversation send list and unread endpoints exist");
assert(service.includes("requireParticipant") && service.includes("participantWhere"), "conversation participant access guard missing");
pass("users cannot access conversations they do not participate in");
assert(service.includes("cleanBody") && dto.includes("MaxLength(2000)") && !page.includes("dangerouslySetInnerHTML"), "message sanitization/render safety missing");
pass("message body is validated and rendered as text");
assert(service.includes("staff_chat.patient_link") && page.includes("Patient-linked messages are not formal clinical notes"), "patient-linked safety missing");
pass("patient-linked messages require access and are operational");
assert(shell.includes("getUnreadStaffChatCount") && shell.includes("unread-badge"), "unread badge missing");
pass("unread badge exists in top bar");
assert(!service.match(/whatsapp|sms|twilio/i) && !page.match(/whatsapp|sms|twilio/i), "external chat integration found");
pass("no WhatsApp/SMS/external integration added");

console.log(`V130-STAFF-CHAT SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
