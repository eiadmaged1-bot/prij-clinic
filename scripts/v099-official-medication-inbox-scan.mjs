import { findRestoreReadyCandidates, findUsableCandidates, INBOX_DIR, scanInbox } from "./v099-official-medication-inbox-utils.mjs";

const results = scanInbox();
const usable = findUsableCandidates(results);
const restoreReady = findRestoreReadyCandidates(results);

console.log("V099 OFFICIAL MEDICATION INBOX SCAN");
console.log(JSON.stringify({
  inbox: INBOX_DIR,
  supportedExtensions: [".json", ".jsonl", ".csv", ".xlsx", ".xls", ".zip"],
  fileCount: results.length,
  usableCandidateCount: usable.length,
  restoreReadyCandidateCount: restoreReady.length,
  files: results
}, null, 2));

if (!results.length) {
  console.warn("V099-INBOX-SCAN WARN no files found in storage/official-medication-inbox/");
} else if (!usable.length) {
  console.warn("V099-INBOX-SCAN WARN no usable medication candidates found");
}
