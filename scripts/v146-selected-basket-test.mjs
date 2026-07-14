import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [basket, history, visit, patientComponents, css] = await Promise.all([
  readFile("apps/web/components/clinical/SelectedBasket.tsx", "utf8"),
  readFile("apps/web/app/patients/[id]/panel-components.tsx", "utf8"),
  readFile("apps/web/app/patients/[id]/visit-flow-components.tsx", "utf8"),
  readFile("apps/web/app/patients/[id]/patient-components.tsx", "utf8"),
  readFile("apps/web/app/globals.css", "utf8")
]);

for (const behavior of ["addUniqueBasketItem", "duplicateScope", "remove(index", "clearAll", "undo()", "move(index", "Collapse all", "selected", "onSave(items)"]) assert.match(basket, new RegExp(behavior.replace(/[()]/g, "\\$&")), `basket behavior missing: ${behavior}`);
assert.match(basket, /openKey === item\.key/, "only one detail drawer may be open");
assert.match(basket, /signed \? <label[\s\S]*Amendment reason/, "signed amendment reason control missing");
assert.match(basket, /Save failed\. Every selected item was preserved for retry\./, "failed save must preserve basket");
assert.match(basket, /setLocalSaving\(true\)[\s\S]*finally[\s\S]*setLocalSaving\(false\)/, "save must expose stable busy state");
assert.match(history, /<SelectedBasket title="Selected history"/, "history tags, medication, operation, and previous investigation basket missing");
assert.match(history, /Promise\.all\(items\.map/, "history basket must save once from the UI");
assert.match(patientComponents, /<SelectedBasket title="History tags to save"/, "clinical tag basket missing");
assert.match(patientComponents, /The complete basket was preserved for retry/, "clinical tag failure must preserve basket");
assert.match(visit, /<SelectedBasket title="Prescription medications"/, "prescription basket missing");
assert.match(visit, /<SelectedBasket title="Investigation requests"/, "investigation basket missing");
assert.match(visit, /prescriptionBasket\.map/, "prescription must persist multiple selected rows");
assert.match(visit, /investigationBasket\.map/, "investigations must persist multiple selected rows");
assert.match(css, /\.selected-basket-sticky-actions[\s\S]*position: sticky/, "mobile sticky basket summary/save action missing");
assert.match(css, /\.selected-basket-row-summary[\s\S]*min-height: 48px/, "collapsed mobile row target missing");

console.log("v1.4.6 unified selected basket contract PASS (24 assertions)");
