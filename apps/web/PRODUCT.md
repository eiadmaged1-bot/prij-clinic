# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Receptionists** run the front-desk loop: find or register patients, manage appointments, check patients in, update the waiting line, and record permitted payments.
- **Doctors** work from their schedule and queue into a patient-centered visit: review history and preparation, author and sign encounters, create or approve prescriptions and investigation requests, review results, and set follow-up.
- **Nurses or assistants** record permitted preparation information such as vitals, visit-reason summaries, received documents, rooming state, and follow-up tasks. Their notes remain distinct from doctor-authored records.
- **Owners and clinic administrators** oversee clinic operations, users, roles, permissions, settings, audit review, service configuration, and security readiness.
- **Billing and accounting staff** manage invoices, payments, balances, adjustments, and finance reporting within explicit permissions.

The primary operating situation is a busy OB/GYN and women's-health clinic day. Each role needs a focused interface that exposes only the information and actions necessary for the current task.

## Product Purpose

Prij Clinic is the internal staff web application for Dr Maged Attia Clinics. It connects patient intake, appointments, queue flow, doctor visits, clinical records, investigations, reports, billing, follow-up, and administration into one role-aware workflow.

Success means staff can move a patient safely through the clinic day with less duplicate entry and less workflow ambiguity while preserving patient identity, consent state, record status, authorship, permissions, and auditability at every sensitive transition.

## Positioning

Prij Clinic is organized around the clinic-day workflow rather than a generic collection of medical dashboards. Reception, doctor, and owner/admin interfaces provide different operational views of one auditable patient and visit spine. Clinical assistance, templates, calculators, and AI-derived content are starting points or drafts; the doctor remains the clinical decision-maker and final approver.

## Operating Context

- Staff authenticate before accessing clinic workflows; the frontend routes users to role-appropriate workspaces.
- Reception work centers on patient lookup, registration, appointments, check-in, returning-patient QR lookup, and the waiting line.
- The doctor visit uses seven explicit stages: History, Care Assist, Encounter, Prescription, Investigations, Follow-up, and Review and Print.
- Patient identity and visit state remain visible before clinical writes. Draft progress can be saved and revisited before finalization.
- Patient files organize appointments, encounters, prescriptions, orders, results, reports, documents, pregnancy and ultrasound records, billing, consents, referrals, tasks, medications, allergies, internal notes, timelines, and reviewed AI drafts according to permissions.
- The product supports English LTR and Arabic RTL use across desktop, tablet, and mobile layouts. The shell remains structurally stable when language direction changes.
- Printed clinical artifacts use dedicated print views and do not inherit the application navigation shell.
- Development, testing, documentation, and screenshots use demo data only. Public tunnels are QA tools, not production deployment.

## Capabilities and Constraints

- Core capabilities include patients, appointments, queue, doctor calendar, encounters, prescriptions, investigations, reports, pregnancy and OB ultrasound records, billing, payments, roles, permissions, audit logs, consent, backups, and security operations.
- Server-side authorization is the security boundary. Hiding an action in the UI is not authorization.
- Clinical record creation, updates, signatures, corrections, voids, sensitive access, and exports require appropriate permissions and audit coverage.
- Signed encounters are not silently overwritten; corrections require a versioned or appended, audited amendment path.
- Prescriptions and investigation sets create editable drafts or requests. They are not autonomous clinical recommendations.
- Care Assist and AI output are assistive, draft-only, and explicitly subject to doctor review. They must not autonomously diagnose, prescribe, select doses, rank treatment, finalize records, or bypass consent, RBAC, or audit logging.
- External AI is disabled by default. Patient or clinical information must not be sent to an external provider without separately approved governance and consent.
- Reports and clinical files belong in access-controlled storage; repository files contain metadata and safe examples only.
- Billing records do not store card numbers, payment secrets, or unnecessary clinical detail.
- Queue priority is an operational marker, not emergency triage.
- No production-readiness, regulatory-compliance, or automated clinical-safety claim is established by the current repository.
- Real patient data is not approved until privacy, legal, deployment, backup/restore, security, and role-by-role operational signoff are complete.

## Brand Commitments

- The official product name is **Dr Maged Attia Clinics**; the repository and design workflow also use **Prij Clinic** as the product/system name.
- Product language is calm, direct, professional, and operational. Normal interfaces use friendly clinic terminology rather than API, schema, or developer vocabulary.
- Safety messaging is specific and proportionate. It must clarify responsibility and review state without presenting unverified medical claims.
- The interface must support compact, clinically readable role-based workspaces rather than generic dashboards.

## Evidence on Hand

- Product scope and safety boundaries: `../../PRODUCT_REQUIREMENTS.md`
- Current implementation and verification state: `../../README.md` and `../../CURRENT_STATUS.md`
- Workflow definitions: `../../docs/WORKFLOWS.md`
- Doctor visit sequence and review boundaries: `../../docs/DOCTOR_VISIT_WORKFLOW.md`
- Security and audit spine: `../../docs/WORKFLOW_SPINE_SECURITY.md`
- Incumbent visual rules: `../../docs/DESIGN_SYSTEM.md`
- Role navigation and patient modules: `app/navigation-registry.ts`
- Role landing behavior: `lib/role-routing.ts`
- Implemented theme, density, contrast, and reduced-motion preferences: `app/theme.tsx` and `lib/interface-mode.ts`
- Implemented global tokens, responsive behavior, RTL rules, and component styles: `app/globals.css`
- Shared frontend primitives: `components/clinic/desktop-ui.tsx`

The repository contains no approved testimonials, outcome benchmarks, regulatory certifications, production-readiness evidence, or permission to use real patient information. Future product and marketing work must not fabricate them.

## Product Principles

1. **The doctor remains responsible.** Assistance can structure, surface, or draft information, but it never replaces clinical judgment or explicit approval.
2. **Identity before action.** Keep the active patient, visit, authorship, consent, and record status unambiguous before any sensitive write.
3. **One workflow, role-specific views.** Reduce each role's interface to its real clinic-day tasks while maintaining a shared, auditable operational spine.
4. **Draft safely, finalize deliberately.** Preserve draft progress, block incomplete finalization, and make signed-record amendments explicit and auditable.
5. **Privacy and auditability are product behavior.** Minimize exposed information, enforce RBAC on the server, and make sensitive transitions traceable from the beginning.

## Accessibility & Inclusion

- Support English LTR and Arabic RTL without rearranging the product's conceptual structure or breaking icon, control, and form alignment.
- Maintain usable desktop, tablet, and mobile workflows without horizontal overflow; smaller screens use responsive stacking and closed-by-default navigation.
- Interactive targets should remain at least 44px where the implemented system establishes that floor.
- Focus must be clearly visible for keyboard users.
- Safety-critical, warning, error, success, review, and disabled states must use accessible semantic treatment and must never rely on color alone; pair color with text, labels, icons, status, or structure.
- Preserve high-contrast and reduced-motion preferences where implemented.
- Compact density must not compromise clinical readability, state clarity, or safe touch interaction.
