"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell, SafetyAlert } from "../mvp-page";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";

import { getApiBaseUrl } from "@/lib/api-base-url";
import { ageLabel, patientTypeOptions, phaseTypeLabel } from "@/lib/patient-labels";
import { useSession } from "../session";
import { useI18n } from "@/i18n/useI18n";

type Patient = {
  id: string;
  medicalRecordNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  sex?: string | null;
  phone?: string | null;
  email?: string | null;
  status: string;
  patientType?: string | null;
  currentPhase?: { phaseType?: string | null; title?: string | null; status?: string | null } | null;
  branchId?: string | null;
  branch?: { id: string; name: string } | null;
  latestVisitDate?: string | null;
  yearOfBirth?: number | null;
  createdAt?: string | null;
  favorited?: boolean;
  queueState?: { status: string; queueNumber: number; visitType?: string | null } | null;
};

type PageInfo = { page: number; limit: number; hasMore: boolean; total: number };
type BranchOption = { id: string; name: string };

export default function PatientsPage() {
  const { user } = useSession();
  const { t, language } = useI18n();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [status, setStatus] = useState("Loading patient files");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [directoryView, setDirectoryView] = useState("all");
  const [patientType, setPatientType] = useState("all");
  const [branchId, setBranchId] = useState("all");
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [sortMode, setSortMode] = useState("created_newest");
  const [page, setPage] = useState(1);
  const [pageInfo, setPageInfo] = useState<PageInfo>({ page: 1, limit: 20, hasMore: false, total: 0 });

  useEffect(() => {
    const text = query.trim();
    const timer = window.setTimeout(() => void loadPatients(text, page), 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, directoryView, page, patientType, query, sortMode]);

  useEffect(() => {
    const requestedSearch = new URLSearchParams(window.location.search).get("search");
    if (requestedSearch) setQuery(requestedSearch);
  }, []);

  const filtered = patients;
  const resultSpansBranches = branchId === "all" && new Set(filtered.map((patient) => patient.branchId).filter(Boolean)).size > 1;
  const visibleStatus = status === "Loading" ? t("loading") : status === "Login required" ? t("loginRequired") : status === "Connection unavailable" ? t("connectionUnavailable") : status;

  async function loadPatients(search = query.trim(), requestedPage = page) {
    const token = sessionStorage.getItem("prijClinicToken");
    setStatus("Loading");
    setError("");

    try {
      const params = new URLSearchParams({ mode: "directory", view: directoryView, page: String(requestedPage), limit: "20", sort: sortMode });
      if (search) params.set("q", search);
      if (patientType !== "all") params.set("patientType", patientType);
      if (branchId !== "all") params.set("branchId", branchId);
      const response = await fetch(`${getApiBaseUrl()}/patients?${params.toString()}`, {
        credentials: "include",
        headers: token ? { authorization: `Bearer ${token}` } : undefined
      });

      if (response.status === 401) {
        setStatus("Login required");
        setPatients([]);
        return;
      }

      if (!response.ok) throw new Error(t("patientFilesCouldNotLoad"));
      const data = (await response.json()) as { patients?: Patient[]; pageInfo?: PageInfo; filters?: { branches?: BranchOption[] } };
      setPatients(data.patients ?? []);
      setPageInfo(data.pageInfo ?? { page: requestedPage, limit: 20, hasMore: false, total: data.patients?.length ?? 0 });
      setBranches(data.filters?.branches ?? []);
      setStatus("Loaded");
    } catch (loadError) {
      setPatients([]);
      setStatus("Connection unavailable");
      setError(loadError instanceof Error ? loadError.message : t("unableLoadPatientFiles"));
    }
  }

  function clearFilters() {
    setQuery("");
    setSortMode("created_newest");
    setDirectoryView("all");
    setPatientType("all");
    setBranchId("all");
    setPage(1);
  }

  async function toggleFavorite(patient: Patient) {
    const token = sessionStorage.getItem("prijClinicToken");
    const response = await fetch(`${getApiBaseUrl()}/patients/${patient.id}/favorite`, { method: patient.favorited ? "DELETE" : "POST", credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : undefined }).catch(() => null);
    if (!response?.ok) return setError(t("favoriteUpdateFailed"));
    if (directoryView === "favorites" && patient.favorited) void loadPatients(query.trim(), page);
    else setPatients((current) => current.map((row) => row.id === patient.id ? { ...row, favorited: !row.favorited } : row));
  }

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">{t("registration")}</p>
            <h1>{t("allPatients")}</h1>
          </div>
          <div className="form-actions">{user?.roles.some((role) => ["Owner", "Admin"].includes(role)) ? <Link className="button secondary" href="/patients/import">{t("importCsvXlsx")}</Link> : null}<Link className="button" href="/patients/new">
            <ThreeDMedicalIcon name="patients" size="sm" />
            {t("newPatientFile")}
          </Link></div>
        </div>
        <p className="muted">{t("patientDirectoryIntro")}</p>
      </section>

      <SafetyAlert />

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>{t("patientDirectory")}</h2>
            <p className="muted">{status === "Loaded" ? `${pageInfo.total} ${t("patientFilesShowing")} ${pageInfo.total ? (pageInfo.page - 1) * pageInfo.limit + 1 : 0}–${Math.min(pageInfo.page * pageInfo.limit, pageInfo.total)}` : visibleStatus}</p>
            <p className="muted">{t("browseActivePatients")}</p>
          </div>
          <button className="button secondary compact" onClick={() => void loadPatients(query.trim(), page)} type="button">
            <ThreeDMedicalIcon name="search" size="sm" tone="slate" />
            {t("refresh")}
          </button>
        </div>

        <div className="toolbar">
          <label>
            {t("directoryView")}
            <select onChange={(event) => { setDirectoryView(event.target.value); setPage(1); }} value={directoryView}>
              <option value="all">{t("allClinicPatients")}</option>
              <option value="today">{t("today")}</option>
              <option value="waiting">{t("waiting")}</option>
              <option value="recent">{t("recent")}</option>
              <option value="favorites">{t("favorites")}</option>
            </select>
          </label>
          <label>
            {t("patientSearchLabel")}
            <input
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              placeholder={t("patientSearchPlaceholder")}
              value={query}
            />
          </label>
          <label>
            {t("sortBy")}
            <select onChange={(event) => { setSortMode(event.target.value); setPage(1); }} value={sortMode}>
              <option value="created_newest">{t("createdNewest")}</option>
              <option value="created_oldest">{t("createdOldest")}</option>
              <option value="name_az">{t("nameAz")}</option>
              <option value="name_za">{t("nameZa")}</option>
              <option value="file_number">{t("fileNumber")}</option>
              <option value="last_visit_desc">{t("lastVisitRecent")}</option>
              <option value="age_year">{t("ageYearBirth")}</option>
            </select>
          </label>
        </div>

        <div className="toolbar more-filter-grid"><label>{t("patientType")}<select onChange={(event) => { setPatientType(event.target.value); setPage(1); }} value={patientType}><option value="all">{t("allPatientTypes")}</option>{patientTypeOptions.map((option) => <option key={option.value} value={option.value}>{patientTypeDisplay(option.value, language)}</option>)}</select></label><label>{t("branch")}<select onChange={(event) => { setBranchId(event.target.value); setPage(1); }} value={branchId}><option value="all">{t("allPermittedBranches")}</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label></div>
        <div className="form-actions"><button className="button secondary compact" type="button" onClick={clearFilters}>{t("clearFilters")}</button></div>

        {error ? <p className="form-error">{error}</p> : null}
        {status === "Login required" ? (
          <div className="empty-state">
            {t("signInBeforePatients")} <Link href="/login">{t("goToLogin")}</Link>
          </div>
        ) : null}

        {status === "Loading" ? <div className="skeleton" /> : null}
        {status !== "Loading" && filtered.length === 0 && status !== "Login required" ? (
          <div className="empty-state smart-empty-state">
            <ThreeDMedicalIcon name="files" size="sm" tone="slate" />
            <span>
              {t("noPatientFilesMatch")}
            </span>
            <Link className="button secondary compact" href="/patients/new">{t("newPatientFile")}</Link>
          </div>
        ) : null}

        {filtered.length > 0 ? (
          <div className="patient-result-list">
            {filtered.map((patient) => (
              <article className="patient-result-card" key={patient.id}>
                <Link className="patient-result-card-link" href={`/patients/${patient.id}`}>
                  <strong>{patientDisplayName(patient)}</strong>
                  <span>{patient.phone || t("notRecorded")} · {compactAge(patient)} · {patient.currentPhase?.phaseType ? phaseTypeLabel(patient.currentPhase.phaseType) : patientTypeDisplay(patient.patientType, language)}</span>
                  {query.trim().toLocaleLowerCase() === patient.medicalRecordNumber.toLocaleLowerCase() ? <small>{t("fileNumber")}: {patient.medicalRecordNumber}</small> : null}
                  {resultSpansBranches && patient.branch?.name ? <small className="badge patient-result-branch">{patient.branch.name}</small> : null}
                </Link>
                <button className="patient-result-favorite" type="button" aria-pressed={Boolean(patient.favorited)} aria-label={`${patient.favorited ? t("removeFavorite") : t("addFavorite")} ${patientDisplayName(patient)}`} onClick={() => void toggleFavorite(patient)}>{patient.favorited ? "★" : "☆"}</button>
              </article>
            ))}
            <div className="form-actions" aria-label={t("patientDirectory")}>
              <button className="button secondary compact" type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>{t("previous")}</button>
              <span className="muted">{t("page")} {pageInfo.page} {t("of")} {Math.max(1, Math.ceil(pageInfo.total / pageInfo.limit))}</span>
              <button className="button secondary compact" type="button" disabled={!pageInfo.hasMore} onClick={() => setPage((value) => value + 1)}>{t("next")}</button>
            </div>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}

function patientDisplayName(patient: Patient) {
  const name = `${patient.firstName} ${patient.lastName}`.trim();
  return name || "Patient file";
}

function compactAge(patient: Patient) {
  if (patient.dateOfBirth) return ageLabel(patient.dateOfBirth).replace(/^Age\s*/i, "").replace(/\s*years?$/i, "") + "y";
  return patient.yearOfBirth ? `${new Date().getUTCFullYear() - patient.yearOfBirth}y` : "Age —";
}

function patientTypeDisplay(value: string | null | undefined, language: "en" | "ar") {
  const normalized = String(value ?? "OTHER").toUpperCase();
  const canonical = ["OB", "PREGNANCY"].includes(normalized) ? "OBSTETRIC" : ["GYN", "WOMEN_HEALTH"].includes(normalized) ? "GYNECOLOGY" : normalized === "FERTILITY" ? "INFERTILITY" : normalized;
  const labels: Record<string, [string, string]> = {
    OBSTETRIC: ["Obstetric", "حمل وولادة"], HIGH_RISK_OBSTETRIC: ["High-risk obstetric", "حمل عالي الخطورة"], GYNECOLOGY: ["Gynecology", "أمراض النساء"], INFERTILITY: ["Infertility", "تأخر الإنجاب"], POSTPARTUM: ["Postpartum", "ما بعد الولادة"], PREVENTIVE_WELL_WOMAN: ["Preventive", "رعاية وقائية"], OTHER: ["Other", "أخرى"], GENERAL: ["Other", "أخرى"]
  };
  return (labels[canonical] ?? labels.OTHER)![language === "ar" ? 1 : 0];
}
