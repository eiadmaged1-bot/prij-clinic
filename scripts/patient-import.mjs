import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import * as XLSX from "xlsx";

const args = Object.fromEntries(process.argv.slice(2).map((value, index, all) => value.startsWith("--") ? [value.slice(2), all[index + 1]?.startsWith("--") ? true : all[index + 1] ?? true] : null).filter(Boolean));
if (!args.file || (!args["dry-run"] && !args.stage) || (args["dry-run"] && args.stage)) throw new Error('Usage: npm run patient-import -- --file "<path>" --dry-run|--stage');
const filePath = resolve(String(args.file));
const extension = extname(filePath).toLowerCase();
if (![".csv", ".xlsx"].includes(extension)) throw new Error("Only CSV and XLSX files are supported.");
const buffer = await readFile(filePath);
if (buffer.length > 5 * 1024 * 1024) throw new Error("File exceeds the 5 MB limit.");
if (extension === ".xlsx" && !(buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04)) throw new Error("XLSX signature is invalid.");
if (extension === ".xlsx" && /vbaProject\.bin|xl\/macrosheets/i.test(buffer.toString("latin1"))) throw new Error("Macro-enabled workbooks are not accepted.");
if (extension === ".csv" && buffer.includes(0)) throw new Error("CSV contains binary content.");
const workbook = XLSX.read(buffer, { type: "buffer", cellFormula: false, cellHTML: false, cellText: true, raw: false });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
if (!sheet) throw new Error("Workbook has no readable sheet.");
const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
if (rows.length > 5000) throw new Error("Import exceeds the 5,000-row limit.");
if (Object.keys(rows[0] ?? {}).length > 100) throw new Error("Import exceeds the 100-column limit.");
const unsafe = rows.filter((row) => Object.values(row).some((value) => /^[=+@-]/.test(String(value).trim()))).length;
const headers = Object.keys(rows[0] ?? {});
const mapping = autoMap(headers);
const summary = { rows: rows.length, columns: headers.length, unsafeRows: unsafe, fullNameMapped: Boolean(mapping.fullName), stageOnly: true };
console.log(`Patient import summary: rows=${summary.rows}; columns=${summary.columns}; blocked=${summary.unsafeRows}; name-mapped=${summary.fullNameMapped}; stage-only=true`);
if (args["dry-run"]) process.exit(unsafe || !mapping.fullName ? 2 : 0);
if (unsafe || !mapping.fullName) throw new Error("Stage refused because validation blockers remain.");
const origin = process.env.PRIJ_API_ORIGIN;
const token = process.env.PRIJ_OPERATOR_TOKEN;
if (!origin || !token) throw new Error("PRIJ_API_ORIGIN and PRIJ_OPERATOR_TOKEN are required for staging.");
const response = await fetch(`${origin.replace(/\/$/, "")}/patient-import/preview`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ fileName: basename(filePath), fileHash: createHash("sha256").update(buffer).digest("hex"), fileType: extension.slice(1), encoding: "displayed-values", mapping, rows }) });
if (!response.ok) throw new Error(`Staging failed with safe status ${response.status}.`);
const result = await response.json();
console.log(`Patient import staged: batch=${result.id}; rows=${result.rowCount}; no patients created.`);

function autoMap(headers) { const aliases = { fullName: ["full name", "name", "الاسم"], primaryPhone: ["phone", "mobile", "الهاتف"], secondaryPhone: ["secondary phone", "هاتف إضافي"], address: ["address", "العنوان"], spouseName: ["spouse", "husband", "الزوج"], birthValue: ["dob", "birth", "الميلاد"], patientType: ["patient type", "type", "النوع"], registrationDate: ["registration", "تاريخ التسجيل"], notes: ["notes", "ملاحظات"], externalId: ["external id", "file number", "رقم الملف"] }; return Object.fromEntries(Object.entries(aliases).map(([field, terms]) => [field, headers.find((header) => terms.some((term) => String(header).toLowerCase().includes(term))) ?? ""])); }
