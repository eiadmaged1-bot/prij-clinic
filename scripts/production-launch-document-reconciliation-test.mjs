import assert from 'node:assert/strict'; import fs from 'node:fs'; import { spawnSync } from 'node:child_process';
const source = fs.readFileSync('scripts/document-storage-reconcile.mjs','utf8'); assert.match(source, /mode: apply \? 'apply' : 'dry-run'/); assert.match(source, /movedToOrphan/); assert.match(source, /checksumMismatch/); assert.doesNotMatch(source, /console\.log\([^\n]*(storageKey|name|patientId)/);
const invalid = spawnSync(process.execPath, ['scripts/document-storage-reconcile.mjs','--delete'], { encoding:'utf8', env: { ...process.env, DATABASE_URL: '' } }); assert.equal(invalid.status, 2); assert.match(invalid.stderr, /Unknown flag/);
console.log('Reconciliation dry-run default, explicit apply, count-only output, and unknown-flag checks passed.');
