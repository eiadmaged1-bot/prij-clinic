export function currencyForCountry(countryCode: string) {
  return ({ EG: "EGP", KSA: "SAR", UAE: "AED", QAT: "QAR", KWT: "KWD", BHR: "BHD", OMN: "OMR", YEM: "YER" } as Record<string, string>)[countryCode.toUpperCase()] ?? null;
}
