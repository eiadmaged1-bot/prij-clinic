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

Status on 2026-06-30: failed. The official pages returned HTML but did not expose a supported public XLSX link to the importer. No fallback rows were created.
