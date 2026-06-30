export type OfficialParserKey =
  | "sfda-drugs-list"
  | "eda-official-file"
  | "eda-drug-register"
  | "uae-mohap-directory"
  | "qatar-moph-xlsx"
  | "kuwait-moh-price-pdf"
  | "bahrain-nhra-xlsx"
  | "oman-official-upload"
  | "generic-official-csv"
  | "generic-official-json"
  | "generic-official-pdf-text";

export const officialParserRegistry: Record<string, { parserName: OfficialParserKey; version: string; notes: string }> = {
  SFDA_DRUGS_LIST: { parserName: "sfda-drugs-list", version: "v0.8", notes: "SFDA official rows; live fetch requires safe public endpoint or official upload." },
  EDA_EGYPTIAN_DRUG_REGISTER: { parserName: "eda-drug-register", version: "v0.8", notes: "Egypt public registers are partial unless complete official file is supplied." },
  EDA_OFFICIAL_FILE_UPLOAD: { parserName: "eda-official-file", version: "v0.8", notes: "Owner-provided EDA/EDDB official file." },
  UAE_MOHAP_REGISTERED_MEDICAL_PRODUCT_DIRECTORY: { parserName: "uae-mohap-directory", version: "v0.8", notes: "Requires public direct file, approved API, or official upload." },
  QATAR_MOPH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES: { parserName: "qatar-moph-xlsx", version: "v0.8", notes: "Official Qatar XLSX parser placeholder; no fake fallback." },
  KUWAIT_MOH_DRUG_PRICE_LIST: { parserName: "kuwait-moh-price-pdf", version: "v0.8", notes: "Best-effort PDF parser; low confidence requires review." },
  BAHRAIN_NHRA_REGISTERED_MEDICINE_PRICE_LIST: { parserName: "bahrain-nhra-xlsx", version: "v0.8", notes: "Official Bahrain XLSX parser placeholder." },
  OMAN_OFFICIAL_FILE_UPLOAD: { parserName: "oman-official-upload", version: "v0.8", notes: "Official upload only until public bulk source is confirmed." }
};
