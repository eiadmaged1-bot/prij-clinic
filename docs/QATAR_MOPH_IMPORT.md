# Qatar MOPH Import

Commands:

```powershell
npm run medication:import:qatar -- --mode dry-run
npm run medication:import:qatar -- --mode live
```

v0.8.2 behavior:
- Treats official MOPH pages as HTML discovery pages.
- Parses visible links and official file selectors.
- Accepts XLSX content type, octet-stream with XLSX filename, or XLSX magic header.
- If HTML is returned again, parses one additional official HTML hop and then stops.

Status on 2026-07-01: failed safely. The official pages returned HTML and did not expose a supported public XLSX/source-file link to the importer. Candidate diagnostics record final URL, content type, and visible candidate count. No fallback rows were created.

Owner intake:

```powershell
npm run medication:import:official -- --country QAT --source QATAR_OFFICIAL_FILE_UPLOAD --mode upload-required --file "C:\Path\To\official-qatar-file.xlsx"
```

Use official or licensed Qatar MOPH files only. Do not upload pharmacy stock, checkout, retail, or patient data.
