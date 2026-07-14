import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [shell, css, english, arabic] = await Promise.all([
  readFile(new URL("../apps/web/app/mvp-page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../apps/web/app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../apps/web/i18n/en.ts", import.meta.url), "utf8"),
  readFile(new URL("../apps/web/i18n/ar.ts", import.meta.url), "utf8")
]);

for (const contract of [
  /position: sticky/,
  /env\(safe-area-inset-top\)/,
  /env\(safe-area-inset-bottom\)/,
  /\.account-menu-panel \{/,
  /position: fixed/,
  /max-height: min\(85dvh, 44rem\)/,
  /min-height: 44px/,
  /html\[dir="rtl"\] \.account-menu-panel/
]) assert.match(css, contract);

for (const contract of [
  /aria-haspopup="dialog"/,
  /aria-modal="true"/,
  /event\.key === "Escape"/,
  /event\.key !== "Tab"/,
  /setOpen\(false\).*\[pathname\]/s,
  /document\.body\.style\.overflow = "hidden"/,
  /account-sheet-backdrop/,
  /account-sheet-close/
]) assert.match(shell, contract);

assert.match(english, /accountPreferences: "Account & preferences"/);
assert.match(arabic, /accountPreferences: "الحساب والتفضيلات"/);

console.log("v1.4.5 shared sticky header and account sheet: 18 assertions passed");
