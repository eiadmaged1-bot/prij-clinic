import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export async function GET(request: Request, props: { params: Promise<{ file: string[] }> }) {
  const params = await props.params;
  const filename = params.file.join("/");
  
  if (filename !== "pdf.mjs" && filename !== "pdf.worker.mjs") {
    return new NextResponse("Not Found", { status: 404 });
  }
  
  const sourceName = filename === "pdf.mjs" ? "pdf.min.js" : "pdf.worker.min.js";
  const filePath = path.join(process.cwd(), "node_modules", "pdfjs-dist", "build", sourceName);
  
  try {
    const content = await fs.promises.readFile(filePath);
    return new NextResponse(content, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return new NextResponse("PDF.js module not found", { status: 404 });
  }
}
