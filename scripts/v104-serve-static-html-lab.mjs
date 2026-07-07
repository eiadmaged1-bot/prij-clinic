import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { extname, join, resolve, sep } from "node:path";

const root = process.cwd();
const exportDir = resolve(root, "ui-export");
const preferredPort = Number(process.env.PORT || 4174);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

function isInsideExport(filePath) {
  const normalizedRoot = exportDir.endsWith(sep) ? exportDir : `${exportDir}${sep}`;
  return filePath === exportDir || filePath.startsWith(normalizedRoot);
}

function lanUrls(port) {
  const urls = [];
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal) urls.push(`http://${entry.address}:${port}`);
    }
  }
  return urls;
}

function createStaticServer() {
  return createServer((request, response) => {
    const url = new URL(request.url || "/", "http://localhost");
    if (url.pathname === "/favicon.ico") {
      response.writeHead(204, { "cache-control": "no-store" });
      response.end();
      return;
    }
    const pathname = decodeURIComponent(url.pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const filePath = resolve(join(exportDir, relative));

    if (!isInsideExport(filePath) || !existsSync(filePath) || !statSync(filePath).isFile()) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "content-type": types[extname(filePath).toLowerCase()] || "application/octet-stream",
      "cache-control": "no-store"
    });
    createReadStream(filePath).pipe(response);
  });
}

async function listenOnAvailablePort(startPort) {
  for (let port = startPort; port < startPort + 20; port += 1) {
    const server = createStaticServer();
    const result = await new Promise((resolveListen) => {
      server.once("error", () => resolveListen(null));
      server.listen(port, "0.0.0.0", () => resolveListen({ server, port }));
    });
    if (result) return result;
  }
  throw new Error(`No available port found from ${startPort} to ${startPort + 19}`);
}

if (!existsSync(resolve(exportDir, "index.html"))) {
  console.error("ui-export/index.html was not found. Run npm run design:export-html first.");
  process.exit(1);
}

const { port } = await listenOnAvailablePort(preferredPort);
console.log("Dr Maged Attia Clinics static HTML lab server");
console.log(`Local: http://localhost:${port}`);
for (const url of lanUrls(port)) console.log(`LAN:   ${url}`);
console.log("Serving only: ui-export");
