# Egypt EDA Import

Commands:

```powershell
npm run medication:import:eda-file -- --file "C:\Path\To\official-eda-file.xlsx"
npm run medication:eda:lookup -- --type tradeName --query "minimum 3 letters"
```

Rules:
- Official owner-provided files only for bulk import.
- Supported file types include XLSX, CSV, JSON, and best-effort PDF text.
- Targeted lookup requires one explicit query of at least 3 characters.
- No alphabet enumeration, generic enumeration, CAPTCHA bypass, login bypass, or bulk brute-force.

If no official file is provided, Egypt coverage remains manual-required and Egyptian row count remains 0.
