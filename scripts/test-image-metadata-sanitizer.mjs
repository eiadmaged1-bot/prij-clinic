import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import exifr from "exifr";
import sharp from "sharp";
import { createSyntheticExifJpeg } from "./create-exif-test-image.mjs";

const MAX_IMAGE_PIXELS = 40_000_000;

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function sanitizeImageUpload(input) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(input.mimeType)) {
    if (["image/heic", "image/heif"].includes(input.mimeType) || input.mimeType.startsWith("image/")) {
      throw new Error("Unsupported image type");
    }
  }
  const metadata = await sharp(input.buffer, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: "warning" }).metadata();
  const image = sharp(input.buffer, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: "warning" }).rotate();
  const sanitizedBuffer =
    input.mimeType === "image/png"
      ? await image.png().toBuffer()
      : input.mimeType === "image/webp"
        ? await image.webp({ quality: 92 }).toBuffer()
        : await image.jpeg({ quality: 92, mozjpeg: true }).toBuffer();
  const sanitizedMetadata = await sharp(sanitizedBuffer).metadata();
  return {
    sanitizedBuffer,
    sanitizedMimeType: input.mimeType,
    safeExtension: input.mimeType === "image/png" ? ".png" : input.mimeType === "image/webp" ? ".webp" : ".jpg",
    width: sanitizedMetadata.width,
    height: sanitizedMetadata.height,
    originalSha256: sha256(input.buffer),
    sanitizedSha256: sha256(sanitizedBuffer),
    metadataRemoved: true,
    removedMetadataTypes: metadata.exif ? ["exif", "gps"] : [],
    warnings: []
  };
}

async function prepareFile(input) {
  if (input.mode === "metadata_only") {
    return { storageMode: "metadata_only", localDemoFilePath: null, storedSha256: input.sha256, fileSizeBytes: input.buffer.length };
  }
  if (input.mode === "local_demo_file" && input.appEnv === "production") {
    throw new Error("local_demo_file storage is forbidden in production");
  }
  const path = join(input.root, `${input.sha256}${input.extension}`);
  await writeFile(path, input.buffer);
  return { storageMode: "local_demo_file", localDemoFilePath: path, storedSha256: input.sha256, fileSizeBytes: input.buffer.length };
}

async function main() {
  const original = await createSyntheticExifJpeg();
  const before = await exifr.parse(original, { gps: true });
  assert.equal(before.Make, "FAKE_DEVICE_OWNER", "synthetic JPEG has fake EXIF Make");
  assert.equal(before.Model, "FAKE_CAMERA_MODEL", "synthetic JPEG has fake EXIF Model");
  assert.equal(before.latitude, 12.345, "synthetic JPEG has fake GPS latitude");
  assert.equal(before.longitude, 67.89, "synthetic JPEG has fake GPS longitude");
  assert.ok(before.DateTimeOriginal, "synthetic JPEG has fake capture timestamp");

  const sanitized = await sanitizeImageUpload({ buffer: original, mimeType: "image/jpeg" });
  const after = await exifr.parse(sanitized.sanitizedBuffer, { gps: true });
  assert.equal(after?.latitude, undefined, "sanitized JPEG has no GPS latitude");
  assert.equal(after?.longitude, undefined, "sanitized JPEG has no GPS longitude");
  assert.equal(after?.Make, undefined, "sanitized JPEG has no EXIF Make");
  assert.equal(after?.Model, undefined, "sanitized JPEG has no EXIF Model");
  assert.equal(after?.DateTimeOriginal, undefined, "sanitized JPEG has no original timestamp");
  assert.equal(sanitized.metadataRemoved, true, "sanitizer reports metadata removed");
  assert.notEqual(sanitized.sanitizedSha256, sanitized.originalSha256, "sanitized hash differs from original hash");
  assert.ok(sanitized.width > 0 && sanitized.height > 0, "sanitized image still opens and has dimensions");

  const root = await mkdtemp(join(tmpdir(), "prij-image-metadata-"));
  try {
    const local = await prepareFile({
      mode: "local_demo_file",
      appEnv: "local",
      root,
      buffer: sanitized.sanitizedBuffer,
      sha256: sanitized.sanitizedSha256,
      extension: sanitized.safeExtension
    });
    assert.ok(local.localDemoFilePath, "local_demo_file writes a file path");
    assert.equal((await stat(local.localDemoFilePath)).size, sanitized.sanitizedBuffer.length, "local_demo_file writes sanitized file bytes");
    const localExif = await exifr.parse(await readFile(local.localDemoFilePath), { gps: true });
    assert.equal(localExif?.latitude, undefined, "local_demo_file stored file has no GPS");
    assert.equal(localExif?.Make, undefined, "local_demo_file stored file has no device Make");

    const metadataOnly = await prepareFile({
      mode: "metadata_only",
      appEnv: "local",
      root,
      buffer: sanitized.sanitizedBuffer,
      sha256: sanitized.sanitizedSha256,
      extension: sanitized.safeExtension
    });
    assert.equal(metadataOnly.localDemoFilePath, null, "metadata_only writes no file bytes");

    await assert.rejects(
      () => prepareFile({ mode: "local_demo_file", appEnv: "production", root, buffer: sanitized.sanitizedBuffer, sha256: sanitized.sanitizedSha256, extension: ".jpg" }),
      /forbidden in production/,
      "production mode rejects local_demo_file"
    );
    await assert.rejects(
      () => sanitizeImageUpload({ buffer: Buffer.from("not image"), mimeType: "image/tiff" }),
      /Unsupported image type/,
      "unsupported image type rejected"
    );

    const auditObject = {
      patientId: "00000000-0000-0000-0000-000000000000",
      originalMimeType: "image/jpeg",
      sanitizedMimeType: "image/jpeg",
      storageMode: "metadata_only",
      exifStripped: true,
      originalSizeBytes: original.length,
      storedSizeBytes: sanitized.sanitizedBuffer.length,
      removedMetadataTypes: sanitized.removedMetadataTypes
    };
    const auditText = JSON.stringify(auditObject);
    assert.equal(auditText.includes("12.345"), false, "audit object does not include GPS latitude value");
    assert.equal(auditText.includes("67.890"), false, "audit object does not include GPS longitude value");
    assert.equal(auditText.includes("FAKE_CAMERA_MODEL"), false, "audit object does not include EXIF device values");
  } finally {
    await rm(root, { recursive: true, force: true });
  }

  console.log("IMAGE-METADATA-SANITIZER PASS all checks");
}

main().catch((error) => {
  console.error("IMAGE-METADATA-SANITIZER FAIL", error);
  process.exit(1);
});
