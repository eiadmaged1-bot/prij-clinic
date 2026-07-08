"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "../../mvp-page";
import { ThreeDMedicalIcon } from "../../../components/ThreeDMedicalIcon";
import { VisitTypeSelector } from "../../../components/clinic/VisitTypeSelector";
import { useI18n } from "@/i18n/useI18n";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { patientTypeOptions } from "@/lib/patient-labels";
import type { VisitTypeValue } from "@/lib/visit-types";

type FormState = {
  medicalRecordNumber: string;
  fullName: string;
  patientType: string;
  sexualActivityStatus: string;
  yearOfBirth: string;
  phone: string;
  address: string;
  notes: string;
};

type ExistingPatient = { id: string; medicalRecordNumber?: string | null; firstName?: string | null; lastName?: string | null; phone?: string | null };

const initialState: FormState = {
  medicalRecordNumber: makeMrn(),
  fullName: "",
  patientType: "WOMEN_HEALTH",
  sexualActivityStatus: "unknown",
  yearOfBirth: "",
  phone: "",
  address: "",
  notes: ""
};

export default function NewPatientPage() {
  return (
    <AppShell>
      <NewPatientContent />
    </AppShell>
  );
}

function NewPatientContent() {
  const router = useRouter();
  const { language } = useI18n();
  const copy = newPatientCopy[language];
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdPatientId, setCreatedPatientId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visitType, setVisitType] = useState<VisitTypeValue | "">("");
  const [existingPatients, setExistingPatients] = useState<ExistingPatient[]>([]);

  useEffect(() => {
    const token = sessionStorage.getItem("prijClinicToken");
    fetch(`${getApiBaseUrl()}/patients`, {
      credentials: "include",
      headers: token ? { authorization: `Bearer ${token}` } : undefined
    })
      .then(async (response) => response.ok ? (await response.json()) as { patients?: ExistingPatient[] } : { patients: [] })
      .then((body) => setExistingPatients(body.patients ?? []))
      .catch(() => setExistingPatients([]));
  }, []);

  const duplicateWarnings = useMemo(() => possibleDuplicateWarnings(form, existingPatients, copy), [copy, existingPatients, form]);
  const calculatedAge = useMemo(() => ageFromYear(form.yearOfBirth, copy), [copy, form.yearOfBirth]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    const token = sessionStorage.getItem("prijClinicToken");

    try {
      const nameParts = form.fullName.trim().split(/\s+/).filter(Boolean);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "Patient";
      const formData = new FormData(event.currentTarget);
      const saveIntent = String(formData.get("saveIntent") ?? "queue");
      if (!firstName) throw new Error(copy.fullNameRequired);
      if (saveIntent === "queue" && !visitType) throw new Error(copy.visitTypeRequired);

      const noteParts = [
        form.notes.trim(),
        form.address.trim() ? `Area/address: ${form.address.trim()}` : "",
        form.yearOfBirth.trim() ? `Year of birth: ${form.yearOfBirth.trim()}` : ""
      ].filter(Boolean);
      const payload = Object.fromEntries(
        Object.entries({
          medicalRecordNumber: form.medicalRecordNumber,
          firstName,
          lastName,
          sex: "female",
          patientType: form.patientType || "WOMEN_HEALTH",
          sexualActivityStatus: form.sexualActivityStatus,
          phone: form.phone,
          notes: noteParts.join("\n")
        }).filter(([, value]) => String(value).trim() !== "")
      );
      const response = await fetch(`${getApiBaseUrl()}/patients`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) throw new Error(copy.signInRequired);

      if (!response.ok) {
        const body = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(body?.message || copy.createFailed);
      }

      const patient = (await response.json()) as { id: string };
      setCreatedPatientId(patient.id);
      let queueTicket: { queueNumber?: number; visitType?: string } | null = null;
      if (saveIntent === "queue") {
        const queueResponse = await fetch(`${getApiBaseUrl()}/queue/check-in`, {
          method: "POST",
          credentials: "include",
          headers: {
            "content-type": "application/json",
            ...(token ? { authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ patientId: patient.id, visitType, priority: visitType === "urgent_kashf" ? "priority" : "routine" })
        }).catch(() => undefined);
        queueTicket = queueResponse?.ok ? await queueResponse.json().catch(() => null) as { queueNumber?: number; visitType?: string } | null : null;
      }
      await fetch(`${getApiBaseUrl()}/patient-intake`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          patientId: patient.id,
          intakeType: "new_patient",
          patientReportedJson: { sourceLabel: "patient_reported", notes: form.notes.trim() },
          administrativeJson: {
            sourceLabel: "secretary_intake",
            address: form.address.trim(),
            yearOfBirth: form.yearOfBirth.trim(),
            calculatedAge
          }
        })
      }).catch(() => undefined);
      setSuccess(saveIntent === "queue" ? `${copy.addedToQueue} ${queueTicket?.queueNumber ?? "new"}.` : copy.patientFileSaved);
      if (saveIntent === "queue") router.push(`/patients/${patient.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : copy.createFailed);
    } finally {
      setIsSubmitting(false);
    }
  }

  function update(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">{copy.registration}</p>
            <h1>{copy.title}</h1>
          </div>
          <Link className="button secondary compact back-to-reception-button" href="/reception">{copy.backToReception}</Link>
        </div>
        <p className="muted">{copy.subtitle}</p>
      </section>

      <section className="panel form-panel new-patient-card premium-depth-card">
        <div className="section-heading">
          <h2>{copy.patientDetails}</h2>
          <span className="badge warning">{copy.reception}</span>
        </div>

        <form className="form-grid" onSubmit={submit}>
          <label className="wide file-number-block">
            {copy.fileNumber}
            <div className="readonly-file-number">
              <input required readOnly value={form.medicalRecordNumber} />
            </div>
            <button className="button secondary compact" onClick={() => update("medicalRecordNumber", makeMrn())} type="button">{copy.generateAnother}</button>
          </label>
          <label>
            {copy.fullName}
            <input autoComplete="name" onChange={(event) => update("fullName", event.target.value)} placeholder={copy.fullNamePlaceholder} value={form.fullName} />
          </label>
          <label>
            {copy.phone}
            <input autoComplete="tel" inputMode="tel" onChange={(event) => update("phone", event.target.value)} placeholder={copy.phonePlaceholder} value={form.phone} />
            <span className="helper-text">{copy.phoneHelper}</span>
          </label>
          <label>
            {copy.patientType}
            <select onChange={(event) => update("patientType", event.target.value)} value={form.patientType}>
              {patientTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            {copy.yearOfBirth}
            <input inputMode="numeric" max={new Date().getFullYear()} min="1900" onChange={(event) => update("yearOfBirth", event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="YYYY" value={form.yearOfBirth} />
          </label>
          <div className="age-chip" aria-label="Auto-calculated age">{copy.age}: {calculatedAge}</div>
          <label>
            {copy.areaAddress}
            <input onChange={(event) => update("address", event.target.value)} placeholder={copy.areaPlaceholder} value={form.address} />
          </label>
          <details className="wide notes-collapsible">
            <summary>{copy.addNotes}</summary>
            <label>
              {copy.notes}
              <textarea onChange={(event) => update("notes", event.target.value)} rows={3} value={form.notes} />
            </label>
          </details>
          <div className="wide">
            <VisitTypeSelector value={visitType} onChange={setVisitType} />
          </div>

          <label className="wide toggle-row sensitive-bottom-checkbox">
            <input
              checked={form.sexualActivityStatus === "not_sexually_active"}
              onChange={(event) => update("sexualActivityStatus", event.target.checked ? "not_sexually_active" : "unknown")}
              type="checkbox"
            />
            {copy.notSexuallyActive}
            <span className="muted">{copy.uncheckedUnknown}</span>
          </label>

          {duplicateWarnings.length ? (
            <div className="alert warning wide" data-testid="duplicate-patient-warning">
              <strong>{copy.possibleMatch}</strong>
              <p className="muted">{duplicateWarnings.join(" ")}</p>
            </div>
          ) : null}

          {error ? <p className="form-error wide">{error}</p> : null}
          {success ? <p className="success-message wide">{success}</p> : null}

          <div className="form-actions wide">
            <button className="button" disabled={isSubmitting} name="saveIntent" value="queue" type="submit">
              <ThreeDMedicalIcon name="patients" size="sm" />
              {isSubmitting ? copy.saving : copy.saveAndAddToQueue}
            </button>
            <button className="button secondary" disabled={isSubmitting} name="saveIntent" value="file" type="submit">{copy.saveFileOnly}</button>
            {createdPatientId ? <Link className="button secondary" href={`/patients/${createdPatientId}`}>{copy.openReceptionProfile}</Link> : null}
          </div>
        </form>
      </section>
    </>
  );
}

function makeMrn() {
  return `LOCAL-PAT-${Date.now().toString().slice(-8)}`;
}

type NewPatientCopy = (typeof newPatientCopy)[keyof typeof newPatientCopy];

function ageFromYear(year: string, copy: NewPatientCopy) {
  if (!/^\d{4}$/.test(year)) return copy.unknown;
  const value = Number(year);
  const currentYear = new Date().getFullYear();
  if (value < 1900 || value > currentYear) return copy.unknown;
  return String(currentYear - value);
}

function possibleDuplicateWarnings(form: FormState, patients: ExistingPatient[], copy: NewPatientCopy) {
  const phone = normalize(form.phone);
  const mrn = normalize(form.medicalRecordNumber);
  const fullName = normalize(form.fullName);
  const warnings: string[] = [];

  for (const patient of patients) {
    const patientName = normalize(`${patient.firstName ?? ""} ${patient.lastName ?? ""}`);
    if (phone && normalize(patient.phone) === phone) warnings.push(copy.phoneMatch);
    if (mrn && normalize(patient.medicalRecordNumber) === mrn) warnings.push(copy.fileMatch);
    if (fullName && patientName && patientName === fullName) warnings.push(copy.nameMatch);
  }

  return Array.from(new Set(warnings)).slice(0, 3);
}

function normalize(value?: string | null) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

const newPatientCopy = {
  en: {
    registration: "Registration",
    title: "New Patient",
    subtitle: "Create the file and add the patient to today's queue.",
    backToReception: "← Back to Reception",
    patientDetails: "Patient details",
    reception: "Reception",
    fileNumber: "File number",
    generateAnother: "Generate another file number",
    fullName: "Full name",
    fullNamePlaceholder: "Enter patient name",
    phone: "Phone number",
    phonePlaceholder: "Phone number",
    phoneHelper: "Recommended for follow-up and duplicate check.",
    patientType: "Patient type",
    yearOfBirth: "Year of birth",
    age: "Age",
    areaAddress: "Area/address",
    areaPlaceholder: "Optional short area or address",
    addNotes: "Add notes",
    notes: "Notes",
    notSexuallyActive: "Not sexually active",
    uncheckedUnknown: "Unchecked = unknown / not asked.",
    possibleMatch: "Possible match found. Open existing file to review.",
    saveAndAddToQueue: "Save and add to queue",
    saveFileOnly: "Save file only",
    openReceptionProfile: "Open reception profile",
    saving: "Saving",
    unknown: "Unknown",
    fullNameRequired: "Enter the patient full name before creating the file.",
    visitTypeRequired: "Select visit type before saving and adding to queue.",
    signInRequired: "Please sign in before creating a patient file.",
    createFailed: "Could not create this patient file. Please review the required fields and try again.",
    addedToQueue: "Added to queue - Position",
    patientFileSaved: "Patient file saved.",
    phoneMatch: "Phone matches an existing file.",
    fileMatch: "File number matches an existing file.",
    nameMatch: "Name may match an existing file."
  },
  ar: {
    registration: "التسجيل",
    title: "مريضة جديدة",
    subtitle: "إنشاء الملف وإضافة المريضة إلى انتظار اليوم.",
    backToReception: "← الرجوع للاستقبال",
    patientDetails: "بيانات المريضة",
    reception: "الاستقبال",
    fileNumber: "رقم الملف",
    generateAnother: "إنشاء رقم ملف آخر",
    fullName: "الاسم الكامل",
    fullNamePlaceholder: "أدخل اسم المريضة",
    phone: "رقم الهاتف",
    phonePlaceholder: "رقم الهاتف",
    phoneHelper: "يفضل إدخال رقم الهاتف للمتابعة ومنع التكرار.",
    patientType: "نوع المريضة",
    yearOfBirth: "سنة الميلاد",
    age: "العمر",
    areaAddress: "المنطقة/العنوان",
    areaPlaceholder: "منطقة أو عنوان مختصر اختياري",
    addNotes: "إضافة ملاحظات",
    notes: "ملاحظات",
    notSexuallyActive: "غير متزوجة/لا يوجد نشاط جنسي",
    uncheckedUnknown: "غير محدد = غير معروف / لم يتم السؤال.",
    possibleMatch: "يوجد احتمال تطابق. افتح الملف الموجود للمراجعة.",
    saveAndAddToQueue: "حفظ وإضافة للانتظار",
    saveFileOnly: "حفظ الملف فقط",
    openReceptionProfile: "فتح ملف الاستقبال",
    saving: "جار الحفظ",
    unknown: "غير معروف",
    fullNameRequired: "أدخل اسم المريضة قبل إنشاء الملف.",
    visitTypeRequired: "اختر نوع الزيارة قبل الحفظ والإضافة للانتظار.",
    signInRequired: "يرجى تسجيل الدخول قبل إنشاء ملف المريضة.",
    createFailed: "تعذر إنشاء ملف المريضة. راجع الحقول المطلوبة وحاول مرة أخرى.",
    addedToQueue: "تمت الإضافة للانتظار - رقم",
    patientFileSaved: "تم حفظ الملف.",
    phoneMatch: "رقم الهاتف يطابق ملفا موجودا.",
    fileMatch: "رقم الملف يطابق ملفا موجودا.",
    nameMatch: "الاسم قد يطابق ملفا موجودا."
  }
} as const;
