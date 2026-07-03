import assert from "node:assert/strict";
import exifr from "exifr";
import { createSyntheticExifJpeg } from "./create-exif-test-image.mjs";

const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const EMAIL = process.env.DEMO_TEST_EMAIL || "demo.owner@prij.local";
const PASSWORD = process.env.DEMO_TEST_PASSWORD || "LocalDev123!";
const STORAGE_MODE = process.env.PATIENT_FILE_STORAGE_MODE || "metadata_only";

async function main() {
  const healthy = await isApiHealthy();
  if (!healthy) {
    console.warn("DOCUMENT-UPLOAD SKIP API is not running; start the API and database to run this integration test.");
    return;
  }

  const token = await login();
  const patient = await json("/patients", token, {
    method: "POST",
    body: JSON.stringify({
      medicalRecordNumber: `IMG-${Date.now()}`,
      firstName: "Image",
      lastName: "SanitizerDemo",
      patientType: "GYN",
      notes: "Synthetic demo patient for image metadata upload regression."
    }),
    headers: { "content-type": "application/json" }
  });

  const image = await createSyntheticExifJpeg();
  const before = await exifr.parse(image, { gps: true });
  assert.equal(before.latitude, 12.345, "synthetic upload image contains fake GPS before upload");

  const form = new FormData();
  form.set("file", new Blob([image], { type: "image/jpeg" }), "synthetic-fake-exif.jpg");
  form.set("title", "Synthetic EXIF image upload");
  form.set("documentType", "clinical_photo_demo_only");
  form.set("category", "Synthetic privacy test");
  form.set("storageMode", STORAGE_MODE);
  form.set("summaryText", "Synthetic image metadata stripping regression. No real patient content.");

  const document = await json(`/patients/${patient.id}/documents/upload`, token, {
    method: "POST",
    body: form
  });

  assert.equal(document.exifStripped, true, "upload response marks image as EXIF stripped");
  assert.equal(document.fileMimeType, "image/jpeg", "upload response keeps sanitized MIME type");
  assert.equal(document.storageMode, STORAGE_MODE, "upload response uses configured storage mode");
  assert.ok(document.imageWidth > 0 && document.imageHeight > 0, "upload response includes dimensions");

  const responseText = JSON.stringify(document);
  assert.equal(responseText.includes("12.345"), false, "response does not expose GPS latitude");
  assert.equal(responseText.includes("67.890"), false, "response does not expose GPS longitude");
  assert.equal(responseText.includes("FAKE_CAMERA_MODEL"), false, "response does not expose EXIF model");
  if (STORAGE_MODE === "metadata_only") {
    assert.equal(document.localDemoFilePath, null, "metadata_only response has no local file path");
    assert.equal(document.fileReference, null, "metadata_only response has no file reference");
  }

  console.log("DOCUMENT-UPLOAD PASS image upload metadata stripping checks");
}

async function isApiHealthy() {
  try {
    const response = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(3000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function login() {
  const body = await json("/auth/login", null, {
    method: "POST",
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    headers: { "content-type": "application/json" }
  });
  return body.token;
}

async function json(path, token, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      accept: "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}: ${text.slice(0, 300)}`);
  }
  return body;
}

main().catch((error) => {
  console.error("DOCUMENT-UPLOAD FAIL", error);
  process.exit(1);
});
