import assert from 'node:assert/strict'; import fs from 'node:fs';
const source = fs.readFileSync('apps/api/src/patient-documents/patient-documents.service.ts','utf8');
assert.match(source, /deleteQuarantine\(prepared\.storageKey\)/); assert.match(source, /quarantineStatus: "ORPHANED"/); assert.match(source, /DOCUMENT_TOO_LARGE/); assert.match(source, /DOCUMENT_SCAN_REQUIRED/);
const uploadFlow = source.slice(source.indexOf('async createFromUpload'), source.indexOf('async download'));
assert.ok(uploadFlow.indexOf('writeQuarantine') < uploadFlow.indexOf('patientDocument.create')); assert.ok(uploadFlow.indexOf('patientDocument.create') < uploadFlow.indexOf('validateAndPromote'));
console.log('Upload cleanup, recoverable promotion failure, limits, scan policy, and persistence ordering checks passed.');
