# Guideline Center

Status: foundation implemented.

The Guideline Center is a local evidence-library foundation. It stores source registry metadata, document metadata, local versions, sections, chunks, import jobs, review decisions, and query logs. It does not upload PHI, does not scrape paywalled content, and does not call external AI.

Implemented routes:
- `/guidelines/sources`
- `/guidelines/documents`
- `/guidelines/search`
- `/guidelines/ask`
- `/guidelines/review`
- `/guidelines/private-vault`

Access:
- Owner/admin can manage source registry, demo text import, reindex, archives, and query logs.
- Doctor can read/search/ask and perform governance review where permitted.
- Receptionist and accountant are denied guideline content routes.

Seeded registry:
WHO, NICE, RCOG, ACOG, FIGO, ESHRE, ASRM, SMFM, CDC, FSRH, Local Clinic Protocol.

Current import behavior:
- Demo text import and local chunking only.
- No committed PDFs, licensed documents, uploads, storage files, or real patient data.
- Search is local citation search.
- Ask is extractive/mock local response with citations or a no-source state.
The Guideline Center is a private/local evidence library for owner, admin, and doctor workflows. It stores guideline source metadata, private licensed uploads, extracted text, indexed chunks, citations, import jobs, update checks, and query logs.

Safety rules:
- Use demo files only in development.
- Do not upload real patient data.
- Do not scrape paywalls, login-only pages, or subscription content.
- AI-like answers are local extractive summaries only.
- No answer can diagnose, prescribe, create a treatment plan, or modify a patient record.
- Every answer must cite indexed chunks or say no source was found.

Routes:
- `/guidelines`
- `/guidelines/search`
- `/guidelines/ask`
- `/guidelines/sources`
- `/guidelines/upload`
- `/guidelines/imports`
- `/guidelines/review`
- `/guidelines/updates`
- `/guidelines/private-vault`

Receptionist, Nurse, and Accountant roles do not receive guideline permissions by default.
