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

const overviewPath = "apps/web/app/patients/[id]/patient-components.tsx";
let overview = read(overviewPath);

const calendar = `function ContextClinicalCalendar({ patientId, mode, snapshots, related }: { patientId: string; mode: PatientWorkspaceMode; snapshots: ReproductiveSummarySnapshot[]; related: Record<string, Record<string, unknown>[]> }) {
  const seed = snapshots[0]?.lmp || snapshots[0]?.deliveryDate || new Date().toISOString();
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(seed));
  const events = contextCalendarEvents(mode, snapshots, related);
  const monthStartDate = new Date(\`${'${visibleMonth}'}T00:00:00\`);
  const gridStart = new Date(monthStartDate);
  gridStart.setDate(1 - monthStartDate.getDay());
  const todayKey = new Date().toISOString().slice(0, 10);
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
  const moveMonth = (offset: number) => {
    const next = new Date(monthStartDate);
    next.setMonth(next.getMonth() + offset);
    setVisibleMonth(monthStart(next.toISOString()));
  };
  const goToCurrentMonth = () => setVisibleMonth(monthStart(new Date().toISOString()));

  return <section className="context-clinical-calendar compact-context-calendar" aria-label={\`${'${mode}'} calendar\`}>
    <div className="context-calendar-toolbar">
      <button className="text-button compact" type="button" aria-label="Previous month" onClick={() => moveMonth(-1)}>‹</button>
      <strong>{monthStartDate.toLocaleDateString(undefined, { month: "short", year: "numeric" })}</strong>
      <button className="text-button compact" type="button" aria-label="Go to current month" onClick={goToCurrentMonth}>Today</button>
      <button className="text-button compact" type="button" aria-label="Next month" onClick={() => moveMonth(1)}>›</button>
    </div>
    <div className="context-calendar-weekdays">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}</div>
    <div className="context-calendar-grid">{days.map((date) => {
      const key = date.toISOString().slice(0, 10);
      const dayEvents = events.filter((event) => event.date === key);
      const visibleEvents = dayEvents.slice(0, 2);
      const className = ["context-calendar-day", date.getMonth() === monthStartDate.getMonth() ? "" : "outside", key === todayKey ? "today" : ""].filter(Boolean).join(" ");
      return <div className={className} key={key}>
        <span className="calendar-day-number">{date.getDate()}</span>
        <div className="context-calendar-events-compact">
          {visibleEvents.map((event, index) => event.encounterId
            ? <Link title={event.label} aria-label={event.label} href={\`/patients/${'${patientId}'}/visits/${'${event.encounterId}'}/history\`} className={\`calendar-event ${'${event.kind}'}\`} key={\`${'${event.kind}'}-${'${index}'}\`}>{event.label}</Link>
            : <span title={event.label} aria-label={event.label} className={\`calendar-event ${'${event.kind}'}\`} key={\`${'${event.kind}'}-${'${index}'}\`}>{event.label}</span>)}
          {dayEvents.length > 2 ? <span className="calendar-event-overflow" title={\`${'${dayEvents.length - 2}'} more events\`}>+{dayEvents.length - 2}</span> : null}
        </div>
      </div>;
    })}</div>
    <div className="context-calendar-legend">{[...new Map(events.map((event) => [event.kind, event])).values()].map((event) => <span key={event.kind}><i className={event.kind} />{event.kind.replaceAll("_", " ")}</span>)}</div>
  </section>;
}`;

overview = replaceBetween(overview, "function ContextClinicalCalendar(", "function MenstrualHistoryTimeline(", calendar, "ContextClinicalCalendar");

const history = `function MenstrualHistoryTimeline({ patientId, snapshots }: { patientId: string; snapshots: ReproductiveSummarySnapshot[] }) {
  const [filter, setFilter] = useState("all");
  const historyFilters = ["all", "pregnancy", "gynecology", "infertility", "postpartum", "menopause", "abnormal"];
  const filteredSnapshots = snapshots.filter((snapshot) => {
    if (filter === "all") return true;
    if (filter === "abnormal") return Boolean(snapshot.abnormalFlags?.length || snapshot.pregnancyBleedingStatus && snapshot.pregnancyBleedingStatus !== "none");
    return snapshot.context === filter;
  });
  const baseline = snapshots.find((snapshot) => snapshot.baselineProfile)?.baselineProfile;
  const latestPregnancy = snapshots.find((snapshot) => snapshot.context === "pregnancy" && snapshot.edd);
  const correctionHistoryCount = latestPregnancy?.datingHistory?.length ?? 0;
  if (!snapshots.length) return null;

  return <details className="menstrual-history-timeline reproductive-history-workspace">
    <summary><span>Complete menstrual / reproductive history</span><span className="badge">{snapshots.length}</span></summary>
    {latestPregnancy ? <section className="history-edd-provenance" aria-label="EDD provenance">
      <div><span>Authoritative EDD</span><strong>{overviewDate(latestPregnancy.edd ?? "")}</strong></div>
      <div><span>EDD provenance</span><strong>{latestPregnancy.eddSource ?? latestPregnancy.datingMethod ?? "Not recorded"}</strong></div>
      <div><span>Confirmed</span><strong>{latestPregnancy.datingConfirmationDate ? overviewDate(latestPregnancy.datingConfirmationDate) : "Not recorded"}</strong></div>
      <div><span>Clinician</span><strong>{latestPregnancy.datingClinician || "Not recorded"}</strong></div>
      <div><span>Correction history</span><strong>{correctionHistoryCount}</strong></div>
    </section> : null}
    {baseline ? <div className="reproductive-baseline-summary"><strong>Pre-pregnancy menstrual baseline</strong><span>{[baseline.usualRegularity, baseline.usualCycleLength ? \`${'${baseline.usualCycleLength}'}-day interval\` : "", baseline.usualBleedingDuration ? \`${'${baseline.usualBleedingDuration}'}-day bleeding\` : "", baseline.usualFlow].filter(Boolean).join(" · ") || baseline.menopauseStatus || "Baseline recorded"} · preserved historical context</span></div> : null}
    <div className="clinical-lenses clinical-filter-row history-context-filter">{historyFilters.map((item) => <button className={filter === item ? "active" : ""} type="button" key={item} onClick={(event) => { event.preventDefault(); setFilter(item); }}>{item === "abnormal" ? "Abnormal only" : item}</button>)}</div>
    <div className="menstrual-history-records">{filteredSnapshots.map((snapshot, index) => {
      const contextLabel = snapshot.context?.replaceAll("_", " ") || "recorded";
      const pattern = [snapshot.regularity, snapshot.cycleLength ? \`${'${snapshot.cycleLength}'}-day interval\` : "", snapshot.bleedingDuration ? \`${'${snapshot.bleedingDuration}'}-day bleeding\` : "", snapshot.flow].filter(Boolean).join(" · ") || "Not recorded";
      const correctionCount = snapshot.datingHistory?.length ?? 0;
      return <article className="reproductive-history-card" key={\`${'${snapshot.sourceEncounterId}'}-${'${index}'}\`}>
        <header className="data-row-header"><div><strong>{overviewDate(snapshot.visitDate ?? snapshot.confirmedAt ?? "")}</strong><span>{contextLabel}</span></div><span className="badge">{snapshot.changeStatus?.replaceAll("_", " ") || "recorded"}</span></header>
        <div className="reproductive-history-summary">
          <div><span>LMP</span><strong>{snapshot.lmp ? overviewDate(snapshot.lmp) : "Not recorded"}</strong></div>
          {snapshot.context !== "pregnancy" && snapshot.lmp ? <div><span>Cycle day</span><strong>{cycleDay(snapshot.lmp) || "Not calculable"}</strong></div> : null}
          <div><span>Pattern</span><strong>{snapshot.context === "pregnancy" ? "Historical baseline only" : pattern}</strong></div>
          <div><span>Flags</span><strong>{snapshot.context === "pregnancy" ? "Ordinary menstrual flags suppressed" : snapshot.abnormalFlags?.join(", ") || "None recorded"}</strong></div>
          {snapshot.context === "pregnancy" ? <><div><span>Pregnancy bleeding</span><strong>{snapshot.pregnancyBleedingStatus || "None recorded"}</strong></div><div><span>Authoritative EDD</span><strong>{snapshot.edd ? overviewDate(snapshot.edd) : "Not confirmed"}</strong></div></> : null}
        </div>
        {snapshot.narrative ? <p className="reproductive-history-note">{snapshot.narrative}</p> : null}
        <details className="reproductive-history-details">
          <summary>Source and provenance</summary>
          <dl>
            <div><dt>Source encounter</dt><dd>{snapshot.sourceEncounterId || "Not linked"}</dd></div>
            <div><dt>EDD provenance</dt><dd>{[snapshot.eddMode, snapshot.eddSource ?? snapshot.datingMethod, snapshot.datingSourceDate ? overviewDate(snapshot.datingSourceDate) : ""].filter(Boolean).join(" · ") || "Not recorded"}</dd></div>
            <div><dt>Confirmation</dt><dd>{[snapshot.datingConfirmationDate ? overviewDate(snapshot.datingConfirmationDate) : "", snapshot.datingClinician].filter(Boolean).join(" · ") || "Not recorded"}</dd></div>
            <div><dt>Correction reason</dt><dd>{snapshot.datingCorrectionReason || "None recorded"}</dd></div>
            <div><dt>Correction history</dt><dd>{correctionCount}</dd></div>
          </dl>
        </details>
        {snapshot.sourceEncounterId ? <Link href={\`/patients/${'${patientId}'}/visits/${'${snapshot.sourceEncounterId}'}/history\`}>Open source encounter</Link> : null}
      </article>;
    })}</div>
  </details>;
}`;

overview = replaceBetween(overview, "function MenstrualHistoryTimeline(", "export function PatientRecentActivity(", history, "MenstrualHistoryTimeline");
write(overviewPath, overview);

const cssPath = "apps/web/app/globals.css";
let css = read(cssPath);

css = mustReplace(
  css,
  `.context-clinical-calendar {\n  display: grid;\n  gap: 7px;\n  margin-top: 12px;\n  padding-top: 12px;\n  border-top: 1px solid var(--border);\n}`,
  `.context-clinical-calendar {\n  display: grid;\n  gap: 5px;\n  margin-top: 10px;\n}\n.compact-context-calendar {\n  width: 100%;\n  max-width: 760px;\n  margin-inline: auto;\n  padding: 8px;\n  border: 1px solid var(--border);\n  border-radius: 10px;\n  background: var(--surface);\n}\n.context-calendar-toolbar {\n  display: grid;\n  grid-template-columns: 34px minmax(0, 1fr) auto 34px;\n  align-items: center;\n  gap: 5px;\n}\n.context-calendar-toolbar strong { text-align: center; }\n.context-calendar-toolbar .compact { min-width: 32px; min-height: 32px; padding: 3px 7px; }`,
  "compact calendar container"
);

css = mustReplace(
  css,
  `.context-calendar-day {\n  min-width: 0;\n  min-height: 58px;\n  padding: 4px;\n  border: 1px solid var(--border);\n  border-radius: 7px;\n  background: var(--surface);\n  font-size: 11px;\n}\n.context-calendar-day.outside { opacity: .4; }`,
  `.context-calendar-day {\n  min-width: 0;\n  min-height: 38px;\n  padding: 2px 3px;\n  border: 1px solid var(--border);\n  border-radius: 6px;\n  background: var(--surface);\n  font-size: 10px;\n}\n.context-calendar-day.outside { opacity: .4; }\n.context-calendar-day.today { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }\n.calendar-day-number { display: block; font-weight: 700; line-height: 1; }\n.context-calendar-events-compact { display: grid; gap: 1px; min-width: 0; }`,
  "compact calendar day"
);

css = mustReplace(
  css,
  `.calendar-event {\n  display: block;\n  overflow: hidden;\n  margin-top: 3px;\n  padding: 2px 4px;\n  border-radius: 4px;\n  background: var(--accent-soft);\n  color: var(--navy);\n  font-size: 10px;\n  line-height: 1.25;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}`,
  `.calendar-event {\n  display: block;\n  overflow: hidden;\n  margin-top: 1px;\n  padding: 1px 3px;\n  border-radius: 3px;\n  background: var(--accent-soft);\n  color: var(--navy);\n  font-size: 9px;\n  line-height: 1.15;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.calendar-event-overflow {\n  display: inline-flex;\n  width: fit-content;\n  margin-top: 1px;\n  padding: 0 3px;\n  border-radius: 999px;\n  background: var(--surface-soft, #eef3f4);\n  color: var(--muted);\n  font-size: 9px;\n  font-weight: 700;\n}`,
  "compact calendar events"
);

css = mustReplace(
  css,
  `.menstrual-history-timeline > summary { cursor: pointer; font-weight: 700; }\n.menstrual-history-records {\n  display: grid;\n  gap: 8px;\n  margin-top: 8px;\n}\n.reproductive-baseline-summary { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px 12px; padding: 10px 12px; margin: 10px 0; border-radius: 10px; background: var(--surface-soft, #f7f3ea); color: var(--ink, #17233c); }\n.menstrual-history-records article {\n  padding: 9px;\n  border: 1px solid var(--border);\n  border-radius: 9px;\n}\n.menstrual-history-records dl {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 5px 12px;\n}\n.menstrual-history-records dl > div { min-width: 0; }\n.menstrual-history-records dt { color: var(--muted); font-size: 11px; }\n.menstrual-history-records dd { margin: 0; }`,
  `.menstrual-history-timeline > summary { display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: pointer; font-weight: 700; }\n.history-edd-provenance {\n  display: grid;\n  grid-template-columns: repeat(5, minmax(0, 1fr));\n  gap: 6px;\n  margin: 8px 0;\n}\n.history-edd-provenance > div,\n.reproductive-history-summary > div { min-width: 0; padding: 6px 8px; border-radius: 7px; background: var(--surface-soft, #f4f7f7); }\n.history-edd-provenance span,\n.reproductive-history-summary span { display: block; color: var(--muted); font-size: 10px; }\n.history-edd-provenance strong,\n.reproductive-history-summary strong { display: block; margin-top: 2px; overflow-wrap: anywhere; font-size: 12px; }\n.menstrual-history-records { display: grid; gap: 6px; margin-top: 7px; }\n.reproductive-baseline-summary { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px 12px; padding: 8px 10px; margin: 8px 0; border-radius: 8px; background: var(--surface-soft, #f7f3ea); color: var(--ink, #17233c); }\n.reproductive-history-card { padding: 8px; border: 1px solid var(--border); border-radius: 8px; }\n.reproductive-history-card .data-row-header > div { display: grid; gap: 1px; }\n.reproductive-history-card .data-row-header > div > span { color: var(--muted); font-size: 10px; text-transform: capitalize; }\n.reproductive-history-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px; margin-top: 6px; }\n.reproductive-history-note { margin: 6px 0 0; padding: 6px 8px; border-inline-start: 3px solid var(--accent); background: var(--surface-soft, #f4f7f7); }\n.reproductive-history-details { margin-top: 6px; }\n.reproductive-history-details > summary { cursor: pointer; color: var(--accent); font-size: 11px; font-weight: 700; }\n.reproductive-history-details dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px 10px; margin: 6px 0; }\n.reproductive-history-details dl > div { min-width: 0; }\n.reproductive-history-details dt { color: var(--muted); font-size: 10px; }\n.reproductive-history-details dd { margin: 0; overflow-wrap: anywhere; font-size: 11px; }`,
  "history compact layout"
);

css = mustReplace(
  css,
  `  .context-calendar-day { min-height: 48px; padding: 2px; }\n  .calendar-event { max-width: 100%; font-size: 9px; }\n  .menstrual-history-records dl { grid-template-columns: 1fr; }`,
  `  .compact-context-calendar { padding: 5px; }\n  .context-calendar-toolbar { grid-template-columns: 32px minmax(0, 1fr) auto 32px; }\n  .context-calendar-day { min-height: 34px; padding: 1px 2px; }\n  .calendar-event { max-width: 100%; font-size: 8px; }\n  .history-edd-provenance { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n  .reproductive-history-summary,\n  .reproductive-history-details dl { grid-template-columns: 1fr; }`,
  "mobile compact calendar and history"
);

write(cssPath, css);
console.log("QA compact calendar and History patch applied deterministically.");
