import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [shell, css, layout, reception, checkIn, picker] = await Promise.all([
  readFile("apps/web/app/mvp-page.tsx", "utf8"),
  readFile("apps/web/app/globals.css", "utf8"),
  readFile("apps/web/app/layout.tsx", "utf8"),
  readFile("apps/web/app/reception/page.tsx", "utf8"),
  readFile("apps/web/app/reception/check-in/page.tsx", "utf8"),
  readFile("apps/web/components/clinic/PatientPicker.tsx", "utf8")
]);

assert.doesNotMatch(layout, /suppressHydrationWarning/);
assert.match(shell, /useState\(false\).*mobileNavOpen/s);
assert.match(shell, /primaryRole\(roles\)/);
assert.match(shell, /aria-label="Close navigation"/);
assert.match(shell, /className=\{`account-sheet-backdrop \$\{open \? "open" : ""\}`\}/);
assert.doesNotMatch(shell, /if \(window\.matchMedia\("\(max-width: 767px\)"\)\.matches/);
assert.match(css, /max-width: 21\.25rem/);
assert.match(css, /html\[dir="rtl"\] \.sidebar/);
assert.match(css, /transform: translateX\(calc\(100% \+ 2rem\)\)/);
assert.match(css, /mobile-nav-backdrop\.open[\s\S]*opacity: 1/);
assert.match(css, /env\(safe-area-inset-top\)/);
assert.match(css, /account-sheet-backdrop\.open/);
for (const source of [reception, checkIn, picker]) assert.doesNotMatch(source, /suppressHydrationWarning/);
assert.doesNotMatch(reception, /useState\([^\n]*(Date\.now|Math\.random)/);
assert.doesNotMatch(checkIn, /useState\([^\n]*(Date\.now|Math\.random)/);
assert.match(picker, /sessionStorage\.getItem[\s\S]*useEffect/);

console.log("v1.4.7 shared mobile shell and hydration contract PASS (18 assertions)");
