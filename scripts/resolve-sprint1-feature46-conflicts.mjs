import fs from 'node:fs';
import path from 'node:path';

const workspace = path.resolve(process.argv[2] ?? process.cwd());

function file(relative) {
  return path.join(workspace, ...relative.split('/'));
}

function read(relative) {
  return fs.readFileSync(file(relative), 'utf8').replace(/\r\n/g, '\n');
}

function write(relative, content) {
  fs.writeFileSync(file(relative), content, 'utf8');
}

function mustReplace(content, oldText, newText, label) {
  if (!content.includes(oldText)) {
    throw new Error(`Expected block not found: ${label}`);
  }
  return content.replace(oldText, newText);
}

function nextConflict(content) {
  const start = content.indexOf('<<<<<<< HEAD\n');
  if (start < 0) return null;
  const oursStart = start + '<<<<<<< HEAD\n'.length;
  const separator = content.indexOf('=======\n', oursStart);
  if (separator < 0) throw new Error('Conflict separator not found.');
  const theirsStart = separator + '=======\n'.length;
  const endStart = content.indexOf('>>>>>>>', theirsStart);
  if (endStart < 0) throw new Error('Conflict end not found.');
  let end = content.indexOf('\n', endStart);
  if (end < 0) end = content.length;
  else end += 1;
  return {
    start,
    end,
    ours: content.slice(oursStart, separator),
    theirs: content.slice(theirsStart, endStart),
  };
}

function resolveNext(content, resolver) {
  const conflict = nextConflict(content);
  if (!conflict) throw new Error('No conflict found to resolve.');
  const replacement = resolver(conflict.ours, conflict.theirs);
  return content.slice(0, conflict.start) + replacement + content.slice(conflict.end);
}

function assertClean(relative, content) {
  if (/^(<<<<<<<|=======|>>>>>>>)/m.test(content)) {
    throw new Error(`Conflict marker remains in ${relative}`);
  }
}

function cssBraceBalance(content) {
  let balance = 0;
  let quote = null;
  let escaped = false;
  let inComment = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    const next = content[index + 1];

    if (inComment) {
      if (character === '*' && next === '/') {
        inComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (character === '\\') {
        escaped = true;
        continue;
      }
      if (character === quote) quote = null;
      continue;
    }

    if (character === '/' && next === '*') {
      inComment = true;
      index += 1;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === '{') balance += 1;
    if (character === '}') {
      balance -= 1;
      if (balance < 0) throw new Error('CSS has an unexpected extra closing brace.');
    }
  }

  if (quote) throw new Error('CSS has an unterminated quoted value.');
  if (inComment) throw new Error('CSS has an unterminated comment.');
  return balance;
}

function ensureBalancedCss(relative, content) {
  const balance = cssBraceBalance(content);
  if (balance === 0) return content;

  const expectedTail = '@media (max-width: 390px) {';
  const tailIndex = content.lastIndexOf(expectedTail);
  if (balance === 1 && tailIndex >= Math.max(0, content.length - 3000)) {
    const repaired = `${content.trimEnd()}\n}\n`;
    if (cssBraceBalance(repaired) !== 0) {
      throw new Error(`Could not repair the final CSS block in ${relative}.`);
    }
    return repaired;
  }

  throw new Error(`Unexpected CSS brace balance ${balance} in ${relative}.`);
}

{
  const relative = 'apps/api/src/doctor-visit/dto.ts';
  let content = read(relative);
  content = resolveNext(content, (ours, theirs) => {
    if (!ours.includes('IsObject') || !theirs.includes('COMPLAINT_LIFECYCLE_STATUS')) {
      throw new Error('Unexpected doctor-visit DTO conflict.');
    }
    return 'import { IsDateString, IsEnum, IsObject, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";\n' +
      'import { COMPLAINT_LIFECYCLE_STATUS, type ComplaintLifecycleStatus } from "../complaints/complaint-lifecycle";\n';
  });
  assertClean(relative, content);
  write(relative, content);
}

{
  const relative = 'apps/api/src/encounters/encounters.service.ts';
  let content = read(relative);
  content = resolveNext(content, (ours, theirs) => {
    if (!ours.includes('existing.status === "signed"') || !theirs.includes('complaintLifecycleFromJson')) {
      throw new Error('Unexpected encounter signing conflict.');
    }
    return '    if (existing.status === "signed") {\n' +
      '      // Signed clinical records are immutable and replay safely.\n' +
      '      return existing;\n' +
      '    }\n';
  });
  assertClean(relative, content);
  write(relative, content);
}

{
  const relative = 'apps/web/app/globals.css';
  let content = read(relative);
  content = resolveNext(content, (ours, theirs) => `${ours}${ours.endsWith('\n') ? '' : '\n'}${theirs}`);
  content = ensureBalancedCss(relative, content);
  assertClean(relative, content);
  write(relative, content);
}

{
  const relative = 'apps/web/components/clinic/ActiveVisitWorkspace.tsx';
  let content = read(relative);

  while (nextConflict(content)) {
    content = resolveNext(content, (ours, theirs) => {
      if (ours.includes('const encounter = visit?.encounter') && theirs.includes('Record<string, unknown>')) {
        return '  const encounter = visit?.encounter as Record<string, unknown> | undefined;\n' +
          '  const signedVisit = encounter?.status === "signed";\n';
      }
      if (ours.includes('const serverForm: Record<string, unknown>') && theirs.includes('complaintLifecycleFromEncounter')) {
        return '      const complaintLifecycle = complaintLifecycleFromEncounter((data.encounter ?? {}) as Record<string, unknown>);\n' +
          '      const serverForm: Record<string, unknown> = {\n';
      }
      if (ours.includes('<FinishModule') && theirs.includes('onSign={signVisit}')) {
        return ours;
      }
      if (ours.includes('Smart complaint tags') && theirs.includes('Lifecycle status')) {
        return [
          '      <fieldset className="encounter-module-fields wide" disabled={readOnly}>',
          '      {activeModule === "complaint" ? <StructuredTagPicker title="Smart complaint tags" groups={complaintGroups} selected={structured.complaints} lenses onChange={(complaints) => updateStructured({ complaints })} /> : null}',
          '      {activeModule === "history" ? <><ReproductiveStatusEditor context={context} value={structured.reproductiveSnapshot} previous={previousSnapshot} pregnancyEpisode={pregnancyEpisode} infertilityEpisode={infertilityEpisode} onChange={(reproductiveSnapshot) => updateStructured({ reproductiveSnapshot, version: 2 })} /><StructuredTagPicker title="Structured History" groups={historyGroups} selected={structured.history} onChange={(history) => updateStructured({ history })} /></> : null}',
          '      {activeModule === "examination" ? <StructuredExamination context={context} value={structured.examination} onChange={(examination) => updateStructured({ examination })} /> : null}',
          '      {activeModule === "examination" ? <ChipList labels={examinationChips} onPick={(label) => onChange({ ...form, examText: appendText(form.examText, label) })} /> : null}',
          '      {activeModule === "complaint" ? (',
          '        <label>Lifecycle status',
          '          <select value={form.complaintStatus ?? "ACTIVE"} onChange={(event) => onChange({ ...form, complaintStatus: event.target.value })}>',
          '            {COMPLAINT_LIFECYCLE_STATUSES.map((status) => <option key={status} value={status}>{complaintStatusLabel(status)}</option>)}',
          '          </select>',
          '        </label>',
          '      ) : null}',
          '      <label className="wide">{fieldLabel(field)}<textarea value={String(form[field] ?? "")} onChange={(event) => onChange({ ...form, [field]: event.target.value })} /></label>',
          '      {activeModule === "complaint" ? <span className={"badge complaint-status-badge " + (form.complaintStatus === "REFRACTORY" ? "refractory" : "")}>{complaintStatusLabel(form.complaintStatus)}</span> : null}',
          '',
        ].join('\n');
      }
      if (ours.includes('function ReproductiveStatusEditor')) {
        return ours;
      }
      if (ours.includes('Finish visit') && theirs.includes('function FinishModule')) {
        return ours;
      }
      throw new Error(`Unexpected ActiveVisitWorkspace conflict. Ours: ${ours.slice(0, 100)} Theirs: ${theirs.slice(0, 100)}`);
    });
  }

  const duplicateSignVisit = /\n  async function signVisit\(\) \{\n    if \(!contextReady\) return;\n    await completeDoctorVisit\(visitId\);\n    setStatus\("Encounter signed\. Complaint history preserved\."\);\n    window\.location\.assign\(`\/patients\/\$\{patientId\}`\);\n  \}\n\n/;
  if (duplicateSignVisit.test(content)) {
    content = content.replace(duplicateSignVisit, '\n');
  }

  assertClean(relative, content);
  write(relative, content);
}

{
  const relative = 'apps/web/app/patients/[id]/patient-components.tsx';
  let content = read(relative);
  let conflictIndex = 0;
  while (nextConflict(content)) {
    content = resolveNext(content, (ours, theirs) => {
      conflictIndex += 1;
      if (conflictIndex === 1) return ours;
      if (conflictIndex === 2) return `${ours}${ours.endsWith('\n') ? '' : '\n'}${theirs}`;
      throw new Error(`Unexpected extra patient-components conflict ${conflictIndex}.`);
    });
  }
  if (conflictIndex !== 2) {
    throw new Error(`Expected 2 patient-components conflicts, found ${conflictIndex}.`);
  }

  content = mustReplace(
    content,
    '}) {\n  const ultrasound = firstOverviewRow((related.ultrasound ?? related.ultrasounds ?? []).filter((row) => {',
    '}) {\n  const complaintHistory = related.complaints ?? [];\n  const activeComplaints = complaintHistory.filter((row) => row.active === true);\n  const ultrasound = firstOverviewRow((related.ultrasound ?? related.ultrasounds ?? []).filter((row) => {',
    'patient overview complaint history source'
  );

  content = mustReplace(
    content,
    '  const complaints = [...complaintById.values()].filter((row) => String(row.status).toLowerCase() !== "resolved").slice(0, overviewCardContracts.complaints.maxItems);',
    '  const legacyComplaints = [...complaintById.values()].filter((row) => String(row.status).toLowerCase() !== "resolved").slice(0, overviewCardContracts.complaints.maxItems);',
    'patient overview legacy complaint variable'
  );

  content = mustReplace(
    content,
    '  const recentTimeline = timelineItems.slice(0, overviewCardContracts.timeline.maxItems);\n\n  return (',
    '  const recentTimeline = timelineItems.slice(0, overviewCardContracts.timeline.maxItems);\n  const complaints = activeComplaints.length\n    ? activeComplaints.slice(0, overviewCardContracts.complaints.maxItems)\n    : legacyComplaints;\n\n  return (',
    'patient overview active complaint selection'
  );

  content = mustReplace(
    content,
    '    <section className="patient-clinical-overview" aria-label="Patient clinical overview">\n      <div className="patient-approved-overview-grid">',
    '    <section className="patient-clinical-overview" aria-label="Patient clinical overview">\n      <article className="panel compact-panel complaint-history-panel">\n        <div className="section-heading"><h2>Complaint history</h2><span className="badge">{complaintHistory.length}</span></div>\n        {complaintHistory.length ? <div className="dense-card-list">{complaintHistory.map((complaint, index) => <ComplaintLifecycleRow complaint={complaint} key={String(complaint.encounterId ?? index) + "-history"} />)}</div> : <p className="empty-state compact smart-empty-state">No longitudinal complaint history yet.</p>}\n      </article>\n      <div className="patient-approved-overview-grid">',
    'patient overview complaint history panel'
  );

  content = mustReplace(
    content,
    '          {complaints.length ? <div className="overview-data-rows">{complaints.map((row) => <article key={String(row.id)}><div><strong>{String(row.complaint)}</strong><p>{overviewDate(String(row.encounterDate ?? ""))} · {String(row.status)}</p></div><Link href={`/patients/${patient.id}/visits/${String(row.sourceEncounterId)}/complaint`}>Source visit</Link></article>)}</div> : <OverviewEmpty label={overviewCardContracts.complaints.emptyAction} onClick={() => onNavigate("doctor-visit")} />}',
    '          {complaints.length ? <div className="overview-data-rows">{complaints.map((row, index) => "text" in row ? <ComplaintLifecycleRow complaint={row} key={String(row.encounterId ?? index) + "-active"} /> : <article key={String(row.id)}><div><strong>{String(row.complaint)}</strong><p>{overviewDate(String(row.encounterDate ?? ""))} · {String(row.status)}</p></div><Link href={`/patients/${patient.id}/visits/${String(row.sourceEncounterId)}/complaint`}>Source visit</Link></article>)}</div> : <OverviewEmpty label={overviewCardContracts.complaints.emptyAction} onClick={() => onNavigate("doctor-visit")} />}',
    'patient overview complaint rendering'
  );

  assertClean(relative, content);
  write(relative, content);
}

const targets = [
  'apps/api/src/doctor-visit/dto.ts',
  'apps/api/src/encounters/encounters.service.ts',
  'apps/web/app/globals.css',
  'apps/web/app/patients/[id]/patient-components.tsx',
  'apps/web/components/clinic/ActiveVisitWorkspace.tsx',
];

for (const target of targets) {
  assertClean(target, read(target));
}

console.log('Deterministic Sprint 1 Fix 3 + Feature 46 conflict resolution complete.');
