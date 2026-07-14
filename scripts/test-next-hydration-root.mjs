import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const layout = readFileSync("apps/web/app/layout.tsx", "utf8");
const theme = readFileSync("apps/web/app/theme.tsx", "utf8");
const session = readFileSync("apps/web/app/session.tsx", "utf8");
const shell = readFileSync("apps/web/app/mvp-page.tsx", "utf8");

assert.match(layout, /<html\s+[^>]*lang="en"/, "root html must use a deterministic language");
assert.doesNotMatch(layout, /suppressHydrationWarning/, "root html must not broadly hide hydration mismatches");

for (const [name, source] of [
  ["layout.tsx", layout],
  ["mvp-page.tsx", shell]
]) {
  assert.doesNotMatch(source, /\bDate\.now\s*\(/, `${name} must not use Date.now() during server render`);
  assert.doesNotMatch(source, /\bMath\.random\s*\(/, `${name} must not use Math.random() during server render`);
}

assert.match(theme, /useEffect\(\(\) => \{[\s\S]*localStorage\.getItem/, "theme localStorage read must stay inside an effect");
assert.match(session, /useEffect\(\(\) => \{[\s\S]*sessionStorage\.getItem/, "session storage read must stay inside an effect");
assert.doesNotMatch(layout, /localStorage|sessionStorage|window\./, "root layout must not read browser globals during render");

console.log("PASS Next root hydration guard checks");
