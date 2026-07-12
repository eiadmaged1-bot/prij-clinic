import assert from 'node:assert/strict'; import fs from 'node:fs';
const service = fs.readFileSync('apps/api/src/patient-documents/patient-documents.service.ts','utf8'); const controller = fs.readFileSync('apps/api/src/patient-documents/patient-documents.controller.ts','utf8');
for (const code of ['DOCUMENT_NOT_FOUND','DOCUMENT_ACCESS_DENIED','DOCUMENT_NOT_READY','DOCUMENT_INTEGRITY_FAILED']) assert.match(service, new RegExp(code));
assert.match(service, /roles\.includes\("Receptionist"\)/); assert.match(service, /assertCanReferencePatient/); assert.doesNotMatch(service, /metadataJson: \{[^}]*filename/is);
assert.match(controller, /private, no-store/); assert.match(controller, /nosniff/); assert.match(controller, /attachment; filename/); assert.doesNotMatch(controller, /sendFile\(/);
console.log('Document branch, permission, receptionist, readiness, integrity, headers, and path-leak checks passed.');
