import fs from "node:fs";
import path from "node:path";

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const relative = "apps/web/app/patients/[id]/patient-components.tsx";
const target = path.join(root, relative);
let content = fs.readFileSync(target, "utf8");
const oldValue = '<strong>{monthStartDate.toLocaleDateString(undefined, { month: "short", year: "numeric" })}</strong>';
const newValue = '<strong>{calendarTitle(mode)} · {monthStartDate.toLocaleDateString(undefined, { month: "short", year: "numeric" })}</strong>';
const count = content.split(oldValue).length - 1;
if (count !== 1) throw new Error(`compact calendar title: expected exactly one target, found ${count}`);
content = content.replace(oldValue, newValue);
fs.writeFileSync(target, content, "utf8");
console.log("Compact calendar title helper restored.");
