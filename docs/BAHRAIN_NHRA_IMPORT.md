# Bahrain NHRA Import

Command:

```powershell
npm run medication:import:bahrain -- --mode dry-run
npm run medication:import:bahrain -- --mode live
```

Official source: Bahrain NHRA Registered Medicine Price List XLSX on `www.nhra.bh`.

Result on 2026-06-30:
- Rows seen: 3,169.
- Real rows imported: 3,169.
- Review status: all rows `needs_review`.
- Currency default: BHD when a price exists and no other currency is specified.
- Demo rows are excluded from coverage.

Mapped fields include DRN/registration number, medicine name, strength/unit, pharmaceutical form, pack size, route, legal supply method, active substances, retail price, agent, MAH, manufacturer/releasing site, and storage conditions in raw official JSON.
