# v0.14.2 Manual QA Checklist

Use local demo accounts and synthetic demo records only.

## Doctor Comfort Mode

- Sign in as Owner/Admin and Doctor.
- Confirm the top bar shows `Doctor Comfort` or `Comfort On` only for doctor/owner/admin roles.
- Toggle Doctor Comfort Mode and refresh the page. Confirm the setting persists in this browser.
- Open `/admin/appearance` as Owner/Admin and confirm the shared Doctor Comfort default can be saved through audited appearance settings.
- Confirm receptionist/accountant views do not get the doctor comfort top-bar control.

## Doctor And Patient Workspace

- Open `/doctor`, `/doctor/visit`, and a demo patient file.
- Confirm larger text, larger buttons, calmer colors, icon labels, and clearer spacing in comfort mode.
- Confirm patient workspace tabs are simplified and not presented as tiny horizontal tabs in comfort mode.
- Confirm advanced support panels are reduced in comfort mode without removing the core doctor visit draft workflow.
- Confirm no hover-only interaction is required to select medications or move through visit steps.

## Premium UI Polish And Empty States

- Confirm 3D medical icons render in the shell, cards, doctor mode, and patient workspace.
- Open empty patient sections and confirm they show useful next actions instead of dead-end empty text.
- Confirm empty states do not create fake records or imply production readiness.

## Audit And Safety Badges

- Open `/admin/audit` as Owner/Admin.
- Confirm audit entries use readable action/resource labels, severity badges, timestamps, and reasons where present.
- Confirm safety badges remain visible and compact: demo-only, AI draft-only, and doctor review.
- Confirm AI wording remains assistive/draft-only and does not claim diagnosis, prescribing, or automatic clinical decisions.

## Safety Boundaries

- Do not enter real patient data.
- Do not test real payments, WhatsApp, DICOM/PACS, or external AI.
- Confirm signed/final clinical records cannot be silently edited.
- Confirm role-denied users cannot access owner/admin settings.
