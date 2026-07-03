import { BadRequestException, Injectable } from "@nestjs/common";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, extname, isAbsolute, join, relative, resolve } from "node:path";
import { sha256 } from "./file-hash";
import { PatientFileStoragePolicy } from "./file-storage-policy";

export type PreparedPatientFile = {
  storageMode: "metadata_only" | "local_demo_file" | "production_external_storage_placeholder";
  originalSha256Internal: string;
  storedSha256: string;
  fileSizeBytes: number;
  localDemoFilePath?: string | null;
  warnings: string[];
};

export type PreparePatientFileInput = {
  buffer: Buffer;
  mimeType: string;
  safeExtension?: string;
  sha256Override?: string;
  policy: PatientFileStoragePolicy;
};

const ALLOWED_LOCAL_DEMO_NON_IMAGE_MIME_TYPES = new Set(["application/pdf", "text/plain"]);

@Injectable()
export class PatientFileStorageService {
  async prepareForPatientDocument(input: PreparePatientFileInput): Promise<PreparedPatientFile> {
    const storedSha256 = input.sha256Override ?? sha256(input.buffer);
    const originalSha256Internal = sha256(input.buffer);
    const warnings: string[] = [];

    if (input.policy.mode !== "local_demo_file") {
      return {
        storageMode: input.policy.mode,
        originalSha256Internal,
        storedSha256,
        fileSizeBytes: input.buffer.length,
        localDemoFilePath: null,
        warnings
      };
    }

    if (!input.mimeType.startsWith("image/") && !ALLOWED_LOCAL_DEMO_NON_IMAGE_MIME_TYPES.has(input.mimeType)) {
      throw new BadRequestException("Only sanitized images, PDFs, and plain text files can be stored in local demo file mode.");
    }

    const extension = safeExtension(input.safeExtension, input.mimeType);
    const root = patientDocumentStorageRoot();
    await mkdir(root, { recursive: true });
    const path = join(root, `${storedSha256}${extension}`);
    assertPathInsideRoot(path, root);
    await writeFile(path, input.buffer);

    return {
      storageMode: "local_demo_file",
      originalSha256Internal,
      storedSha256,
      fileSizeBytes: input.buffer.length,
      localDemoFilePath: path,
      warnings
    };
  }
}

export function patientDocumentStorageRoot() {
  return resolve(process.cwd(), "storage", "patient-documents", "sanitized");
}

export function safeDisplayFileName(value: string | undefined, fallback = "patient-document") {
  return basename(value || fallback).replace(/[^\w.\- ]/g, "_") || fallback;
}

function safeExtension(extension: string | undefined, mimeType: string) {
  if (extension && /^\.[a-z0-9]{1,8}$/i.test(extension)) return extension.toLowerCase();
  if (mimeType === "application/pdf") return ".pdf";
  if (mimeType === "text/plain") return ".txt";
  return extname(extension || "") || ".bin";
}

function assertPathInsideRoot(path: string, root: string) {
  const relativePath = relative(root, resolve(path));
  if (relativePath === "" || (relativePath && !relativePath.startsWith("..") && !isAbsolute(relativePath))) return;
  throw new BadRequestException("Unsafe patient file storage path.");
}
