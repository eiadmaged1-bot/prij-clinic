# Visit Cockpit Manual QA

Date: 2026-07-30

Purpose: verify the merged Dual Doctor Workspace and Visit Cockpit against the real browser, real API, and demo database before release promotion.

Use demo/test patient data only. Do not use real patient-identifiable data.

## Required setup

- Run the integrated branch: `feat/patient-clinical-input-foundation`.
- Use a Doctor account for the clinical workflow.
- Keep a Receptionist account available for the access-denial check.
- Create one new demo Gynecology patient with a unique name and phone number.
- Create one encounter and note its patient ID and encounter ID.
- Test in Chrome or Edge at 100% zoom first.

## A. Desktop English — 1440×900

1. Open the Doctor Dashboard.
2. Start the demo patient visit manually.
3. Confirm the visit opens in Classic Workspace by default.
4. Confirm the header shows the correct patient name, MRN, age/DOB, encounter status, branch, allergies, and risk context.
5. Enter a unique complaint phrase: `QA complaint 2026-07-30`.
6. Enter a unique history phrase: `QA history persists across workspaces`.
7. Wait until the save state reads Saved.
8. Switch to Visit Cockpit.
9. Confirm the same complaint and history are present. No second encounter should be created.
10. Move through all seven stages: Patient Context, History, Examination, Assessment, Investigations, Plan, Review.
11. Confirm only one stage is visually and semantically selected.
12. Confirm every visible button can be reached with Tab and has a visible focus ring.
13. Confirm the context pane distinguishes records, no records, partial load, and failed load.
14. Confirm Retry resources and Retry save are real buttons when their states are shown.
15. Confirm no direct Finish action exists outside Review.

Pass condition: one patient, one encounter, one draft, one save state, seven clear stages, and no duplicate current-visit editor.

## B. Workspace switching and persistence

1. In Cockpit History, add `Cockpit switch persistence test`.
2. Wait for Saved.
3. Switch to Classic Workspace.
4. Confirm the new text is present.
5. Refresh the page.
6. Confirm the text remains.
7. Switch back to Cockpit.
8. Confirm the same encounter ID remains active.
9. Open the same patient in a second browser tab.
10. Change the encounter in one tab, then attempt to save an older version in the other tab.
11. Confirm the stale save is rejected as a version conflict and no silent overwrite occurs.

Pass condition: data survives switching and refresh; stale revisions are blocked.

## C. Review and signing safety

1. Open Review while required documentation is incomplete.
2. Confirm the server returns blocking issues.
3. Confirm Sign and finish encounter is disabled.
4. Select a blocking issue and confirm it moves focus to the relevant stage or History section.
5. Complete the required demo fields.
6. Wait for Saved.
7. Recheck readiness.
8. Confirm the Review summary shows complaint, History, Examination, Assessment, Plan, structured History, and failed-resource warnings when applicable.
9. Sign once.
10. Confirm the encounter becomes signed/completed and read-only.
11. Refresh.
12. Confirm it remains read-only.
13. Attempt a normal edit and confirm it is rejected or unavailable.
14. Confirm no duplicate queue completion or duplicate encounter is created.

Pass condition: Review is the sole completion gateway; blocked encounters cannot sign; signed encounters remain immutable.

## D. Investigations, prescriptions, follow-up, and context

1. From the Investigations stage, create one demo request linked to the active patient and encounter.
2. Confirm the request appears after reload.
3. From Plan or Classic Workspace, create one demo prescription linked to the same patient and encounter.
4. Add one demo follow-up action.
5. Return to Cockpit.
6. Confirm the context pane and Review show factual linked counts/status without implying that a result was reviewed when it was not.
7. Open a context row and confirm it opens the correct patient/record route.

Pass condition: all downstream artifacts remain locked to the active patient and encounter.

## E. Arabic RTL — 1440×900 and 820×1180

1. Switch the interface to Arabic.
2. Confirm the Cockpit direction becomes RTL.
3. Confirm the seven stages preserve conceptual order and keyboard arrow behavior is mirrored correctly.
4. Confirm patient name, Arabic text, MRN, dates, and mixed Arabic/English content remain readable.
5. Confirm the context pane border, buttons, and alignment use logical RTL placement.
6. Confirm no English-only critical action remains for Review, signing, saving, retry, conflict, or read-only state.
7. Test at 200% zoom and confirm no critical text or action is clipped.

Pass condition: RTL visual order, focus order, and meaning agree; no critical action is hidden or untranslated.

## F. Mobile — 390×844 and 320×568

1. Open the same demo encounter.
2. Confirm no horizontal page overflow.
3. Confirm the stage rail scrolls horizontally and the active stage remains discoverable.
4. Confirm all touch controls are at least 44×44 CSS pixels.
5. Confirm the sticky save/review bar does not cover inputs, errors, or focused controls.
6. Confirm the context pane collapses/expands and does not trap the user below the editor.
7. Confirm Review and Retry save are reachable with one hand.
8. Test a long patient name, long MRN, and long error message.

Pass condition: no hidden actions, no clipped identity, no covered focus target, and no horizontal page overflow.

## G. Permission and failure states

1. Open the Doctor encounter route while signed in as Receptionist.
2. Confirm access is denied by the API and the UI does not show editable clinical controls.
3. Expire or remove the session and reload.
4. Confirm Session expired is shown instead of an endless skeleton.
5. Simulate or observe one failed longitudinal resource.
6. Confirm the UI says failed/partial/unavailable rather than No records.
7. Restore the resource and use Retry resources.
8. Confirm the available state returns without losing unsaved encounter changes.

Pass condition: denied, expired, failed, partial, empty, and ready are distinct states.

## H. Accessibility and display modes

1. Navigate the entire Cockpit using keyboard only.
2. Confirm focus is visible on every interactive control.
3. Confirm stage selection is announced through tab semantics.
4. Confirm save, conflict, readiness, and completion changes are announced through live regions.
5. Enable high-contrast mode and confirm focus, selected, warning, error, disabled, and read-only states remain distinguishable.
6. Enable reduced motion and confirm no essential state change depends on animation.
7. Test 200% browser zoom at 1440×900 and 390×844.

Pass condition: no keyboard trap, no invisible focus, no meaning conveyed by color alone, and no loss of content at 200% zoom.

## Required screenshots

Capture demo-only screenshots for:

- 1440×900 English: History, save failed, Review blocked, Review ready, signed read-only.
- 1280×800 English: full identity and context visible.
- 1024×768 English: stage navigation and sticky clearance.
- 820×1180 Arabic: RTL stage rail, context, dialog/error state.
- 390×844 English and Arabic: no overflow, stage rail, Review action.
- 320×568: long name/MRN and stacked actions.
- High contrast and reduced motion states.

For every screenshot record viewport, language, role, theme, zoom, patient fixture, encounter status, and observed result.

## Failure reporting format

For each failure record:

- QA ID
- Viewport and language
- Role
- Patient ID and encounter ID using demo data only
- Exact steps
- Expected result
- Actual result
- Screenshot/video
- Console/network error if present
- Severity: blocker, high, medium, low
- Whether data was lost, duplicated, hidden, or only visually incorrect

## Release gate

Release promotion is blocked until:

- no blocker or high-severity failure remains;
- Classic and Cockpit share one encounter and one draft;
- Review-only signing passes;
- stale revision protection passes;
- signed read-only passes;
- Doctor/Receptionist role separation passes;
- English desktop, Arabic RTL, and mobile acceptance pass.