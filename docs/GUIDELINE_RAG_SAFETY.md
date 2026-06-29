# Guideline RAG Safety

This sprint implements mock/local RAG only.

Rules:
- No external AI API calls.
- No model provider SDK.
- No embeddings service.
- No guideline file is sent to an external AI service.
- Private guideline files can be viewed or downloaded only through audited API file-access endpoints.
- No automatic diagnosis.
- No automatic prescription.
- No treatment plan saved to a patient record.
- Answers are extractive and based only on indexed chunks.
- If no chunk matches, the answer is exactly: `No source found in your local library.`
- Every non-empty answer includes citations.
- UI labels every answer as: `Evidence summary from local library only.`
- Doctor review is required.

Future work may add pgvector, local embeddings, local LLM, or optional OpenAI mode only after safety, consent, logging, and review controls are designed.

Private-vault hardening does not change the mock/local RAG boundary. Indexed chunks remain local database content, answers remain extractive, and file downloads are controlled separately by owner-managed private vault settings.
