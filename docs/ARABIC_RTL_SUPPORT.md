# Arabic and RTL Support

Arabic preference is stored in `prijClinicLanguage`. Selecting Arabic updates the root document to `<html lang="ar" dir="rtl">`; English restores `lang="en" dir="ltr"`. Stored clinical data is not translated or destructively normalized.

Arabic search normalization is separate from original values and handles Alef variants, Arabic digits, whitespace, and bilingual clinical-tag aliases. Imports accept UTF-8/BOM and explicitly selected Windows-1256, and stop on replacement characters or suspicious question-mark corruption.

Mixed-direction print and guideline content uses local direction detection or `dir="auto"`. Full UI translation remains incomplete; see `KNOWN_LIMITATIONS.md`.
