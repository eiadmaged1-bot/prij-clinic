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
  return NextResponse.json({ sha256: createHash("sha256").update(buffer).digest("hex"), size: buffer.length });
}
