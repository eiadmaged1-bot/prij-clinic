# Modular Patient Workspace

## v1.5.0 behavior

The patient file uses a responsive 12-column panel grid with persisted order, width, pin, collapse, visibility, preset, and scope. Supported scopes are account, patient, role, specialty, and clinic with permission checks. Each visible panel loads independently behind a PHI-safe error boundary. Missing-information prompts are grouped and support audited resolution actions; mandatory safety prompts cannot be silently dismissed. Layout presets never create or change clinical records.

## Registry and real-data boundary

The typed panel registry is the single client-side catalog for patient modules. Each definition records its translation key, permitted roles and permissions, applicable patient contexts, supported sizes, authoritative endpoint/collection, eager or lazy loading, mandatory state, missing-data rules, and refresh dependencies. Layout records contain panel keys and presentation state only; they never copy patient or clinical values.

The v1.4.9 connected modules are patient identity/overview, active visit, structured history, allergies, medications, prescriptions, investigation requests/results, women’s health/pregnancy, infertility, ultrasound, timeline, tasks/reminders, referrals, documents, consent, internal notes, finance where permitted, and review hints where permitted. Allergy and medication panels read their existing patient-specific API endpoints and distinguish loading, error, empty, and populated states.

## Layout persistence and precedence

Forward-only tables `PatientWorkspaceLayout` and `PatientWorkspacePanelLayout` store scope, template version, panel key, order, column, size, collapsed, pinned, and hidden state. Resolution order is:

1. patient override for the current user and patient;
2. personal user layout;
3. specialty template matching patient context;
4. the first permitted role template;
5. clinic default;
6. built-in Minimal Visit fallback.

Clinic, role, and specialty templates may be published only by Owner/Admin. Patient-specific changes require `patient.update` or Owner/Admin authority. Both template and patient-specific changes require a reason where clinically attributable and create a redacted audit event. The mandatory patient identity panel cannot be removed or hidden.

## Presets

The server supplies versioned presets for Minimal Visit, General Women’s Health, Gynecology, Infertility, Routine Obstetrics, High-Risk Obstetrics, Postpartum, and Custom. Applying a preset is a preview until the user explicitly saves it.

## Editor and responsive behavior

Desktop and mobile share accessible native controls for show/hide, small/medium/wide/full size, collapse, pin, reset preview, and persistence. Reordering uses Move up/Move down so mobile and keyboard users are not dependent on drag gestures. Mobile forces one content column and full available width.

Panel modules are lazy by default below the primary workflow. A panel-level error boundary keeps one failed module from breaking the patient file. Refresh events may include dependency keys; only the active panel is reloaded when its registry dependencies intersect the event. Existing untyped refresh events retain safe whole-active-workspace behavior.

## Missing-information engine

The deterministic server rules currently cover missing DOB, unknown allergy status, unsigned encounter, absent pregnancy EDD, absent obstetric-visit blood pressure, absent infertility cycle day, ordered investigation without a result, received result awaiting review, and absent treatment consent for an active visit.

Every finding includes patient/episode/visit context, reason, severity, required/recommended state, an exact action link, and rule source/version. Supported states include Not recorded, Awaiting result, Overdue, and Needs doctor review. Rules do not diagnose, prescribe, or auto-edit records. Completed rules disappear because their authoritative condition no longer matches.

## Remaining limitations

The current renderer presents one active module at a time, so desktop column placement is persisted for forward compatibility but is not yet a simultaneous multi-panel masonry canvas. Patient-specific layouts are user-specific to avoid silently changing another clinician’s patient view. Dedicated dismissals for recommended findings, including reason capture, remain to be implemented; required clinical gaps cannot currently be dismissed.
