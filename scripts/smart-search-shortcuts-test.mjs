import { readFile } from "node:fs/promises";

const source = await readFile("apps/web/lib/search-shortcuts.ts", "utf8");
const required = [
  ["cb", "CBC"],
  ["cbc", "complete blood count"],
  ["bhcg", "beta-hCG"],
  ["beta", "beta hcg"],
  ["tvus", "transvaginal ultrasound"],
  ["aub", "abnormal uterine bleeding"],
  ["uti", "urinary tract infection"],
  ["pregnancy follow up", "antenatal follow-up"],
  ["reduced fetal movement", "reduced fetal movement"]
];

let fail = 0;
for (const [shortcut, alias] of required) {
  if (!source.includes(shortcut) || !source.includes(alias)) {
    console.error(`SMART-SEARCH FAIL missing ${shortcut} -> ${alias}`);
    fail += 1;
  } else {
    console.log(`SMART-SEARCH PASS ${shortcut} maps to ${alias}`);
  }
}

if (fail) process.exit(1);
console.log(`SMART-SEARCH SUMMARY PASS ${required.length} FAIL 0`);
