-- CreateIndex
CREATE INDEX "Patient_phone_idx" ON "Patient"("phone");

-- Complete forward-only indexes already declared by the release schema.
CREATE INDEX "PatientDocument_linkedReportId_idx" ON "PatientDocument"("linkedReportId");
CREATE INDEX "PatientDocument_linkedResultId_idx" ON "PatientDocument"("linkedResultId");
CREATE INDEX "PatientDocument_linkedConsentRecordId_idx" ON "PatientDocument"("linkedConsentRecordId");
CREATE INDEX "PatientDocument_linkedEncounterId_idx" ON "PatientDocument"("linkedEncounterId");
CREATE INDEX "PatientDocument_linkedPrescriptionId_idx" ON "PatientDocument"("linkedPrescriptionId");
CREATE INDEX "PatientInternalNote_createdByUserId_idx" ON "PatientInternalNote"("createdByUserId");
CREATE INDEX "PatientInternalNote_noteType_idx" ON "PatientInternalNote"("noteType");
CREATE INDEX "PatientInternalNote_pinned_idx" ON "PatientInternalNote"("pinned");
CREATE INDEX "PatientTask_createdByUserId_idx" ON "PatientTask"("createdByUserId");
CREATE INDEX "PatientTask_taskType_idx" ON "PatientTask"("taskType");
CREATE INDEX "PatientTask_priority_idx" ON "PatientTask"("priority");
CREATE INDEX "Referral_encounterId_idx" ON "Referral"("encounterId");
CREATE INDEX "Referral_pregnancyId_idx" ON "Referral"("pregnancyId");
CREATE INDEX "Referral_referredByUserId_idx" ON "Referral"("referredByUserId");
CREATE INDEX "Referral_referralType_idx" ON "Referral"("referralType");
