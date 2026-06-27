# Next Decisions

## Purpose
These decisions should be resolved before implementation starts or before the related feature moves into build. The goal is to keep the MVP safe, scoped, and auditable.

## Product Scope
| Decision | Needed by | Options | Recommendation |
| --- | --- | --- | --- |
| Single clinic or multi-branch MVP | Before database implementation | Single clinic now; branch-ready schema; full multi-branch MVP | Use branch-ready schema if multiple branches are likely, but keep workflows simple. |
| MVP deployment target | Before scaffold | Local clinic server; private cloud; managed hosting | Choose target early because backups, file storage, and secrets depend on it. |
| Supported languages and date formats | Before UI build | English only; bilingual; custom formats | Decide now to avoid rework in forms, reports, and print layouts. |
| Minimum patient registration fields | Before patient model | Very minimal; operational minimum; detailed intake | Use operational minimum and add optional fields later. |
| Patient duplicate handling | Before patient registration | Warning only; merge workflow; admin-only merge | MVP should warn; merge can be V1. |

## Clinical Workflow
| Decision | Needed by | Options | Recommendation |
| --- | --- | --- | --- |
| Encounter note structure | Before encounter UI | Free text sections; structured templates; hybrid | MVP should use clear doctor-authored sections, with OB/GYN templates in V1 after clinical review. |
| Signed encounter correction model | Before encounter implementation | Append correction; versioned replacement; void and recreate | Use append or versioned correction; never silently overwrite. |
| Assistant/nurse allowed fields | Before prep workflow | Vitals only; vitals plus reason summary; broader prep notes | Define exact allowed fields and keep them separate from doctor notes. |
| Prescription finalization wording | Before prescription workflow | Approved; finalized; signed | Pick one term consistently and reserve it for doctor action. |
| Investigation priority values | Before investigation workflow | Routine/urgent; configurable list; free text | Use a small configurable list, avoiding emergency triage claims. |
| Follow-up workflow | Before encounter and appointments | Note only; task; appointment link | MVP should support follow-up note and optional appointment link. |

## Reports and Integrations
| Decision | Needed by | Options | Recommendation |
| --- | --- | --- | --- |
| Report file storage location | Before report upload | Local protected storage; object storage; external document system | Choose based on deployment target; never store report files in repository. |
| Report file types allowed in MVP | Before upload UI | PDF only; PDF/images; configurable allowlist | Use a strict allowlist for PDF and common image formats if needed. |
| Maximum file size | Before upload UI | Small limit; clinic-configured; storage-tier limit | Define conservative MVP limit and document operational process for oversized files. |
| Report deletion policy | Before report workflow | Soft delete; void only; admin hard delete | Prefer void/correction workflow with restricted deletion. |
| External report source labels | Before report model | Free text; controlled list; hybrid | Use controlled categories plus optional source note. |
| First direct integration | Before V2 planning | Lab; radiology/PACS; ultrasound; pathology | Do not choose until manual MVP usage identifies the highest-value integration. |
| Integration reconciliation rules | Before any integration | Manual review; automatic match; hybrid | Require manual review for unmatched or conflicting external results. |

## Billing and Payments
| Decision | Needed by | Options | Recommendation |
| --- | --- | --- | --- |
| Currency and tax behavior | Before invoice model | Single currency; multi-currency; tax enabled/disabled | Start with one configured currency and explicit tax setting. |
| Service catalog | Before billing UI | Free text lines; fixed service catalog; hybrid | MVP can use a small service catalog plus authorized manual line items. |
| Discount policy | Before billing workflow | Any billing user; manager approval; admin only | Require explicit permission and audit reason. |
| Refund and reversal policy | Before payments workflow | Billing role; admin approval; dual approval | Start permission-controlled; consider dual approval in V1 if needed. |
| Payment methods | Before payment UI | Cash only; cash/bank/card reference; custom | Store method and reference note only; never store card numbers or secrets. |
| Payment gateway timing | Before V2 | MVP; V1; V2 | Defer to V2 after payment security review. |

## Roles and Security
| Decision | Needed by | Options | Recommendation |
| --- | --- | --- | --- |
| Initial role set | Before auth/RBAC build | Six roles; finer-grained roles; custom role builder | Start with Admin, Doctor, Receptionist, Nurse/Assistant, Billing, Read-only Auditor. |
| Branch scoping | Before RBAC model | None; optional; required | Add branch-ready scope if more than one location is possible. |
| Admin clinical access | Before permission defaults | Full access; explicit clinical permission; break-glass only | Require explicit clinical permission. |
| Sensitive read audit depth | Before audit implementation | Key screens only; all reads; reads plus exports | MVP should audit sensitive clinical/report/export reads at minimum. |
| MFA timing | Before launch | MVP; V1; later | Basic auth in MVP, MFA for admin and doctor accounts in V1 unless deployment risk requires earlier. |
| Account lockout policy | Before auth build | Throttle; lockout; both | Use throttling and define lockout/recovery policy. |
| Session timeout | Before auth build | Short; medium; role-based | Use role-based or clinic-approved timeout values. |

## Audit Logs
| Decision | Needed by | Options | Recommendation |
| --- | --- | --- | --- |
| Audit event severity levels | Before audit model | Low/medium/high; custom list | Use simple levels with clear examples. |
| Audit before/after detail | Before implementation | Field names only; summaries; full payloads | Store safe summaries, not full clinical notes or report contents. |
| Audit retention | Before production | Fixed period; indefinite; legal policy driven | Decide with legal/clinic owner before real data use. |
| Audit export access | Before audit UI | Admin only; auditor role; system owner | Prefer read-only auditor with explicit export permission. |
| Tamper-evident storage | Before V1 | Basic append-only; hash chaining; external log store | Basic append-only for MVP, stronger tamper evidence in V1. |

## Backups and Recovery
| Decision | Needed by | Options | Recommendation |
| --- | --- | --- | --- |
| Backup schedule | Before real use | Daily; more frequent; custom | Define based on clinic tolerance for data loss. |
| Backup retention | Before real use | Short; medium; long; policy-based | Decide with clinic owner and legal/compliance advice. |
| Backup encryption and key ownership | Before real use | Platform-managed; clinic-managed; hybrid | Choose before storing real data. |
| Restore test frequency | Before real use | Monthly; quarterly; after major changes | Require at least pre-launch and regular scheduled tests. |
| Report file backup strategy | Before report upload | Same backup; separate object storage backup; external system | Must match chosen file storage model. |
| Restore test environment | Before production | Local isolated; staging; disaster recovery environment | Use isolated environment with fake or approved restored data handling. |

## AI Draft Features
| Decision | Needed by | Options | Recommendation |
| --- | --- | --- | --- |
| AI phase timing | Before any AI work | MVP; V1; Future | Future only, after core system, RBAC, audit, consent, and backups are stable. |
| Allowed AI draft types | Before AI design | Encounter summaries; patient instructions; report summaries; admin text | Start with the lowest-risk draft type after clinical review. |
| AI provider and data handling | Before AI design | External API; local model; no AI | Requires privacy, consent, vendor, audit, and security review. |
| Prompt logging policy | Before AI design | No full prompts; encrypted prompt store; metadata only | Prefer metadata and source references unless secure approved design exists. |
| Doctor approval workflow | Before AI build | Approve/reject; edit/approve/reject; multi-step review | Require explicit doctor review, edit tracking, approval, rejection, and audit logs. |
| AI output retention | Before AI build | Short retention; same as record; configurable | Decide based on privacy and audit requirements. |

## Implementation Readiness Checklist
- MVP backlog accepted by clinic owner and engineering owner.
- Data model reviewed for audit logs, RBAC, consent, reports, billing, and backups.
- Security rules accepted, including secret-free repository and privacy-safe logs.
- Report file storage design chosen.
- Backup and restore-test approach chosen.
- Initial roles and permission matrix accepted.
- Encounter correction and prescription approval workflows accepted by clinical owner.
- Billing policies for discounts, refunds, voids, and payment methods accepted.
- AI confirmed as future draft-only work, not part of MVP implementation.
