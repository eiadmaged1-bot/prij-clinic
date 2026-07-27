import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const write = (file, content) => fs.writeFileSync(file, content, "utf8");

function replaceOnce(file, before, after) {
  const source = read(file);
  if (!source.includes(before)) {
    throw new Error(`${file}: expected source contract not found:\n${before}`);
  }
  const next = source.replace(before, after);
  if (next === source) throw new Error(`${file}: replacement did not change source`);
  write(file, next);
}

function insertAfter(file, needle, addition) {
  const source = read(file);
  if (!source.includes(needle)) throw new Error(`${file}: insertion contract not found`);
  write(file, source.replace(needle, needle + addition));
}

const labelsFile = "apps/web/lib/patient-labels.ts";
if (read(labelsFile).includes("export type PatientCreationContext")) {
  console.log("Sprint 2A patient foundation changes already applied.");
  process.exit(0);
}
insertAfter(
  labelsFile,
  `export const patientTypeOptions: Array<{ value: CanonicalPatientType; label: string; labelAr: string }> = [
  { value: "OBSTETRIC", label: "Obstetric / Pregnancy", labelAr: "حمل ومتابعة ولادة" },
  { value: "HIGH_RISK_OBSTETRIC", label: "High-risk obstetric", labelAr: "حمل عالي الخطورة" },
  { value: "GYNECOLOGY", label: "Gynecology", labelAr: "أمراض النساء" },
  { value: "INFERTILITY", label: "Infertility / Fertility", labelAr: "تأخر الإنجاب والخصوبة" },
  { value: "POSTPARTUM", label: "Postpartum", labelAr: "ما بعد الولادة" },
  { value: "PREVENTIVE_WELL_WOMAN", label: "Preventive / Well-woman", labelAr: "صحة المرأة والوقاية" },
  { value: "OTHER", label: "Other", labelAr: "أخرى" }
];
`,
  `
export type PatientCreationContext = "OBSTETRIC" | "GYNECOLOGY" | "INFERTILITY" | "OTHER";

export const patientCreationContextOptions: Array<{ value: PatientCreationContext; label: string; labelAr: string }> = [
  { value: "OBSTETRIC", label: "Pregnancy / Obstetric", labelAr: "الحمل / التوليد" },
  { value: "GYNECOLOGY", label: "Gynecology", labelAr: "أمراض النساء" },
  { value: "INFERTILITY", label: "Fertility", labelAr: "الخصوبة" },
  { value: "OTHER", label: "Undetermined", labelAr: "غير محدد بعد" }
];
`
);

replaceOnce(
  labelsFile,
  `export function ageLabel(dateOfBirth?: string | null) {
  if (!dateOfBirth) return "Age not set";
  const year = Number(dateOfBirth.slice(0, 4));
  if (!year) return "Age not set";
  return \`\${new Date().getFullYear() - year} years\`;
}`,
  `export function ageLabel(dateOfBirth?: string | null, yearOfBirth?: number | string | null) {
  const dateYear = dateOfBirth ? Number(dateOfBirth.slice(0, 4)) : 0;
  const fallbackYear = Number(yearOfBirth ?? 0);
  const year = dateYear || fallbackYear;
  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(year) || year < 1900 || year > currentYear) return "Age not set";
  return \`\${currentYear - year} years\`;
}`
);

const newPatientFile = "apps/web/app/patients/new/page.tsx";
replaceOnce(
  newPatientFile,
  `import { patientTypeOptions } from "@/lib/patient-labels";`,
  `import { patientCreationContextOptions } from "@/lib/patient-labels";`
);

replaceOnce(
  newPatientFile,
  `  patientType: "WOMEN_HEALTH",`,
  `  patientType: "OBSTETRIC",`
);

replaceOnce(
  newPatientFile,
  `      if (!firstName) throw new Error(copy.fullNameRequired);
      if (saveIntent === "queue" && !visitType) throw new Error(copy.visitTypeRequired);
      if (!canCreatePatient) throw new Error("Patient registration is handled by reception.");`,
  `      if (!firstName) throw new Error(copy.fullNameRequired);
      if (saveIntent === "queue" && !visitType) throw new Error(copy.visitTypeRequired);
      if (!canCreatePatient) throw new Error("Patient registration is handled by reception.");
      if (!patientCreationContextOptions.some((option) => option.value === form.patientType)) throw new Error(copy.invalidCareContext);
      if (form.yearOfBirth) {
        const year = Number(form.yearOfBirth);
        const currentYear = new Date().getFullYear();
        if (!/^\\d{4}$/.test(form.yearOfBirth) || !Number.isInteger(year) || year < 1900 || year > currentYear) throw new Error(copy.invalidYearOfBirth);
      }`
);

replaceOnce(
  newPatientFile,
  `          patientType: form.patientType || "WOMEN_HEALTH",`,
  `          patientType: form.patientType,`
);

replaceOnce(
  newPatientFile,
  `      const response = await fetch(\`\${getApiBaseUrl()}/patients\`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          "idempotency-key": patientIdempotencyKey,
          ...(token ? { authorization: \`Bearer \${token}\` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) throw new Error(copy.signInRequired);

      if (!response.ok) {
        const body = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(body?.message || copy.createFailed);
      }

      const patient = (await response.json()) as { id: string };`,
  `      const creationEndpoint = saveIntent === "open" ? "/patients/create-and-start-visit" : "/patients";
      const response = await fetch(\`\${getApiBaseUrl()}\${creationEndpoint}\`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          "idempotency-key": patientIdempotencyKey,
          ...(token ? { authorization: \`Bearer \${token}\` } : {})
        },
        body: JSON.stringify(payload)
      });
      const responseBody = await response.json().catch(() => null) as PatientCreateResponse | null;

      if (response.status === 401) throw new Error(copy.signInRequired);
      if (response.status === 403) throw new Error(copy.permissionDenied);
      if (!response.ok) throw new Error(patientCreateErrorMessage(responseBody, copy));

      const patient = responseBody;
      if (!patient?.id) throw new Error(copy.createFailed);`
);

replaceOnce(
  newPatientFile,
  `      } else {
        setSuccess(copy.patientFileSaved);
        if (saveIntent === "open") router.push(\`/patients/\${patient.id}\`);
      }`,
  `      } else {
        setSuccess(copy.patientFileSaved);
        if (saveIntent === "open") {
          router.push(patient.visitId ? \`/patients/\${patient.id}/visits/\${patient.visitId}/encounter\` : \`/patients/\${patient.id}\`);
        }
      }`
);

replaceOnce(
  newPatientFile,
  `              {patientTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}`,
  `              {patientCreationContextOptions.map((option) => <option key={option.value} value={option.value}>{language === "ar" ? option.labelAr : option.label}</option>)}`
);

replaceOnce(
  newPatientFile,
  `            {isDoctor ? <button className="button" disabled={isSubmitting || Boolean(createdPatientId) || !patientIdempotencyKey} name="saveIntent" value="open" type="submit">Create and open clinical file</button> : null}`,
  `            {isDoctor ? <button className="button" disabled={isSubmitting || Boolean(createdPatientId) || !patientIdempotencyKey} name="saveIntent" value="open" type="submit">{isSubmitting ? copy.saving : copy.createAndStartVisit}</button> : null}`
);

replaceOnce(
  newPatientFile,
  `type NewPatientCopy = (typeof newPatientCopy)[keyof typeof newPatientCopy];`,
  `type NewPatientCopy = (typeof newPatientCopy)[keyof typeof newPatientCopy];

type PatientCreateResponse = {
  id?: string;
  visitId?: string;
  patientCreated?: boolean;
  visitStarted?: boolean;
  message?: string | string[];
  code?: string;
  candidates?: unknown[];
  error?: string | { message?: string | string[]; code?: string };
};

function patientCreateErrorMessage(body: PatientCreateResponse | null, copy: NewPatientCopy) {
  const nested = body?.error && typeof body.error === "object" ? body.error : null;
  const raw = body?.message ?? nested?.message ?? (typeof body?.error === "string" ? body.error : "");
  const messages = (Array.isArray(raw) ? raw : [raw]).map((message) => String(message ?? "").trim()).filter(Boolean);
  const joined = messages.join(" ");
  const code = String(body?.code ?? nested?.code ?? "").toUpperCase();
  if (code === "PATIENT_DUPLICATE_REVIEW_REQUIRED") return copy.duplicateReviewRequired;
  const normalized = joined.toLowerCase();
  if (normalized.includes("patienttype") || normalized.includes("patient type")) return copy.invalidCareContext;
  if (normalized.includes("yearofbirth") || normalized.includes("year of birth")) return copy.invalidYearOfBirth;
  if (normalized.includes("medical record number already exists")) return copy.mrnAlreadyExists;
  return joined || copy.createFailed;
}`
);

replaceOnce(
  newPatientFile,
  `    patientType: "Patient type",
    yearOfBirth: "Year of birth",`,
  `    patientType: "Initial care context",
    yearOfBirth: "Year of birth",`
);

replaceOnce(
  newPatientFile,
  `    signInRequired: "Please sign in before creating a patient file.",
    createFailed: "Could not create this patient file. Please review the required fields and try again.",`,
  `    signInRequired: "Please sign in before creating a patient file.",
    permissionDenied: "You do not have permission to create this patient and start a visit.",
    invalidCareContext: "Select a valid initial care context.",
    invalidYearOfBirth: "Enter a four-digit year of birth between 1900 and the current year.",
    duplicateReviewRequired: "Possible duplicate patient found. Review the existing patient matches before creating another file.",
    mrnAlreadyExists: "This medical record number already exists. Generate another file number and try again.",
    createAndStartVisit: "Create patient and start visit",
    createFailed: "Could not create this patient file. Please review the required fields and try again.",`
);

replaceOnce(
  newPatientFile,
  `    patientType: "نوع المريضة",
    yearOfBirth: "سنة الميلاد",`,
  `    patientType: "سياق الرعاية الأولي",
    yearOfBirth: "سنة الميلاد",`
);

replaceOnce(
  newPatientFile,
  `    signInRequired: "يرجى تسجيل الدخول قبل إنشاء ملف المريضة.",
    createFailed: "تعذر إنشاء ملف المريضة. راجع الحقول المطلوبة وحاول مرة أخرى.",`,
  `    signInRequired: "يرجى تسجيل الدخول قبل إنشاء ملف المريضة.",
    permissionDenied: "لا توجد صلاحية لإنشاء المريضة وبدء الزيارة.",
    invalidCareContext: "اختر سياق رعاية أولي صحيحاً.",
    invalidYearOfBirth: "أدخل سنة ميلاد من أربعة أرقام بين 1900 والسنة الحالية.",
    duplicateReviewRequired: "يوجد احتمال قوي لملف مكرر. راجع الملفات المطابقة قبل إنشاء ملف آخر.",
    mrnAlreadyExists: "رقم الملف موجود بالفعل. أنشئ رقم ملف آخر وحاول مرة أخرى.",
    createAndStartVisit: "إنشاء المريضة وبدء الزيارة",
    createFailed: "تعذر إنشاء ملف المريضة. راجع الحقول المطلوبة وحاول مرة أخرى.",`
);

const lookupFile = "apps/api/src/patients/services/patient-lookup.service.ts";
replaceOnce(
  lookupFile,
  `      id: true, medicalRecordNumber: true, firstName: true, lastName: true, dateOfBirth: true, phone: true, patientType: true, branchId: true,`,
  `      id: true, medicalRecordNumber: true, firstName: true, lastName: true, dateOfBirth: true, yearOfBirth: true, phone: true, patientType: true, branchId: true,`
);

replaceOnce(
  lookupFile,
  `      patient: { id: patient.id, displayName: \`\${patient.firstName} \${patient.lastName}\`, medicalRecordNumber: patient.medicalRecordNumber, dateOfBirth: patient.dateOfBirth, ageSummary: ageSummary(patient.dateOfBirth, now), contactSummary: patient.phone ? \`••••\${patient.phone.replace(/\\D/g, "").slice(-4)}\` : null, patientType: patient.patientType },`,
  `      patient: { id: patient.id, displayName: \`\${patient.firstName} \${patient.lastName}\`, medicalRecordNumber: patient.medicalRecordNumber, dateOfBirth: patient.dateOfBirth, yearOfBirth: patient.yearOfBirth, ageSummary: ageSummary(patient.dateOfBirth, patient.yearOfBirth, now), contactSummary: patient.phone ? \`••••\${patient.phone.replace(/\\D/g, "").slice(-4)}\` : null, patientType: patient.patientType },`
);

replaceOnce(
  lookupFile,
  `function ageSummary(date: Date | null, now: Date) {
  if (!date) return null;
  let age = now.getUTCFullYear() - date.getUTCFullYear();
  if (now.getUTCMonth() < date.getUTCMonth() || (now.getUTCMonth() === date.getUTCMonth() && now.getUTCDate() < date.getUTCDate())) age -= 1;
  return \`\${Math.max(age, 0)}y\`;
}`,
  `function ageSummary(date: Date | null, yearOfBirth: number | null, now: Date) {
  if (date) {
    let age = now.getUTCFullYear() - date.getUTCFullYear();
    if (now.getUTCMonth() < date.getUTCMonth() || (now.getUTCMonth() === date.getUTCMonth() && now.getUTCDate() < date.getUTCDate())) age -= 1;
    return \`\${Math.max(age, 0)}y\`;
  }
  if (!yearOfBirth || yearOfBirth < 1900 || yearOfBirth > now.getUTCFullYear()) return null;
  return \`\${Math.max(now.getUTCFullYear() - yearOfBirth, 0)}y\`;
}`
);

const sharedFile = "packages/shared/src/index.ts";
replaceOnce(
  sharedFile,
  `  patient: { id: string; displayName: string; medicalRecordNumber: string; dateOfBirth: string | null; ageSummary: string | null; contactSummary: string | null; patientType: string };`,
  `  patient: { id: string; displayName: string; medicalRecordNumber: string; dateOfBirth: string | null; yearOfBirth: number | null; ageSummary: string | null; contactSummary: string | null; patientType: string };`
);

const patientComponentsFile = "apps/web/app/patients/[id]/patient-components.tsx";
replaceOnce(
  patientComponentsFile,
  `      dateOfBirth?: string | null;
      sex?: string | null;`,
  `      dateOfBirth?: string | null;
      yearOfBirth?: number | null;
      sex?: string | null;`
);

const patientPageFile = "apps/web/app/patients/[id]/page.tsx";
replaceOnce(
  patientPageFile,
  `        setPatient({ id: summary.patient.id, medicalRecordNumber: summary.patient.medicalRecordNumber, firstName: names.shift() ?? summary.patient.displayName, lastName: names.join(" "), dateOfBirth: summary.patient.dateOfBirth, phone: summary.patient.contactSummary, status: "active", patientType: summary.patient.patientType });`,
  `        setPatient({ id: summary.patient.id, medicalRecordNumber: summary.patient.medicalRecordNumber, firstName: names.shift() ?? summary.patient.displayName, lastName: names.join(" "), dateOfBirth: summary.patient.dateOfBirth, yearOfBirth: summary.patient.yearOfBirth, phone: summary.patient.contactSummary, status: "active", patientType: summary.patient.patientType });`
);

replaceOnce(
  patientPageFile,
  `  const ageLabel = patientAgeLabel(patient?.dateOfBirth);`,
  `  const ageLabel = patientAgeLabel(patient?.dateOfBirth, patient?.yearOfBirth);`
);

const identityFile = "apps/web/components/patients/PatientSmartIdentityBar.tsx";
replaceOnce(
  identityFile,
  `        <p><span>{ageLabel(patient.dateOfBirth)}</span> · <span>MRN {patient.medicalRecordNumber}</span><br /><span>{patient.phone || "Not recorded"}</span></p>`,
  `        <p><span>{ageLabel(patient.dateOfBirth, patient.yearOfBirth)}</span> · <span>MRN {patient.medicalRecordNumber}</span><br /><span>{patient.phone || "Not recorded"}</span></p>`
);

const test = `import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const requireAll = (source, label, needles) => {
  for (const needle of needles) if (!source.includes(needle)) throw new Error(label + " missing: " + needle);
};
const rejectAll = (source, label, needles) => {
  for (const needle of needles) if (source.includes(needle)) throw new Error(label + " still contains forbidden contract: " + needle);
};

const form = read("apps/web/app/patients/new/page.tsx");
const labels = read("apps/web/lib/patient-labels.ts");
const lookup = read("apps/api/src/patients/services/patient-lookup.service.ts");
const page = read("apps/web/app/patients/[id]/page.tsx");
const identity = read("apps/web/components/patients/PatientSmartIdentityBar.tsx");
const patientComponents = read("apps/web/app/patients/[id]/patient-components.tsx");
const shared = read("packages/shared/src/index.ts");

requireAll(form, "patient creation", [
  'patientType: "OBSTETRIC"',
  "patientCreationContextOptions",
  'creationEndpoint = saveIntent === "open" ? "/patients/create-and-start-visit" : "/patients"',
  "patientCreateErrorMessage",
  "copy.invalidCareContext",
  "copy.invalidYearOfBirth",
  "copy.duplicateReviewRequired",
  "Create patient and start visit"
]);
rejectAll(form, "patient creation", ['patientType: "WOMEN_HEALTH"', 'form.patientType || "WOMEN_HEALTH"', "patientTypeOptions.map"]);

requireAll(labels, "creation contexts", [
  'export type PatientCreationContext = "OBSTETRIC" | "GYNECOLOGY" | "INFERTILITY" | "OTHER"',
  'label: "Pregnancy / Obstetric"',
  'label: "Fertility"',
  'label: "Undetermined"',
  "ageLabel(dateOfBirth?: string | null, yearOfBirth?: number | string | null)"
]);
const creationOptions = labels.slice(labels.indexOf("export const patientCreationContextOptions"), labels.indexOf("const legacyPatientTypeMap"));
rejectAll(creationOptions, "creation contexts", ["HIGH_RISK_OBSTETRIC", "POSTPARTUM", "PREVENTIVE_WELL_WOMAN"]);

requireAll(lookup, "workspace age persistence", [
  "yearOfBirth: true",
  "yearOfBirth: patient.yearOfBirth",
  "ageSummary(patient.dateOfBirth, patient.yearOfBirth, now)",
  "function ageSummary(date: Date | null, yearOfBirth: number | null, now: Date)"
]);
requireAll(shared, "shared patient summary", ["yearOfBirth: number | null"]);
requireAll(patientComponents, "patient model", ["yearOfBirth?: number | null"]);
requireAll(page, "patient page", ["yearOfBirth: summary.patient.yearOfBirth", "patientAgeLabel(patient?.dateOfBirth, patient?.yearOfBirth)"]);
requireAll(identity, "identity bar", ["ageLabel(patient.dateOfBirth, patient.yearOfBirth)"]);

console.log("Sprint 2A patient foundation contract PASS");
`;
write("scripts/sprint2a-patient-foundation-test.mjs", test);

console.log("Sprint 2A patient foundation changes applied.");
