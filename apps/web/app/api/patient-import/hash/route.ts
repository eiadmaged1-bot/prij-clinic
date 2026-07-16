import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "File required" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "File exceeds 5 MB" }, { status: 413 });
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension !== "csv" && extension !== "xlsx") return NextResponse.json({ error: "Only CSV and XLSX are supported" }, { status: 415 });
  const buffer = Buffer.from(await file.arrayBuffer());
  if (extension === "xlsx") {
    if (!(buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04)) return NextResponse.json({ error: "XLSX signature is invalid" }, { status: 415 });
    const archiveText = buffer.toString("latin1");
    if (/vbaProject\.bin|xl\/macrosheets/i.test(archiveText)) return NextResponse.json({ error: "Macro-enabled workbooks are not accepted" }, { status: 415 });
  } else if (buffer.includes(0)) return NextResponse.json({ error: "CSV contains binary content" }, { status: 415 });
  return NextResponse.json({ sha256: createHash("sha256").update(buffer).digest("hex"), size: buffer.length, signatureValidated: true });
}
