# Mobile and Tablet QA

Date: 2026-06-29

## Target Widths

- 390px mobile
- 768px tablet
- 1024px small laptop
- Desktop

## Pages Covered

- `/login`
- `/dashboard`
- `/doctor`
- `/doctor/visit`
- `/patients`
- `/patients/new`
- `/patients/[demoPatientId]`
- `/appointments`
- `/calendar`
- `/queue`
- `/encounters`
- `/prescriptions`
- `/investigations`
- `/reports`
- `/pregnancies`
- `/ultrasound`
- `/billing`
- `/consents`
- `/ai-drafts`
- `/admin`
- `/admin/appearance`

## QA Checklist

- Main layout is visible and not blank.
- Navigation stacks cleanly on tablet and mobile.
- Important actions use icon plus text.
- Buttons are large enough for touch.
- Patient tabs scroll horizontally on mobile instead of squeezing text.
- Doctor visit steps remain readable on mobile.
- Patient file header keeps current patient context visible.
- Patient registry uses readable cards instead of a table-first mobile experience.
- Admin pages remain readable on tablet and mobile.
- No visible stack traces, raw data pages, or framework/database wording on normal pages.

## Automated Sweep

Run after the local API and web app are running:

```powershell
npm run test:visual:qa
```

The sweep checks page status, main layout, visible navigation, doctor cards, patient-file tabs, admin appearance protection, and friendly wording. It does not save screenshots.
