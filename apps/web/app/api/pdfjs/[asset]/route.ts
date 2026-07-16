import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const assets = {
  "pdf.mjs": join(process.cwd(), "..", "..", "node_modules", "pdfjs-dist", "build", "pdf.mjs"),
  "pdf.worker.mjs": join(process.cwd(), "..", "..", "node_modules", "pdfjs-dist", "build", "pdf.worker.mjs")
} as const;

export async function GET(_request: NextRequest, context: { params: Promise<{ asset: string }> }) {
  const { asset } = await context.params;
  const filePath = assets[asset as keyof typeof assets];
  if (!filePath) return NextResponse.json({ error: { code: "PDFJS_ASSET_NOT_FOUND", message: "PDF renderer asset not found." } }, { status: 404 });
  const source = await readFile(filePath);
  return new NextResponse(source, { headers: { "content-type": "text/javascript; charset=utf-8", "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff" } });
}
