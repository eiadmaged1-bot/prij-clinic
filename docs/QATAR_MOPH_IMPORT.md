# Qatar MOPH Import

Command:

```powershell
npm run medication:import:qatar -- --mode dry-run
npm run medication:import:qatar -- --mode live
```

Status on 2026-06-30: blocked/source changed.

The importer used the official MOPH domain candidate for the priced products XLSX, but the official server returned HTML instead of an XLSX file. No fallback rows were created and no unofficial mirror was used.

Next action: re-check the official MOPH public page or use an owner-provided official Qatar file through the official upload path.
