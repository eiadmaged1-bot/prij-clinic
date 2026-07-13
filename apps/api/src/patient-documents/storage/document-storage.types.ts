export type DetectedDocumentType = {
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  extension: ".jpg" | ".png" | ".webp" | ".pdf";
  kind: "image" | "document";
};

export type StoredDocument = {
  storageKey: string;
  encryptionVersion: number;
  encryptionKeyId: string;
  sizeBytes: number;
};

export type MalwareScanResult = {
  status: "CLEAN" | "REJECTED" | "ERROR" | "NOT_CONFIGURED";
  provider: string | null;
};

export interface DocumentMalwareScanner {
  scan(buffer: Buffer): Promise<MalwareScanResult>;
}
