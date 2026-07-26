import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const templatePath = new URL("./apply-sprint1-reception-queue-core.mjs", import.meta.url);
let source = fs.readFileSync(templatePath, "utf8");

for (const [needle, replacement] of [
  ["`Reception workspace must expose ${action}`", '"Reception workspace must expose " + action'],
  ["`Reception workspace must not expose ${forbidden}`", '"Reception workspace must not expose " + forbidden'],
  ["`Reception shell missing ${needle}`", '"Reception shell missing " + needle'],
  ["`Reception workspace missing ${needle}`", '"Reception workspace missing " + needle'],
  ["`Queue reliability missing ${needle}`", '"Queue reliability missing " + needle'],
  ["`Doctor queue workflow missing ${needle}`", '"Doctor queue workflow missing " + needle'],
  ["${getApiBaseUrl()}", "\\${getApiBaseUrl()}"]
]) {
  source = source.split(needle).join(replacement);
}

const noOpStart = source.indexOf('replaceOnce(\n  operationsPath,\n  `        {error ?');
if (noOpStart >= 0) {
  const nextBlock = source.indexOf("replaceOnce(", noOpStart + 20);
  if (nextBlock < 0) throw new Error("Could not isolate the obsolete no-op template block.");
  source = source.slice(0, noOpStart) + source.slice(nextBlock);
}

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "prij-reception-queue-"));
const executablePath = path.join(tempDirectory, "apply.mjs");
fs.writeFileSync(executablePath, source, "utf8");

process.argv[2] = process.argv[2] ?? process.cwd();
await import(pathToFileURL(executablePath).href);
