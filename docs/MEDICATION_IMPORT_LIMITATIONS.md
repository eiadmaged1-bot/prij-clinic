# Medication Import Limitations

Current limitations:
- No fake fallback rows are created when a live source fails or is gated.
- CSV and JSON official uploads are supported.
- XLSX and PDF parsing are represented by parser modules and source coverage states, but native table extraction needs an approved parser implementation.
- UAE MOHAP may require approved API credentials.
- Egypt bulk coverage requires an official bulk file; EDDB brute-force enumeration is forbidden.
- Oman requires official/licensed upload until a public bulk source is confirmed.

