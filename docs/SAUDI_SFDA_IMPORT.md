# Saudi SFDA Import

Commands:

```powershell
npm run medication:import:sfda -- --mode dry-run --max-pages 2
npm run medication:import:sfda -- --mode live --max-pages all
```

v0.8.2 behavior:
- Uses only the official SFDA public list page.
- Attempts server-rendered HTML table parsing.
- Respects `--max-pages`.
- Records a failed/blocked source status if the page is dynamic, times out, or lacks a parseable public table.

Status on 2026-07-01: failed safely. The official public HTML path did not expose a parseable server-rendered table for the dry diagnostic with `--max-pages 2`. No bypass, login, CAPTCHA workaround, protected API use, or third-party mirror was used.

Owner intake:

```powershell
npm run medication:import:official -- --country KSA --source SFDA_OFFICIAL_FILE_UPLOAD --mode upload-required --file "C:\Path\To\official-sfda-file.xlsx"
```

Supported owner-provided official formats are CSV, XLSX, JSON, and parser-approved PDF/text where available.
