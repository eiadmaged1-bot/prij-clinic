import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

export async function createSyntheticExifJpeg() {
  return sharp({
    create: {
      width: 16,
      height: 12,
      channels: 3,
      background: { r: 40, g: 120, b: 200 }
    }
  })
    .jpeg({ quality: 90 })
    .withExif({
      IFD0: {
        Make: "FAKE_DEVICE_OWNER",
        Model: "FAKE_CAMERA_MODEL",
        Software: "FAKE_CAPTURE_APP"
      },
      IFD2: {
        DateTimeOriginal: "2024:01:02 03:04:05"
      },
      IFD3: {
        GPSLatitude: "12.345",
        GPSLongitude: "67.890"
      }
    })
    .toBuffer();
}

if (import.meta.url === `file://${process.argv[1]?.replaceAll("\\", "/")}`) {
  const outputDir = resolve(process.argv[2] || "storage/test-fixtures");
  await mkdir(outputDir, { recursive: true });
  const outputPath = join(outputDir, "synthetic-fake-exif.jpg");
  await writeFile(outputPath, await createSyntheticExifJpeg());
  console.log(`Synthetic fake EXIF image written to ignored path: ${outputPath}`);
}
