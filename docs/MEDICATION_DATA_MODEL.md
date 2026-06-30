# Medication Data Model

Added core models:
- `DrugFamily`
- `MedicationIngredient`
- `MedicationFamilyMembership`
- `MedicationProduct`
- `MedicationLabelSection`
- `MedicationInteractionRule`
- `HerbalProduct`
- `PatientAllergy`
- `PatientMedication`
- `MedicationSafetyCheck`
- `MedicationSafetyAlert`
- `MedicationDataSource`
- `MedicationDataImportJob`

Added market models:
- `DrugMarketCountry`
- `DrugMarketSource`
- `DrugMarketProduct`
- `DrugMarketVariant`
- `DrugMarketAvailability`
- `DrugMarketImportJob`
- `DrugMarketImportRowError`
- `DrugMarketManualReviewQueue`
- `DrugMarketSearchLog`
- `DrugMarketImportRun`
- `DrugMarketSourceConnector`
- `DrugMarketMergeCandidate`

Existing `PrescriptionItem` is extended with optional medication and market reference fields. Existing prescription behavior remains doctor-authored.
