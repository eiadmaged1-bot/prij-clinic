import fs from "node:fs";
import path from "node:path";

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function write(relative, content) {
  fs.writeFileSync(path.join(root, relative), content, "utf8");
}

function mustReplace(content, oldValue, newValue, label) {
  const count = content.split(oldValue).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one target, found ${count}`);
  return content.replace(oldValue, newValue);
}

function replaceBetween(content, start, end, replacement, label) {
  const startIndex = content.indexOf(start);
  const endIndex = content.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) throw new Error(`${label}: boundary not found`);
  if (content.indexOf(start, startIndex + start.length) >= 0) throw new Error(`${label}: duplicate start boundary`);
  return content.slice(0, startIndex) + replacement + "\n\n" + content.slice(endIndex);
}

const activePath = "apps/web/components/clinic/ActiveVisitWorkspace.tsx";
let active = read(activePath);

active = mustReplace(
  active,
  `import {\n  Action,\n  COMPLAINT_LIFECYCLE_STATUSES,\n  complaintLifecycleFromEncounter,\n  complaintStatusLabel,\n  hasAnyRolePermission\n} from "@prij-clinic/shared";`,
  `import {\n  Action,\n  COMPLAINT_LIFECYCLE_STATUSES,\n  calculateEddCandidate,\n  complaintLifecycleFromEncounter,\n  complaintStatusLabel,\n  confirmEddCandidate,\n  hasAnyRolePermission,\n  isPregnancyMenstrualUiSuppressed,\n  type EddCandidate,\n  type EddConfirmation,\n  type EddSource\n} from "@prij-clinic/shared";`,
  "shared pregnancy dating imports"
);

active = mustReplace(
  active,
  `  datingConfirmationDate?: string;\n  datingClinician?: string;\n  datingCorrectionReason?: string;`,
  `  eddMode?: "manual" | "calculated";\n  eddSource?: EddSource;\n  datingSourceDate?: string;\n  datingFormula?: string;\n  datingConfirmationDate?: string;\n  datingClinician?: string;\n  datingCorrectionReason?: string;\n  datingHistory?: EddConfirmation["datingHistory"];\n  manualEdd?: string;\n  knownConceptionDate?: string;\n  ivfTransferDate?: string;\n  ivfEmbryoAgeDays?: "3" | "5";\n  ultrasoundScanDate?: string;\n  ultrasoundGestationalWeeks?: string;\n  ultrasoundGestationalDays?: string;\n  ultrasoundEdd?: string;\n  replaceConfirmedEdd?: boolean;\n  pregnancyBleedingStatus?: string;\n  pregnancyBleedingOnsetDate?: string;`,
  "reproductive snapshot dating fields"
);

const editor = `function ReproductiveStatusEditor({ context, value, previous, pregnancyEpisode, infertilityEpisode, onChange }: { context: string; value?: ReproductiveSnapshot; previous?: ReproductiveSnapshot; pregnancyEpisode: Record<string, unknown> | null; infertilityEpisode: Record<string, unknown> | null; onChange: (value: ReproductiveSnapshot) => void }) {
  const episodeId = String((context === "pregnancy" ? pregnancyEpisode?.id : infertilityEpisode?.id) ?? "");
  const current: ReproductiveSnapshot = value ?? { context, episodeId: episodeId || undefined, changeStatus: previous ? undefined : "initial", abnormalFlags: [], baselineProfile: previous?.baselineProfile };
  const [candidate, setCandidate] = useState<EddCandidate | null>(null);
  const [datingError, setDatingError] = useState("");
  const update = (patch: Partial<ReproductiveSnapshot>) => {
    const next = { ...current, context, episodeId: episodeId || current.episodeId, ...patch };
    onChange({
      ...next,
      baselineProfile: previous?.baselineProfile ?? current.baselineProfile ?? {
        usualRegularity: next.regularity,
        usualCycleLength: next.cycleLength,
        usualBleedingDuration: next.bleedingDuration,
        usualFlow: next.flow,
        longstandingDysmenorrhea: next.abnormalFlags?.includes("dysmenorrhea"),
        menopauseStatus: next.menopauseStatus
      }
    });
  };
  const noChange = () => previous && onChange({ ...previous, context, episodeId: episodeId || previous.episodeId, encounterId: undefined, confirmedAt: undefined, confirmedByUserId: undefined, previousSnapshotEncounterId: previous.encounterId, changeStatus: "no_change" });
  const menstrualFieldsSuppressed = isPregnancyMenstrualUiSuppressed(context);
  const abnormalOptions = context === "pregnancy"
    ? []
    : context === "postpartum"
      ? ["abnormal bleeding", "infection warning", "wound concern"]
      : context === "menopause" || context === "hysterectomy"
        ? ["postmenopausal bleeding", "new bleeding", "vaginal discharge"]
        : ["amenorrhea", "oligomenorrhea", "polymenorrhea", "hypomenorrhea", "heavy menstrual bleeding", "dysmenorrhea", "intermenstrual bleeding", "postcoital bleeding"];
  const toggleFlag = (flag: string) => update({ changeStatus: "changed", abnormalFlags: current.abnormalFlags?.includes(flag) ? current.abnormalFlags.filter((item) => item !== flag) : [...(current.abnormalFlags ?? []), flag] });
  const pregnancyLmp = String(pregnancyEpisode?.lmpDate ?? "");
  const pregnancyEdd = String(pregnancyEpisode?.estimatedDueDate ?? "");
  const authoritativeEdd = dateOnly(current.edd ?? pregnancyEdd);
  const baseline = current.baselineProfile ?? previous?.baselineProfile;
  const eddMode = current.eddMode ?? "manual";
  const eddSource: EddSource = current.eddSource ?? (eddMode === "manual" ? "MANUAL" : "LMP");

  const previewEdd = () => {
    try {
      let nextCandidate: EddCandidate;
      if (eddMode === "manual") {
        nextCandidate = calculateEddCandidate({ mode: "manual", source: "MANUAL", manualEdd: current.manualEdd ?? "", sourceDate: current.datingSourceDate || current.datingConfirmationDate || current.manualEdd });
      } else if (eddSource === "LMP") {
        nextCandidate = calculateEddCandidate({ mode: "calculated", source: "LMP", lmpDate: current.lmp ?? pregnancyLmp });
      } else if (eddSource === "KNOWN_CONCEPTION") {
        nextCandidate = calculateEddCandidate({ mode: "calculated", source: "KNOWN_CONCEPTION", conceptionDate: current.knownConceptionDate ?? "" });
      } else if (eddSource === "IVF_ET") {
        nextCandidate = calculateEddCandidate({ mode: "calculated", source: "IVF_ET", transferDate: current.ivfTransferDate ?? "", embryoAgeDays: current.ivfEmbryoAgeDays === "3" ? 3 : 5 });
      } else {
        nextCandidate = calculateEddCandidate({
          mode: "calculated",
          source: "ULTRASOUND",
          scanDate: current.ultrasoundScanDate ?? "",
          ...(current.ultrasoundEdd ? { ultrasoundEdd: current.ultrasoundEdd } : {}),
          ...(current.ultrasoundGestationalWeeks !== undefined && current.ultrasoundGestationalWeeks !== "" ? { gestationalWeeks: Number(current.ultrasoundGestationalWeeks) } : {}),
          ...(current.ultrasoundGestationalDays !== undefined && current.ultrasoundGestationalDays !== "" ? { gestationalDays: Number(current.ultrasoundGestationalDays) } : {})
        });
      }
      setCandidate(nextCandidate);
      setDatingError("");
    } catch (error) {
      setCandidate(null);
      setDatingError(error instanceof Error ? error.message : "Could not calculate an EDD candidate.");
    }
  };

  const confirmCandidate = () => {
    if (!candidate) {
      setDatingError("Create a Calculation preview before confirming the authoritative EDD.");
      return;
    }
    try {
      const currentConfirmation: Partial<EddConfirmation> | null = authoritativeEdd ? {
        edd: authoritativeEdd,
        eddMode: current.eddMode ?? "manual",
        datingMethod: (current.eddSource ?? current.datingMethod ?? String(pregnancyEpisode?.datingMethod ?? "MANUAL")) as EddSource,
        datingSourceDate: current.datingSourceDate,
        datingConfirmationDate: current.datingConfirmationDate,
        datingClinician: current.datingClinician,
        datingHistory: current.datingHistory ?? []
      } : null;
      const confirmed = confirmEddCandidate({
        candidate,
        current: currentConfirmation,
        clinician: current.datingClinician ?? "",
        confirmationDate: current.datingConfirmationDate ?? "",
        replaceConfirmed: current.replaceConfirmedEdd === true,
        correctionReason: current.datingCorrectionReason
      });
      update({
        ...confirmed,
        eddSource: confirmed.datingMethod,
        changeStatus: "changed",
        replaceConfirmedEdd: false
      });
      setCandidate(null);
      setDatingError("");
    } catch (error) {
      setDatingError(error instanceof Error ? error.message : "Could not confirm the authoritative EDD.");
    }
  };

  const baselineText = baseline
    ? [baseline.usualRegularity, baseline.usualCycleLength ? \`${'${baseline.usualCycleLength}'}-day interval\` : "", baseline.usualBleedingDuration ? \`${'${baseline.usualBleedingDuration}'}-day bleeding\` : "", baseline.usualFlow].filter(Boolean).join(" · ") || "Baseline recorded"
    : "No pre-pregnancy menstrual baseline recorded.";

  return <section className="reproductive-status-editor wide">
    <div className="section-heading"><div><h3>{reproductiveTitle(context)}</h3><p className="muted">Visit-linked structured snapshot. Previous records remain unchanged.</p></div>{previous ? <button className="button secondary compact" type="button" onClick={noChange}>No change since previous visit</button> : null}</div>
    {previous ? <p className="reproductive-previous-summary">Previous: {snapshotSummary(previous)}</p> : null}
    {context === "pregnancy" && (pregnancyLmp || pregnancyEdd) ? <div className="notice">Active pregnancy dating · LMP {dateOnly(pregnancyLmp) || "Not recorded"} · EDD {dateOnly(pregnancyEdd) || "Not recorded"} · {String(pregnancyEpisode?.datingMethod ?? "Dating method not recorded")}</div> : null}
    {menstrualFieldsSuppressed ? <div className="notice reproductive-baseline-summary"><strong>Pre-pregnancy menstrual baseline</strong><span>{baselineText}. This history is preserved and is not treated as active menstruation during pregnancy.</span></div> : null}
    <div className="form-grid reproductive-fields">
      {context !== "postpartum" && context !== "hysterectomy" ? <label>{context === "pregnancy" ? "Pregnancy dating LMP (historical)" : "LMP"}<input type="date" value={dateOnly(current.lmp ?? (context === "pregnancy" ? pregnancyLmp : ""))} onChange={(event) => update({ lmp: event.target.value, changeStatus: "changed" })} /></label> : null}
      {context === "pregnancy" ? <>
        <label>LMP certainty<select value={current.lmpCertainty ?? ""} onChange={(event) => update({ lmpCertainty: event.target.value, changeStatus: "changed" })}><option value="">Select</option><option>certain</option><option>uncertain</option></select></label>
        <label>Pregnancy bleeding status<select value={current.pregnancyBleedingStatus ?? ""} onChange={(event) => update({ pregnancyBleedingStatus: event.target.value, changeStatus: "changed" })}><option value="">None recorded</option><option value="none">No bleeding</option><option value="spotting">Spotting</option><option value="light">Light bleeding</option><option value="moderate">Moderate bleeding</option><option value="heavy">Heavy bleeding</option><option value="resolved">Resolved</option></select></label>
        <label>Pregnancy bleeding onset<input type="date" value={current.pregnancyBleedingOnsetDate ?? ""} onChange={(event) => update({ pregnancyBleedingOnsetDate: event.target.value, changeStatus: "changed" })} /></label>
        <label>EDD mode<select value={eddMode} onChange={(event) => { const mode = event.target.value as "manual" | "calculated"; update({ eddMode: mode, eddSource: mode === "manual" ? "MANUAL" : "LMP", changeStatus: "changed" }); setCandidate(null); setDatingError(""); }}><option value="manual">Manual</option><option value="calculated">Calculated</option></select></label>
        {eddMode === "calculated" ? <label>Calculation source<select value={eddSource} onChange={(event) => { update({ eddSource: event.target.value as EddSource, changeStatus: "changed" }); setCandidate(null); }}><option value="LMP">LMP</option><option value="ULTRASOUND">Ultrasound</option><option value="IVF_ET">IVF / embryo transfer</option><option value="KNOWN_CONCEPTION">Known conception date</option></select></label> : null}
        {eddMode === "manual" ? <><label>Proposed manual EDD<input type="date" value={current.manualEdd ?? ""} onChange={(event) => update({ manualEdd: event.target.value, datingSourceDate: event.target.value, changeStatus: "changed" })} /></label></> : null}
        {eddMode === "calculated" && eddSource === "KNOWN_CONCEPTION" ? <label>Known conception date<input type="date" value={current.knownConceptionDate ?? ""} onChange={(event) => update({ knownConceptionDate: event.target.value, changeStatus: "changed" })} /></label> : null}
        {eddMode === "calculated" && eddSource === "IVF_ET" ? <><label>Embryo transfer date<input type="date" value={current.ivfTransferDate ?? ""} onChange={(event) => update({ ivfTransferDate: event.target.value, changeStatus: "changed" })} /></label><label>Embryo age<select value={current.ivfEmbryoAgeDays ?? "5"} onChange={(event) => update({ ivfEmbryoAgeDays: event.target.value as "3" | "5", changeStatus: "changed" })}><option value="5">Day 5</option><option value="3">Day 3</option></select></label></> : null}
        {eddMode === "calculated" && eddSource === "ULTRASOUND" ? <><label>Ultrasound scan date<input type="date" value={current.ultrasoundScanDate ?? ""} onChange={(event) => update({ ultrasoundScanDate: event.target.value, changeStatus: "changed" })} /></label><label>Explicit scan EDD (optional)<input type="date" value={current.ultrasoundEdd ?? ""} onChange={(event) => update({ ultrasoundEdd: event.target.value, changeStatus: "changed" })} /></label><label>GA weeks<input type="number" min="0" max="40" value={current.ultrasoundGestationalWeeks ?? ""} onChange={(event) => update({ ultrasoundGestationalWeeks: event.target.value, changeStatus: "changed" })} /></label><label>GA days<input type="number" min="0" max="6" value={current.ultrasoundGestationalDays ?? ""} onChange={(event) => update({ ultrasoundGestationalDays: event.target.value, changeStatus: "changed" })} /></label></> : null}
        <div className="wide form-actions"><button className="button secondary" type="button" onClick={previewEdd}>Preview EDD</button></div>
        {candidate ? <div className="notice wide"><strong>Calculation preview</strong>: {candidate.edd} from {candidate.source} ({candidate.formula}) · clinician confirmation required.</div> : null}
        {datingError ? <p className="alert warning wide">{datingError}</p> : null}
        <label>Authoritative EDD<input type="date" value={authoritativeEdd} readOnly /></label>
        <label>Confirmation date<input type="date" value={current.datingConfirmationDate ?? ""} onChange={(event) => update({ datingConfirmationDate: event.target.value, changeStatus: "changed" })} /></label>
        <label>Dating clinician<input value={current.datingClinician ?? ""} onChange={(event) => update({ datingClinician: event.target.value, changeStatus: "changed" })} /></label>
        {authoritativeEdd && candidate && authoritativeEdd !== candidate.edd ? <label className="checkbox-row wide"><input type="checkbox" checked={current.replaceConfirmedEdd === true} onChange={(event) => update({ replaceConfirmedEdd: event.target.checked, changeStatus: "changed" })} />Explicitly replace the confirmed EDD</label> : null}
        <label className="wide">Discrepancy / correction reason<input value={current.datingCorrectionReason ?? ""} onChange={(event) => update({ datingCorrectionReason: event.target.value, changeStatus: "changed" })} /></label>
        <div className="wide form-actions"><button className="button" type="button" disabled={!candidate} onClick={confirmCandidate}>Confirm authoritative EDD</button>{current.datingHistory?.length ? <span className="badge">datingHistory: {current.datingHistory.length} prior confirmed EDD</span> : null}</div>
      </> : null}
      {["gynecology", "infertility", "general"].includes(context) ? <>
        <label>Regularity<select value={current.regularity ?? ""} onChange={(event) => update({ regularity: event.target.value, changeStatus: "changed" })}><option value="">Select</option><option>regular</option><option>irregular</option><option>amenorrhea</option><option>unknown</option></select></label>
        <label>Cycle interval (days)<input type="number" min="15" max="180" value={current.cycleLength ?? ""} onChange={(event) => update({ cycleLength: event.target.value, changeStatus: "changed" })} /></label>
        <label>Bleeding duration (days)<input type="number" min="0" max="30" value={current.bleedingDuration ?? ""} onChange={(event) => update({ bleedingDuration: event.target.value, changeStatus: "changed" })} /></label>
        <label>Flow<select value={current.flow ?? ""} onChange={(event) => update({ flow: event.target.value, changeStatus: "changed" })}><option value="">Select</option><option>light</option><option>moderate</option><option>heavy</option><option>variable</option></select></label>
      </> : null}
      {context === "infertility" ? <>
        <label>Induction-cycle status<input value={current.inductionStatus ?? ""} onChange={(event) => update({ inductionStatus: event.target.value, changeStatus: "changed" })} /></label>
        <label>Cycle number<input type="number" min="1" value={current.cycleNumber ?? ""} onChange={(event) => update({ cycleNumber: event.target.value, changeStatus: "changed" })} /></label>
        <label>Trigger date<input type="date" value={current.triggerDate ?? ""} onChange={(event) => update({ triggerDate: event.target.value, changeStatus: "changed" })} /></label>
        <label>Expected ovulation<input type="date" value={current.expectedOvulationDate ?? ""} onChange={(event) => update({ expectedOvulationDate: event.target.value, changeStatus: "changed" })} /></label>
        <label>Next scan<input type="date" value={current.nextScanDate ?? ""} onChange={(event) => update({ nextScanDate: event.target.value, changeStatus: "changed" })} /></label>
      </> : null}
      {context === "postpartum" ? <>
        <label>Delivery date<input type="date" value={current.deliveryDate ?? ""} onChange={(event) => update({ deliveryDate: event.target.value, changeStatus: "changed" })} /></label>
        <label>Delivery mode<input value={current.deliveryMode ?? ""} onChange={(event) => update({ deliveryMode: event.target.value, changeStatus: "changed" })} /></label>
        <label>Lochia status<input value={current.lochiaStatus ?? ""} onChange={(event) => update({ lochiaStatus: event.target.value, changeStatus: "changed" })} /></label>
        <label>Return of menstruation<select value={current.returnOfMenstruation ?? ""} onChange={(event) => update({ returnOfMenstruation: event.target.value, changeStatus: "changed" })}><option value="">Select</option><option>not returned</option><option>returned</option><option>uncertain</option></select></label>
        <label>Breastfeeding<input value={current.breastfeeding ?? ""} onChange={(event) => update({ breastfeeding: event.target.value, changeStatus: "changed" })} /></label>
        <label>Contraception plan<input value={current.contraception ?? ""} onChange={(event) => update({ contraception: event.target.value, changeStatus: "changed" })} /></label>
      </> : null}
      {context === "menopause" ? <>
        <label>Menopause status<select value={current.menopauseStatus ?? ""} onChange={(event) => update({ menopauseStatus: event.target.value, changeStatus: "changed" })}><option value="">Select</option><option>perimenopause</option><option>menopause</option><option>postmenopause</option></select></label>
        <label>Last natural period<input type="date" value={current.lastNaturalPeriod ?? ""} onChange={(event) => update({ lastNaturalPeriod: event.target.value, changeStatus: "changed" })} /></label>
        <label>Hormone therapy<input value={current.hormoneTherapy ?? ""} onChange={(event) => update({ hormoneTherapy: event.target.value, changeStatus: "changed" })} /></label>
      </> : null}
      {context === "hysterectomy" ? <>
        <label>Hysterectomy status<input value={current.hysterectomyStatus ?? ""} onChange={(event) => update({ hysterectomyStatus: event.target.value, changeStatus: "changed" })} /></label>
        <label>Hysterectomy date<input type="date" value={current.hysterectomyDate ?? ""} onChange={(event) => update({ hysterectomyDate: event.target.value, changeStatus: "changed" })} /></label>
        <label>Cervix<select value={current.cervixStatus ?? ""} onChange={(event) => update({ cervixStatus: event.target.value, changeStatus: "changed" })}><option value="">Select</option><option>retained</option><option>removed</option><option>unknown</option></select></label>
        <label>Ovaries<select value={current.ovariesStatus ?? ""} onChange={(event) => update({ ovariesStatus: event.target.value, changeStatus: "changed" })}><option value="">Select</option><option>retained</option><option>removed</option><option>one retained</option><option>unknown</option></select></label>
      </> : null}
      {!menstrualFieldsSuppressed && abnormalOptions.length ? <div className="wide reproductive-flags">{abnormalOptions.map((flag) => <label className="checkbox-row" key={flag}><input type="checkbox" checked={current.abnormalFlags?.includes(flag) ?? false} onChange={() => toggleFlag(flag)} />{flag}</label>)}</div> : null}
      <label className="wide">{context === "pregnancy" ? "Pregnancy reproductive narrative" : "Menstrual / reproductive narrative"}<textarea value={current.narrative ?? ""} onChange={(event) => update({ narrative: event.target.value, changeStatus: "changed" })} /></label>
    </div>
  </section>;
}`;

active = replaceBetween(active, "function ReproductiveStatusEditor(", "function FinishModule(", editor, "ReproductiveStatusEditor");

active = mustReplace(
  active,
  `  const pregnancyDatingComplete = Boolean(visit?.pregnancyEpisode?.lmpDate && visit?.pregnancyEpisode?.estimatedDueDate && visit?.pregnancyEpisode?.datingMethod);\n  const reproductiveComplete = context === "pregnancy"\n    ? pregnancyDatingComplete || Boolean(structured.reproductiveSnapshot?.lmp && structured.reproductiveSnapshot?.lmpCertainty && structured.reproductiveSnapshot?.edd && structured.reproductiveSnapshot?.datingMethod && structured.reproductiveSnapshot?.datingConfirmationDate)`,
  `  const pregnancyDatingComplete = Boolean(visit?.pregnancyEpisode?.lmpDate && visit?.pregnancyEpisode?.estimatedDueDate && visit?.pregnancyEpisode?.datingMethod);\n  const confirmedSnapshotDatingComplete = Boolean(structured.reproductiveSnapshot?.edd && structured.reproductiveSnapshot?.datingMethod && structured.reproductiveSnapshot?.datingConfirmationDate && structured.reproductiveSnapshot?.datingClinician);\n  const reproductiveComplete = context === "pregnancy"\n    ? pregnancyDatingComplete || confirmedSnapshotDatingComplete`,
  "pregnancy completion contract"
);

active = mustReplace(
  active,
  `!reproductiveComplete ? (context === "pregnancy" ? "Pregnancy dating (LMP, certainty, EDD, method, confirmation date)" : "Menstrual / reproductive status") : null`,
  `!reproductiveComplete ? (context === "pregnancy" ? "Pregnancy dating (confirmed EDD, source, confirmation date, clinician)" : "Menstrual / reproductive status") : null`,
  "pregnancy completion message"
);

write(activePath, active);

const overviewPath = "apps/web/app/patients/[id]/patient-components.tsx";
let overview = read(overviewPath);

overview = mustReplace(
  overview,
  `  edd?: string;\n  datingMethod?: string;\n  cycleNumber?: string;`,
  `  edd?: string;\n  eddMode?: string;\n  eddSource?: string;\n  datingMethod?: string;\n  datingSourceDate?: string;\n  datingFormula?: string;\n  datingConfirmationDate?: string;\n  datingClinician?: string;\n  datingCorrectionReason?: string;\n  datingHistory?: Array<Record<string, unknown>>;\n  pregnancyBleedingStatus?: string;\n  pregnancyBleedingOnsetDate?: string;\n  cycleNumber?: string;`,
  "overview reproductive dating fields"
);

overview = mustReplace(
  overview,
  `{baseline ? <div className="reproductive-baseline-summary"><strong>Baseline menstrual profile</strong><span>{[baseline.usualRegularity, baseline.usualCycleLength ? \`${'${baseline.usualCycleLength}'}-day interval\` : "", baseline.usualBleedingDuration ? \`${'${baseline.usualBleedingDuration}'}-day bleeding\` : "", baseline.usualFlow].filter(Boolean).join(" · ") || baseline.menopauseStatus || "Baseline recorded"}</span></div> : null}`,
  `{baseline ? <div className="reproductive-baseline-summary"><strong>Pre-pregnancy menstrual baseline</strong><span>{[baseline.usualRegularity, baseline.usualCycleLength ? \`${'${baseline.usualCycleLength}'}-day interval\` : "", baseline.usualBleedingDuration ? \`${'${baseline.usualBleedingDuration}'}-day bleeding\` : "", baseline.usualFlow].filter(Boolean).join(" · ") || baseline.menopauseStatus || "Baseline recorded"} · preserved historical context</span></div> : null}`,
  "overview baseline label"
);

overview = mustReplace(
  overview,
  `{snapshot.lmp ? <div><dt>Cycle day</dt><dd>{cycleDay(snapshot.lmp) || "Not calculable"}</dd></div> : null}`,
  `{snapshot.context !== "pregnancy" && snapshot.lmp ? <div><dt>Cycle day</dt><dd>{cycleDay(snapshot.lmp) || "Not calculable"}</dd></div> : null}`,
  "pregnancy cycle day suppression"
);

overview = mustReplace(
  overview,
  `<div><dt>Flags</dt><dd>{snapshot.abnormalFlags?.join(", ") || "None recorded"}</dd></div>{snapshot.narrative ?`,
  `<div><dt>Flags</dt><dd>{snapshot.context === "pregnancy" ? "Ordinary menstrual flags suppressed during active pregnancy" : snapshot.abnormalFlags?.join(", ") || "None recorded"}</dd></div>{snapshot.context === "pregnancy" ? <><div><dt>Pregnancy bleeding</dt><dd>{snapshot.pregnancyBleedingStatus || "None recorded"}</dd></div>{snapshot.pregnancyBleedingOnsetDate ? <div><dt>Bleeding onset</dt><dd>{overviewDate(snapshot.pregnancyBleedingOnsetDate)}</dd></div> : null}<div><dt>Authoritative EDD</dt><dd>{snapshot.edd ? overviewDate(snapshot.edd) : "Not confirmed"}</dd></div><div><dt>Dating provenance</dt><dd>{[snapshot.eddMode, snapshot.eddSource ?? snapshot.datingMethod, snapshot.datingClinician].filter(Boolean).join(" · ") || "Not recorded"}</dd></div></> : null}{snapshot.narrative ?`,
  "pregnancy timeline semantics"
);

overview = mustReplace(
  overview,
  `    add(snapshot.lmp, "LMP", "menstrual", snapshot.sourceEncounterId);`,
  `    if (snapshot.lmp) add(snapshot.lmp, mode === "pregnancy" ? "Pregnancy dating LMP" : "LMP", mode === "pregnancy" ? "pregnancy_dating" : "menstrual", snapshot.sourceEncounterId);\n    if (mode === "pregnancy") add(snapshot.pregnancyBleedingOnsetDate, "Pregnancy bleeding", "pregnancy_event", snapshot.sourceEncounterId);`,
  "pregnancy calendar semantics"
);

write(overviewPath, overview);

console.log("QA pregnancy context and EDD UI patch applied deterministically.");
