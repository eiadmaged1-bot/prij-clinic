"use client";

import { useMemo, useState } from "react";
import type { Patient } from "@/app/patients/[id]/patient-components";
import styles from "./clinical-input-foundation.module.css";

type Finding = {
  label: string;
  onset?: string;
  severity?: string;
  date?: string;
  note?: string;
  certainty?: string;
  source: string;
  status: string;
  author: string;
  timestamp: string;
  encounterId: string;
};
type ExamState = "normal" | "abnormal" | "not examined" | "declined" | "unable to assess";

export const complaintGroups: Record<string, string[]> = {
  Pain: ["Pelvic pain", "Lower abdominal pain", "Dysmenorrhea", "Dyspareunia"],
  Bleeding: ["Heavy bleeding", "Intermenstrual bleeding", "Postcoital bleeding", "Postmenopausal bleeding"],
  Menstrual: ["Missed period", "Irregular cycle", "Short cycle", "Prolonged period"],
  "Vaginal / vulval": ["Discharge", "Itching", "Vulval pain", "Vaginal dryness"],
  "Urinary / pelvic floor": ["Dysuria", "Frequency", "Incontinence", "Prolapse concern"],
  "Pregnancy concerns": ["Bleeding in pregnancy", "Pain in pregnancy", "Reduced fetal movement", "Fluid loss"],
  Fertility: ["Difficulty conceiving", "Ovulation concern", "Treatment follow-up"],
  Breast: ["Breast pain", "Breast lump", "Nipple discharge"],
  Menopause: ["Hot flushes", "Sleep concern", "Genitourinary symptoms"],
  Postoperative: ["Wound concern", "Postoperative pain", "Postoperative bleeding"]
};
export const historyGroups: Record<string, string[]> = {
  "Presenting complaint": ["Abnormal bleeding", "Pelvic pain", "Amenorrhea", "Vaginal discharge"],
  Menstrual: ["Regular cycles", "Irregular cycles", "Heavy periods", "Painful periods", "Fibroid", "Adenomyosis"],
  Obstetric: ["Previous pregnancy", "Previous C-section", "Pregnancy loss", "Preterm birth"],
  Gynecological: ["Fibroid", "Endometriosis", "Adenomyosis", "Ovarian cyst"],
  Medical: ["Hypertension", "Diabetes", "Thyroid disorder", "Thromboembolism"],
  Surgical: ["Pelvic surgery", "Myomectomy", "Hysteroscopy", "Laparoscopy"],
  "Operations / procedures": ["Cesarean section", "D&C", "Hysteroscopy", "Laparoscopy", "Myomectomy"],
  Medication: ["Current medication", "Hormonal treatment", "Anticoagulant"],
  Allergy: ["Drug allergy", "Latex allergy", "Other allergy"],
  Family: ["Breast cancer", "Ovarian cancer", "Thrombosis", "Diabetes"],
  "Social / safeguarding": ["Smoking", "Alcohol", "Support concern", "Safeguarding concern"]
};
const examSections = ["General", "Vitals", "Abdomen", "Obstetric", "Speculum", "Bimanual", "Breast"];
const anomalyTriggers = ["Fibroid", "Adenomyosis", "Uterine anomaly", "Endometrial abnormality", "Scar niche", "Abnormal uterus"];
const pregnancyLocations = ["Fundal", "Central cavity", "Lower uterine segment", "Cornual / interstitial concern", "Cesarean-scar region concern", "Cervical concern", "Right adnexal concern", "Left adnexal concern", "Pregnancy of unknown location", "Uncertain"];
const placentalLocations = ["Anterior fundal", "Posterior fundal", "Fundal central", "Anterior upper", "Posterior upper", "Anterior mid", "Posterior mid", "Right lateral", "Left lateral", "Anterior lower", "Posterior lower", "Marginal to os", "Reaching os", "Covering os", "Uncertain"];

export function ClinicalInputFoundation({ patient }: { patient: Patient }) {
  // Temporary frontend-only draft state. Persistence requires a separate audited encounter workflow.
  const [findings, setFindings] = useState<Finding[]>([]);
  const [detailLabel, setDetailLabel] = useState("");
  const [complaintView, setComplaintView] = useState<"Common" | "Relevant" | "Favorites" | "Recent" | "Search all">("Common");
  const [complaintSearch, setComplaintSearch] = useState("");
  const [historyGroup, setHistoryGroup] = useState("Menstrual");
  const [exam, setExam] = useState<Record<string, ExamState>>({});
  const [abnormalTags, setAbnormalTags] = useState<string[]>([]);
  const [uterineOpen, setUterineOpen] = useState(false);
  const [calendarMarks, setCalendarMarks] = useState<Record<number, string[]>>({});
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [pregnancyLocation, setPregnancyLocation] = useState("");
  const [placentalLocation, setPlacentalLocation] = useState("");
  const [monthOffset, setMonthOffset] = useState(0);
  const month = useMemo(() => {
    const date = new Date(); date.setDate(1); date.setMonth(date.getMonth() + monthOffset);
    return { label: date.toLocaleDateString(undefined, { month: "long", year: "numeric" }), days: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(), start: date.getDay() };
  }, [monthOffset]);
  const allComplaints = Object.values(complaintGroups).flat();
  const displayedComplaints = complaintView === "Search all"
    ? allComplaints.filter((tag) => tag.toLowerCase().includes(complaintSearch.toLowerCase()))
    : complaintView === "Favorites" ? allComplaints.slice(0, 6)
      : complaintView === "Recent" ? findings.slice(-6).map((item) => item.label)
        : complaintView === "Relevant" && patient.patientType?.includes("OBSTETRIC") ? complaintGroups["Pregnancy concerns"]! : complaintGroups.Pain!;

  function selectFinding(label: string, source = "history") {
    const exists = findings.some((item) => item.label === label);
    if (exists) setDetailLabel(label);
    else setFindings((current) => [...current, { label, source, status: source === "history" ? "patient-reported" : "observed", author: "Current doctor", timestamp: new Date().toISOString(), encounterId: "Current visit draft" }]);
    if (anomalyTriggers.includes(label)) setUterineOpen(true);
  }
  function updateFinding(label: string, patch: Partial<Finding>) {
    setFindings((current) => current.map((item) => item.label === label ? { ...item, ...patch } : item));
  }
  const detail = findings.find((item) => item.label === detailLabel);
  const lowerLocation = /lower|scar|cervical|os/i.test(`${pregnancyLocation} ${placentalLocation}`);
  const obstetricContext = patient.patientType?.includes("OBSTETRIC") ?? false;
  const menstrualContext = !obstetricContext || patient.patientType === "INFERTILITY";

  return <section className={styles.foundation} aria-label="Clinical input draft">
    <p className={styles.draftNotice}>Unsigned local draft · Not saved to the patient record</p>
    <header className={styles.heading}><div><p className={styles.eyebrow}>Clinical input</p><h2>Current Visit</h2></div><span className={styles.review}>Doctor confirmation required</span></header>

    <details open className={styles.section}><summary>Smart complaint tags</summary>
      <div className={styles.lenses}>{(["Common", "Relevant", "Favorites", "Recent", "Search all"] as const).map((view) => <button className={complaintView === view ? styles.active : ""} key={view} type="button" onClick={() => setComplaintView(view)}>{view}</button>)}</div>
      {complaintView === "Search all" ? <input aria-label="Search all complaint tags" placeholder="Search all complaints" value={complaintSearch} onChange={(event) => setComplaintSearch(event.target.value)} /> : null}
      <div className={styles.tags}>{displayedComplaints.map((tag) => <button className={findings.some((item) => item.label === tag) ? styles.selected : ""} key={tag} type="button" onClick={() => selectFinding(tag)}>{tag}</button>)}</div>
      <div className={styles.groupGrid}>{Object.entries(complaintGroups).map(([group, tags]) => <details key={group}><summary>{group}</summary><div className={styles.tags}>{tags.map((tag) => <button key={tag} type="button" onClick={() => selectFinding(tag)}>{tag}</button>)}</div></details>)}</div>
    </details>

    {detail ? <FindingEditor finding={detail} onChange={(patch) => updateFinding(detail.label, patch)} onClose={() => setDetailLabel("")} /> : null}

    <details open className={styles.section}><summary>History</summary>
      <div className={styles.lenses}>{Object.keys(historyGroups).map((group) => <button className={historyGroup === group ? styles.active : ""} key={group} type="button" onClick={() => setHistoryGroup(group)}>{group}</button>)}</div>
      <div className={styles.tags}>{historyGroups[historyGroup]?.map((tag) => <button className={findings.some((item) => item.label === tag) ? styles.selected : ""} key={tag} type="button" onClick={() => selectFinding(tag)}>{tag}</button>)}</div>
    </details>

    {menstrualContext ? <details className={styles.section}><summary>Menstrual calendar</summary>
      <div className={styles.calendarHeader}><button type="button" onClick={() => setMonthOffset((value) => value - 1)}>‹</button><strong>{month.label}</strong><button type="button" onClick={() => setMonthOffset((value) => value + 1)}>›</button></div>
      <div className={styles.legend}>Period · Spotting · Heavy · Pain · Intermenstrual · Postcoital · Medication / hormone · Pregnancy test · LMP · Uncertain LMP</div>
      <div className={styles.calendar}>{Array.from({ length: month.start }, (_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: month.days }, (_, index) => index + 1).map((day) => <button className={calendarMarks[day]?.length ? styles.markedDay : ""} key={day} type="button" onClick={() => setSelectedDay(day)}><b>{day}</b><small>{calendarMarks[day]?.slice(0, 2).join(" · ")}</small></button>)}</div>
      <p className={styles.cycle}>Current cycle day: select an LMP day</p>
      {selectedDay ? <DayEditor day={selectedDay} values={calendarMarks[selectedDay] ?? []} onChange={(values) => setCalendarMarks((current) => ({ ...current, [selectedDay]: values }))} onClose={() => setSelectedDay(null)} /> : null}
    </details> : null}

    <details open className={styles.section}><summary>Examination</summary>
      <div className={styles.examGrid}>{examSections.map((section) => <details className={styles.examCard} key={section}><summary>{section}<span>{exam[section] ?? "Not examined"}</span></summary><div className={styles.statuses}>{(["normal", "abnormal", "not examined", "declined", "unable to assess"] as ExamState[]).map((status) => <button className={exam[section] === status ? styles.active : ""} key={status} type="button" onClick={() => setExam((current) => ({ ...current, [section]: status }))}>{status}</button>)}</div>{exam[section] === "abnormal" ? <><div className={styles.tags}>{(section === "Bimanual" ? anomalyTriggers : [`Abnormal ${section.toLowerCase()} finding`, "Tenderness", "Other finding"]).map((tag) => <button key={tag} type="button" onClick={() => { setAbnormalTags((current) => [...new Set([...current, tag])]); selectFinding(tag, "examination"); }}>{tag}</button>)}</div><input placeholder="Structured examination note" aria-label={`${section} examination note`} /></> : null}</details>)}</div>
      {abnormalTags.length ? <p className={styles.selection}>Selected examination findings: {abnormalTags.join(", ")}</p> : null}
    </details>

    {uterineOpen ? <UterineAnomalyCard onClose={() => setUterineOpen(false)} /> : null}

    {obstetricContext ? <details className={styles.section}><summary>Pregnancy and placenta location</summary>
      <p className={styles.caution}>Approximate observation only. This diagram does not diagnose; doctor confirmation is required.</p>
      <div className={styles.diagramGrid}><UterusDiagram selected={pregnancyLocation} onSelect={(value) => { setPregnancyLocation(value); selectFinding(value, "ultrasound"); }} /><div><h3>Pregnancy location</h3><div className={styles.tags}>{pregnancyLocations.map((value) => <button className={pregnancyLocation === value ? styles.selected : ""} key={value} type="button" onClick={() => { setPregnancyLocation(value); selectFinding(value, "ultrasound"); }}>{value}</button>)}</div><h3>Placental / chorionic location</h3><div className={styles.tags}>{placentalLocations.map((value) => <button className={placentalLocation === value ? styles.selected : ""} key={value} type="button" onClick={() => { setPlacentalLocation(value); selectFinding(value, "ultrasound"); }}>{value}</button>)}</div></div></div>
      {lowerLocation ? <div className={styles.lowerFields}><label>Edge to internal os (mm)<input inputMode="decimal" /></label><label>Covers os<select><option>Uncertain</option><option>Yes</option><option>No</option></select></label><label>Approach<select><option>Transabdominal</option><option>Transvaginal</option></select></label><label>Previous C-section<select><option>Uncertain</option><option>Yes</option><option>No</option></select></label><label>Bleeding<select><option>None reported</option><option>Reported</option></select></label><label>Follow-up required<select><option>Yes</option><option>No</option><option>Uncertain</option></select></label><label>PAS risk review<select><option>Required</option><option>Completed</option><option>Not indicated</option></select></label></div> : null}
    </details> : null}
  </section>;
}

function FindingEditor({ finding, onChange, onClose }: { finding: Finding; onChange: (patch: Partial<Finding>) => void; onClose: () => void }) {
  return <section className={styles.editor}><header><strong>{finding.label}</strong><button type="button" onClick={onClose}>Close</button></header><div className={styles.fields}><label>Onset<input value={finding.onset ?? ""} onChange={(event) => onChange({ onset: event.target.value })} /></label><label>Severity<select value={finding.severity ?? ""} onChange={(event) => onChange({ severity: event.target.value })}><option value="">Select</option><option>Mild</option><option>Moderate</option><option>Severe</option></select></label><label>Date<input type="date" value={finding.date ?? ""} onChange={(event) => onChange({ date: event.target.value })} /></label><label>Certainty<select value={finding.certainty ?? ""} onChange={(event) => onChange({ certainty: event.target.value })}><option value="">Select</option><option>Uncertain</option><option>Probable</option><option>Definite</option></select></label><label>Source<select value={finding.source} onChange={(event) => onChange({ source: event.target.value })}>{["history", "examination", "ultrasound", "external report"].map((value) => <option key={value}>{value}</option>)}</select></label><label>Status<select value={finding.status} onChange={(event) => onChange({ status: event.target.value })}>{["patient-reported", "observed", "suspected", "confirmed", "resolved", "entered in error"].map((value) => <option key={value}>{value}</option>)}</select></label><label className={styles.wide}>Note<textarea value={finding.note ?? ""} onChange={(event) => onChange({ note: event.target.value })} /></label></div><small>{finding.author} · {new Date(finding.timestamp).toLocaleString()} · {finding.encounterId}</small></section>;
}

function DayEditor({ day, values, onChange, onClose }: { day: number; values: string[]; onChange: (values: string[]) => void; onClose: () => void }) {
  const options = ["None", "Light bleeding", "Moderate bleeding", "Heavy bleeding", "Clots", "Spotting", "Discharge", "Medication", "Pregnancy test", "LMP", "Uncertain LMP"];
  return <section className={styles.editor}><header><strong>Day {day}</strong><button type="button" onClick={onClose}>Done</button></header><div className={styles.tags}>{options.map((value) => <button className={values.includes(value) ? styles.selected : ""} key={value} type="button" onClick={() => onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value])}>{value}</button>)}</div><label>Pain 0–10<input type="range" min="0" max="10" /></label><label>Note<textarea /></label></section>;
}

function UterineAnomalyCard({ onClose }: { onClose: () => void }) {
  return <details open className={`${styles.section} ${styles.anomaly}`}><summary>Dynamic uterine finding card<button type="button" onClick={(event) => { event.preventDefault(); onClose(); }}>Close</button></summary><div className={styles.fields}>{["Position", "Size", "Shape", "Mobility", "Tenderness", "Endometrium", "Myometrium", "Fibroids", "Adenomyosis", "Congenital anomaly", "Scar / niche", "Other finding"].map((field) => <label key={field}>{field}<input /></label>)}</div></details>;
}

function UterusDiagram({ selected, onSelect }: { selected: string; onSelect: (value: string) => void }) {
  return <svg className={styles.diagram} viewBox="0 0 260 300" role="img" aria-label="Approximate clickable uterus location diagram"><path d="M48 45 C75 15 185 15 212 45 L192 205 C180 255 80 255 68 205 Z" fill="#e9f4f2" stroke="#176b63" strokeWidth="4"/><path d="M105 244 L105 288 M155 244 L155 288" stroke="#176b63" strokeWidth="9" strokeLinecap="round"/><DiagramPoint x={130} y={65} label="Fundal" selected={selected} onSelect={onSelect}/><DiagramPoint x={130} y={130} label="Central cavity" selected={selected} onSelect={onSelect}/><DiagramPoint x={130} y={205} label="Lower uterine segment" selected={selected} onSelect={onSelect}/><DiagramPoint x={70} y={72} label="Left adnexal concern" selected={selected} onSelect={onSelect}/><DiagramPoint x={190} y={72} label="Right adnexal concern" selected={selected} onSelect={onSelect}/></svg>;
}
function DiagramPoint({ x, y, label, selected, onSelect }: { x: number; y: number; label: string; selected: string; onSelect: (value: string) => void }) {
  return <g role="button" tabIndex={0} aria-label={label} onClick={() => onSelect(label)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelect(label); }}><circle cx={x} cy={y} r="17" fill={selected === label ? "#176b63" : "#fff"} stroke="#176b63" strokeWidth="3"/><text x={x} y={y + 4} textAnchor="middle" fontSize="10" fill={selected === label ? "#fff" : "#17333a"}>{label.split(" ")[0]}</text></g>;
}
