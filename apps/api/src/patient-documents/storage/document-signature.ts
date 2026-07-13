import { BadRequestException } from "@nestjs/common";
import { extname } from "node:path";
import type { DetectedDocumentType } from "./document-storage.types";

const allowedExtensions = new Map<string, Set<string>>([
  ["image/jpeg", new Set([".jpg", ".jpeg"])], ["image/png", new Set([".png"])],
  ["image/webp", new Set([".webp"])], ["application/pdf", new Set([".pdf"])]
]);

export function detectAndValidateDocument(buffer: Buffer, declaredMime: string, filename: string): DetectedDocumentType {
  if (!buffer.length) fail("DOCUMENT_EMPTY", "Document is empty.");
  const detected = detect(buffer);
  if (!detected) fail("DOCUMENT_TYPE_NOT_ALLOWED", "Document type is not allowed.");
  if (declaredMime.toLowerCase() !== detected.mimeType) fail("DOCUMENT_SIGNATURE_MISMATCH", "Declared document type does not match its content.");
  const lower = filename.toLowerCase();
  const extension = extname(lower);
  if (!allowedExtensions.get(detected.mimeType)?.has(extension) || suspiciousDoubleExtension(lower)) {
    fail("DOCUMENT_SIGNATURE_MISMATCH", "Document extension does not match its content.");
  }
  validateComplete(buffer, detected.mimeType);
  return detected;
}

function detect(buffer: Buffer): DetectedDocumentType | null {
  if (buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return { mimeType: "image/jpeg", extension: ".jpg", kind: "image" };
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return { mimeType: "image/png", extension: ".png", kind: "image" };
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return { mimeType: "image/webp", extension: ".webp", kind: "image" };
  if (buffer.length >= 8 && buffer.toString("ascii", 0, 5) === "%PDF-") return { mimeType: "application/pdf", extension: ".pdf", kind: "document" };
  return null;
}

function validateComplete(buffer: Buffer, mime: string) {
  if (mime === "image/jpeg" && !buffer.subarray(-2).equals(Buffer.from([0xff, 0xd9]))) fail("DOCUMENT_CORRUPT", "Document is truncated or corrupt.");
  if (mime === "image/png" && !buffer.includes(Buffer.from("IEND"))) fail("DOCUMENT_CORRUPT", "Document is truncated or corrupt.");
  if (mime === "image/webp" && buffer.readUInt32LE(4) + 8 > buffer.length) fail("DOCUMENT_CORRUPT", "Document is truncated or corrupt.");
  if (mime === "application/pdf" && !buffer.subarray(Math.max(0, buffer.length - 1024)).includes(Buffer.from("%%EOF"))) fail("DOCUMENT_CORRUPT", "Document is truncated or corrupt.");
}

function suspiciousDoubleExtension(filename: string) {
  return /\.(exe|com|bat|cmd|ps1|js|vbs|scr|msi|zip|rar|7z)\.[a-z0-9]+$/i.test(filename);
}

function fail(code: string, message: string): never { throw new BadRequestException({ code, message }); }
