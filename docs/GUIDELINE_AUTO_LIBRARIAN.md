# Guideline Auto-Librarian

The auto-librarian supports controlled local imports:

- Private licensed PDF or text upload through `/guidelines/upload`.
- Direct open/public URL import through `/guidelines/import-url`.
- Local extraction and chunking.
- Local keyword ranking.
- Import/update job records.
- Audit logs for uploads, imports, searches, answers, reviews, archives, and refused imports.

It refuses `LOGIN_REQUIRED`, `LINK_ONLY`, and `DO_NOT_IMPORT` sources. Public restricted sources require explicit approval before import.

Scripts:

```powershell
npm run guidelines:import-open -- --url "https://example.org/guideline.pdf" --title "Example Guideline" --source "WHO" --specialty "obstetrics" --topic "antenatal care"
npm run guidelines:reindex
npm run guidelines:check-updates
```

The scripts call the local API. They do not download files into the repository and do not bypass authentication.
