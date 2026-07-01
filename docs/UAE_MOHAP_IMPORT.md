# UAE MOHAP Import

Primary sources: MOHAP registered medical product directory and MOHAP open-data/API marketplace.

If API credentials or marketplace approval are required, the app records `blocked_requires_api_approval`. It does not bypass approval. Official owner-provided file upload is supported.

Owner intake:

```powershell
npm run medication:import:official -- --country UAE --source UAE_OFFICIAL_FILE_UPLOAD --mode upload-required --file "C:\Path\To\official-uae-file.xlsx"
```

Use approved MOHAP API access or official/licensed owner-provided files only. Do not bypass API approval.
