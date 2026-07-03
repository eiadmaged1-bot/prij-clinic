import { BadRequestException, ServiceUnavailableException } from "@nestjs/common";
import { PatientDocumentStorageMode } from "@prisma/client";

export type PatientFileStorageMode = "metadata_only" | "local_demo_file" | "production_external_storage_placeholder";

export type PatientFileStoragePolicy = {
  mode: PatientFileStorageMode;
  writesLocalBytes: boolean;
  productionProviderRequired: boolean;
};

export function resolvePatientFileStoragePolicy(requestedMode?: string | null): PatientFileStoragePolicy {
  const mode = normalizeMode(requestedMode ?? process.env.PATIENT_FILE_STORAGE_MODE ?? "metadata_only");
  const environment = (process.env.APP_ENV || process.env.NODE_ENV || "local").toLowerCase();
  const isProduction = environment === "production" || environment === "prod";

  if (mode === "local_demo_file") {
    if (isProduction) {
      throw new ServiceUnavailableException("local_demo_file storage is forbidden in production.");
    }
    return { mode, writesLocalBytes: true, productionProviderRequired: false };
  }

  if (mode === "production_external_storage_placeholder") {
    if (!process.env.PATIENT_FILE_EXTERNAL_STORAGE_PROVIDER) {
      throw new ServiceUnavailableException("Production patient file storage provider is not configured.");
    }
    return { mode, writesLocalBytes: false, productionProviderRequired: true };
  }

  return { mode: "metadata_only", writesLocalBytes: false, productionProviderRequired: false };
}

export function prismaStorageMode(mode: PatientFileStorageMode): PatientDocumentStorageMode {
  return mode as PatientDocumentStorageMode;
}

function normalizeMode(value: string): PatientFileStorageMode {
  if (value === "metadata_only" || value === "local_demo_file" || value === "production_external_storage_placeholder") {
    return value;
  }
  if (value === "external_reference_placeholder") {
    return "production_external_storage_placeholder";
  }
  throw new BadRequestException("Unsupported patient file storage mode.");
}
