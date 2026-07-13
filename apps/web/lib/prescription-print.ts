export const A5_PRINT_LAYOUT = {
  page: { widthMm: 148, heightMm: 210 },
  safeArea: { topMm: 34, rightMm: 13, bottomMm: 20, leftMm: 13 },
  patientRowTopMm: 35,
  medicationsTopMm: 53,
  signatureBottomMm: 18,
  // TODO: Set this only after the clinic approves the final undistorted template asset and field placement.
  approvedBackgroundUrl: null as string | null
} as const;

export function prescriptionTextDirection(value: string) {
  return /[\u0600-\u06ff]/.test(value) ? "rtl" : "ltr";
}
