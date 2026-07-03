import { BadRequestException, Injectable } from "@nestjs/common";
import sharp, { type Metadata } from "sharp";
import { sha256 } from "./file-hash";

const IMAGE_MIME_EXTENSIONS = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"]
]);

const REJECTED_IMAGE_MIME_TYPES = new Set(["image/heic", "image/heif"]);
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;

export type SanitizedImageUpload = {
  sanitizedBuffer: Buffer;
  sanitizedMimeType: string;
  safeExtension: string;
  width: number;
  height: number;
  originalSha256: string;
  sanitizedSha256: string;
  metadataRemoved: true;
  removedMetadataTypes: string[];
  warnings: string[];
};

export type ImageUploadInput = {
  buffer: Buffer;
  originalFilename: string;
  mimeType: string;
};

@Injectable()
export class ImageSanitizerService {
  isSupportedImageMimeType(mimeType: string) {
    return IMAGE_MIME_EXTENSIONS.has(mimeType);
  }

  isRejectedImageMimeType(mimeType: string) {
    return REJECTED_IMAGE_MIME_TYPES.has(mimeType);
  }

  isImageMimeType(mimeType: string) {
    return this.isSupportedImageMimeType(mimeType) || this.isRejectedImageMimeType(mimeType) || mimeType.startsWith("image/");
  }

  async sanitizeImageUpload(input: ImageUploadInput): Promise<SanitizedImageUpload> {
    if (!input.buffer?.length) throw new BadRequestException("Image upload is empty.");
    if (input.buffer.length > MAX_IMAGE_BYTES) throw new BadRequestException("Image exceeds the maximum allowed size.");
    if (this.isRejectedImageMimeType(input.mimeType)) {
      throw new BadRequestException("HEIC/HEIF image uploads are not supported in this environment. Convert to JPEG, PNG, or WebP before upload.");
    }
    if (!this.isSupportedImageMimeType(input.mimeType)) {
      throw new BadRequestException("Unsupported image type. Upload JPEG, PNG, or WebP.");
    }

    const originalSha256 = sha256(input.buffer);
    let image = sharp(input.buffer, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: "warning" });
    let metadata: Metadata;
    try {
      metadata = await image.metadata();
    } catch {
      throw new BadRequestException("Image could not be read or is corrupted.");
    }

    const removedMetadataTypes = metadataTypes(metadata);
    const warnings: string[] = [];
    if (metadata.format === "heif") {
      throw new BadRequestException("HEIC/HEIF image uploads are not supported in this environment. Convert to JPEG, PNG, or WebP before upload.");
    }
    if (!metadata.width || !metadata.height) {
      throw new BadRequestException("Image dimensions could not be determined.");
    }
    if (metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
      throw new BadRequestException("Image exceeds the maximum allowed pixel count.");
    }

    image = sharp(input.buffer, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: "warning" }).rotate();
    let sanitizedBuffer: Buffer;
    if (input.mimeType === "image/jpeg") {
      sanitizedBuffer = await image.jpeg({ quality: 92, mozjpeg: true }).toBuffer();
    } else if (input.mimeType === "image/png") {
      sanitizedBuffer = await image.png().toBuffer();
    } else {
      sanitizedBuffer = await image.webp({ quality: 92 }).toBuffer();
    }

    const sanitizedMetadata = await sharp(sanitizedBuffer, { limitInputPixels: MAX_IMAGE_PIXELS }).metadata();
    if (sanitizedMetadata.exif || sanitizedMetadata.xmp || sanitizedMetadata.iptc) {
      warnings.push("sanitized_output_still_has_metadata_marker");
    }

    return {
      sanitizedBuffer,
      sanitizedMimeType: input.mimeType,
      safeExtension: IMAGE_MIME_EXTENSIONS.get(input.mimeType) ?? ".img",
      width: sanitizedMetadata.width ?? metadata.autoOrient?.width ?? metadata.width,
      height: sanitizedMetadata.height ?? metadata.autoOrient?.height ?? metadata.height,
      originalSha256,
      sanitizedSha256: sha256(sanitizedBuffer),
      metadataRemoved: true,
      removedMetadataTypes,
      warnings
    };
  }
}

function metadataTypes(metadata: Metadata) {
  const removed = new Set<string>();
  if (metadata.exif) {
    removed.add("exif");
    removed.add("gps");
  }
  if (metadata.icc || metadata.orientation) removed.add("icc-orientation-if-removed");
  if (metadata.xmp) removed.add("xmp-if-removed");
  if (metadata.iptc) removed.add("iptc-if-removed");
  return [...removed];
}
