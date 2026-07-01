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
# v0.8.2 Egypt EDA Guard

Egypt remains limited to official owner-provided files and targeted lookup only.

Commands:

```powershell
npm run medication:import:eda-file -- --file "C:\Path\To\official-eda-file.xlsx"
npm run medication:eda:lookup -- --type tradeName --query "minimum 3 letters"
```

Short targeted queries and bulk enumeration remain rejected. Verification-code, CAPTCHA, login, session, and protected-source flows must not be bypassed.

Owner intake supports official EDA CSV, XLSX, JSON, or parser-approved PDF files. Egypt remains official file upload plus explicit targeted lookup only; no bulk enumeration is allowed.
