# Guideline Center

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
