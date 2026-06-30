# Official Medication Source Map

Countries and source strategy:

- EG: EDA EDDB/search and EDA register sources. Bulk EDDB enumeration is forbidden. Coverage remains partial/manual-required unless a complete official file is uploaded.
- KSA: SFDA Drugs List. Public live downloader is recorded as discovery-first; official CSV/JSON upload is supported.
- UAE: MOHAP registered medical product directory and API marketplace. API approval is required when gated. Official upload is supported.
- QAT: MOPH registered pharmaceutical products with prices XLSX. Source is tracked; XLSX parsing needs approved parser support or official CSV/JSON conversion.
- KWT: Kuwait MOH drug and food supplement price-list PDFs. Source is tracked; PDF parsing must route low-confidence rows to review.
- BHR: NHRA registered medicine price list/open data. Source is tracked; XLSX parsing needs approved parser support or official CSV/JSON conversion.
- OMN: Oman MOH Drug Safety Center. Official/licensed upload required until a clean public bulk source is confirmed.
- YEM: official upload only, disabled by default.

Blocked source classes: CAPTCHA, login bypass, API approval bypass, paywall bypass, pharmacy stock, purchase, cart, checkout, branch stock, and retail sources overriding official data.

