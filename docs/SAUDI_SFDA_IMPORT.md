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

Status on 2026-06-30: failed. The official public HTML path timed out or was not safely parseable. No bypass, login, CAPTCHA workaround, or third-party mirror was used.
