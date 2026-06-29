# Guideline RAG Safety

Status: future-RAG foundation only.

This sprint does not implement generative RAG or external model calls. The `/guidelines/ask` route is local and extractive: it searches stored chunks, returns short cited text, and explicitly requires doctor review.

Rules:
- No external AI calls.
- No diagnosis.
- No prescription.
- No final treatment plan.
- No PHI upload.
- No paywall scraping or login bypass.
- No licensed PDFs committed to the repository.
- If no local source is found, the app returns a no-source state.

Future RAG work must add governance checks before any production use:
- source license review,
- document version review,
- chunk quality review,
- citation traceability,
- hallucination and unsafe-wording tests,
- explicit doctor approval workflow.
