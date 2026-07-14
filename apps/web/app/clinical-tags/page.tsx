"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { AppShell } from "../mvp-page";
import { ClinicalTagPatient, listClinicalTagDefinitions, searchClinicalTagPatients } from "@/lib/clinical-tags";

const tagCategories: Record<string, string[]> = {
  "Patient type / workflow": ["Obstetric", "Gynecology", "Infertility", "Women's Health", "Oncology concern", "Procedure patient", "Follow-up patient", "Result review", "Post-op follow-up", "Emergency/urgent"],
  "Current pregnancy": ["Active pregnancy", "No active pregnancy", "Booking visit", "Antenatal follow-up", "First trimester", "Second trimester", "Third trimester", "Postpartum", "Multiple pregnancy", "Twins", "IVF pregnancy", "ICSI pregnancy", "IUI pregnancy", "Spontaneous conception"],
  "OB history": ["Previous CS", "Previous NVD", "Previous instrumental delivery", "Previous preterm birth", "Previous miscarriage", "Recurrent miscarriage/RPL", "Previous ectopic", "Previous molar pregnancy", "Previous IUFD/stillbirth", "Previous PPH", "Previous preeclampsia", "Previous GDM", "Previous placenta previa", "Previous placenta accreta", "Previous cerclage"],
  "Current pregnancy risks": ["High-risk pregnancy", "GDM", "Pregestational diabetes", "Chronic hypertension", "Gestational hypertension", "Preeclampsia", "HELLP risk", "Rh negative", "Anemia in pregnancy", "Placenta previa", "Accreta risk", "FGR/SGA", "Reduced fetal movement", "Malpresentation", "Breech", "Polyhydramnios", "Oligohydramnios", "PPROM", "Preterm labor", "Hyperemesis", "Cholestasis", "Thrombosis risk", "Anticoagulant use"],
  "Gynecology complaints": ["AUB", "Heavy menstrual bleeding", "Postmenopausal bleeding", "Amenorrhea", "Oligomenorrhea", "Dysmenorrhea", "Chronic pelvic pain", "Acute pelvic pain", "Vaginal discharge", "Vulvar itching", "Dyspareunia", "Urinary symptoms", "Breast pain", "Breast lump", "Nipple discharge"],
  "Gynecology diagnoses": ["Fibroid", "Adenomyosis", "Endometriosis", "Ovarian cyst", "Adnexal mass", "PID", "Vaginitis", "Cervicitis", "PCOS", "Endometrial polyp", "Cervical polyp", "Endometrial hyperplasia", "Menopause", "POI", "Galactorrhea"],
  "Infertility / ART": ["Primary infertility", "Secondary infertility", "PCOS infertility", "Endometriosis infertility", "Tubal factor", "Male factor", "Unexplained infertility", "Diminished ovarian reserve", "Poor responder", "Recurrent implantation failure", "Ovulation induction", "Folliculometry", "IUI", "IVF", "ICSI", "Frozen embryo transfer", "OHSS risk", "AMH low", "AMH high"],
  "Operations / procedures": ["CS", "D&C", "D&E/evacuation", "Hysteroscopy", "Laparoscopy", "Myomectomy", "Ovarian cystectomy", "Hysterectomy", "Ectopic surgery", "Cervical cerclage", "IUD insertion", "IUD removal", "Pap smear collection", "Colposcopy", "Cervical biopsy", "Endometrial biopsy", "Mastectomy", "Breast surgery", "Bariatric surgery", "Appendectomy", "Cholecystectomy"],
  "Oncology / screening": ["Abnormal Pap", "HPV positive", "CIN", "Colposcopy needed", "Cervical lesion", "Endometrial thickening", "Suspected endometrial cancer", "Ovarian mass", "High CA-125", "Breast cancer history", "Family history breast/ovarian cancer", "BRCA risk", "Lynch risk"],
  "Medical history": ["Diabetes", "Hypertension", "Thyroid disease", "Asthma", "Cardiac disease", "Renal disease", "Liver disease", "Epilepsy", "Autoimmune disease", "SLE", "Antiphospholipid syndrome", "DVT/PE history", "Thrombophilia", "Anemia", "Obesity", "Bariatric surgery history"],
  "Infection / STI": ["UTI", "Pyelonephritis", "GBS positive", "Chlamydia", "Gonorrhea", "Trichomonas", "HSV", "Syphilis", "HIV", "HBV", "HCV", "BV", "Candida", "TORCH concern", "CMV", "Toxoplasma", "Parvovirus", "Rubella non-immune", "Varicella non-immune"],
  "Safety / allergy": ["Drug allergy", "Penicillin allergy", "Anesthesia complication", "Bleeding tendency", "Anticoagulant use", "Steroid use", "Immunosuppressed", "Needs consent", "Needs document review", "Needs doctor review"],
  "Medication-related": ["Current medications", "Medication allergy", "Pregnancy medication review", "Lactation medication review", "Anticoagulant", "Insulin", "Metformin", "Antihypertensive", "Thyroid medication", "Progesterone", "Fertility medication", "NSAID use", "Teratogenic medication concern"],
  "Administrative / follow-up": ["Follow-up due", "Missed follow-up", "Pending labs", "Pending imaging", "Pending pathology", "Pending Pap/HPV", "Pending biopsy", "Pending consent", "Pending payment", "Needs phone update", "No contact saved"]
};

const aliases = "CS, Cesarean, Caesarean, C-section; D&C, DNC, Curettage; RPL, recurrent miscarriage; GDM, gestational diabetes; PIH, pregnancy hypertension; PMB, postmenopausal bleeding; AUB, abnormal uterine bleeding; ICSI, IVF, ART; PID, pelvic inflammatory disease.";

export default function ClinicalTagsPage() {
  const [activeCategory, setActiveCategory] = useState("Patient type / workflow");
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<ClinicalTagPatient[]>([]);
  const [status, setStatus] = useState("Search by tag");
  const [sortMode, setSortMode] = useState("last_visit");
  const [operator, setOperator] = useState("AND");
  const [historyFilter, setHistoryFilter] = useState("");

  async function runSearch(next = query) {
    setQuery(next);
    setStatus("Searching");
    try {
      const result = await searchClinicalTagPatients(next, operator, historyFilter);
      setPatients(result.patients);
      setStatus("Search complete");
    } catch (error) {
      setPatients([]);
      setStatus(error instanceof Error ? error.message : "Could not search clinical tags.");
    }
  }

  useEffect(() => {
    void listClinicalTagDefinitions().catch(() => undefined);
  }, []);

  const sortedPatients = useMemo(() => sortRows(patients, sortMode), [patients, sortMode]);

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Clinical Tag Search</p>
            <h1>Smart Clinical Search</h1>
            <p className="muted">Owner/Admin/Doctor cohort search by reviewed clinical tags. Search is audited.</p>
          </div>
        </div>
      </section>

      <section className="panel compact-panel">
        <div className="section-heading"><h2>Categories</h2><span className="badge">{status}</span></div>
        <div className="clinical-chip-row">
          {Object.entries(tagCategories).map(([category, tags]) => (
            <button className={`clinical-chip ${activeCategory === category ? "active" : ""}`} key={category} type="button" onClick={() => setActiveCategory(category)}>
              <strong>{category}</strong>
              <span>{tags.length} tags</span>
            </button>
          ))}
        </div>
        <div className="section-heading secondary-page-header"><h2>{activeCategory}</h2><span className="badge">{tagCategories[activeCategory]?.length ?? 0}</span></div>
        <div className="clinical-chip-row">
          {(tagCategories[activeCategory] ?? []).map((label) => (
            <button className={`clinical-chip ${query === label ? "active" : ""}`} key={label} type="button" onClick={() => void runSearch(label)}>
              <strong>{label}</strong>
            </button>
          ))}
        </div>
        <form className="form-grid" onSubmit={(event) => { event.preventDefault(); void runSearch(); }}>
          <label className="wide">Search one or more tags<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="PCOS + metformin, postmenopausal bleeding + hysterectomy" /></label>
          <label>Operator<select value={operator} onChange={(event) => setOperator(event.target.value)}><option value="AND">AND · all tags</option><option value="OR">OR · any tag</option><option value="NOT">NOT · exclude matches</option></select></label>
          <label>Tag status<select value={historyFilter} onChange={(event) => setHistoryFilter(event.target.value)}><option value="">Current and historical</option><option value="active">Active</option><option value="historical">Historical</option><option value="resolved">Resolved</option></select></label>
          <label>Sort<select value={sortMode} onChange={(event) => setSortMode(event.target.value)}><option value="last_visit">Last visit</option><option value="name">Name</option><option value="created">Created date</option><option value="tag_date">Tag date</option></select></label>
          <button className="button" type="submit"><ThreeDMedicalIcon name="search" size="sm" />Search</button>
        </form>
        <p className="muted">Aliases: {aliases}</p>
      </section>

      <section className="panel">
        <div className="section-heading"><h2>Matching patients</h2><span className="badge">{sortedPatients.length}</span></div>
        {sortedPatients.length === 0 ? <p className="empty-state"><ThreeDMedicalIcon name="patients" size="sm" tone="slate" /><span>No patients found for this tag.</span></p> : null}
        <div className="data-list">
          {sortedPatients.map((row) => (
            <article className="data-row" key={row.id}>
              <div className="data-row-header">
                <strong>{row.patientName || "Patient"} · {row.medicalRecordNumber}</strong>
                <span className="badge">{row.tagLabel}</span>
              </div>
              <p className="muted">{[row.patientType, row.currentPhase?.phaseType, row.tagLabel, row.historyStatus, row.tagDate?.slice(0, 10), row.lastVisit ? `Last visit ${new Date(row.lastVisit).toLocaleDateString()}` : null].filter(Boolean).join(" | ")}</p>
              {row.matchingTags?.length ? <div className="matching-evidence-list">{row.matchingTags.map((tag) => <article className="compact-panel" key={`${tag.code}-${tag.sourceRecordId ?? tag.date ?? "none"}`}><strong>{tag.label} · {tag.status ?? "recorded"}</strong><span className="muted">Source: {tag.sourceType ?? "record"}{tag.sourceRecordId ? ` · record ${tag.sourceRecordId.slice(0, 8)}` : ""}{tag.sourceEncounterId ? ` · encounter ${tag.sourceEncounterId.slice(0, 8)}` : ""}</span></article>)}</div> : null}
              {row.matchingMedications?.length ? <div className="clinical-chip-row">{row.matchingMedications.map((medication, index) => <span className="badge accent" key={`${medication.genericName}-${index}`}>{[medication.genericName, medication.familyName, medication.clinicalGroup, medication.status].filter(Boolean).join(" · ")}</span>)}</div> : null}
              <div className="form-actions">
                <Link className="button secondary compact" href={`/patients/${row.patientId}`}>Open patient file</Link>
                <Link className="button secondary compact" href={`/reception/check-in?patientId=${row.patientId}`}>Add to queue</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function sortRows(rows: ClinicalTagPatient[], mode: string) {
  return [...rows].sort((left, right) => {
    if (mode === "name") return String(left.patientName ?? "").localeCompare(String(right.patientName ?? ""));
    if (mode === "created") return String(right.tagDate ?? "").localeCompare(String(left.tagDate ?? ""));
    if (mode === "tag_date") return String(right.tagDate ?? "").localeCompare(String(left.tagDate ?? ""));
    return String(right.tagDate ?? "").localeCompare(String(left.tagDate ?? ""));
  });
}
