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
