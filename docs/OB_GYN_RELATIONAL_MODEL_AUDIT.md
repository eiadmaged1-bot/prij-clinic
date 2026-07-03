# OB/GYN Relational Model Audit

Source: `apps/api/prisma/schema.prisma` on v0.10.8 schema integrity hardening.

## Patient relation fields relevant to pregnancies

```prisma
  pregnancies            Pregnancy[]
  gynecologyVisits       GynecologyVisit[]
  previousPregnancies    PreviousPregnancy[]
  antenatalVisits        AntenatalVisit[]
  obUltrasounds          ObUltrasound[]
  calculations           PatientCalculation[]
  datingAssessments      PregnancyDatingAssessment[]
```

Technical note: Patient is the lifetime anchor for pregnancy episodes, prior pregnancy history, antenatal visits, OB ultrasounds, calculations, and dating assessments. Patient branch linkage exists through `Patient.branchId`; most OB/GYN child records also store their own `branchId`, but several are optional and set-null on branch deletion.

## Pregnancy

```prisma
model Pregnancy {
  id               String          @id @default(uuid()) @db.Uuid
  branchId         String?         @db.Uuid
  patientId        String          @db.Uuid
  status           PregnancyStatus @default(active)
  gravida          Int?
  para             Int?
  living           Int?
  abortions        Int?
  lmpDate          DateTime?       @db.Date
  estimatedDueDate DateTime?       @db.Date
  datingMethod     String?
  riskLevel        String?
  riskFlags        String?
  notes            String?
  createdByUserId  String?         @db.Uuid
  createdAt        DateTime        @default(now()) @db.Timestamptz(3)
  updatedAt        DateTime        @updatedAt @db.Timestamptz(3)

  branch              Branch?                     @relation(fields: [branchId], references: [id], onDelete: SetNull)
  patient             Patient                     @relation(fields: [patientId], references: [id], onDelete: Restrict)
  createdByUser       User?                       @relation("PregnanciesCreatedBy", fields: [createdByUserId], references: [id], onDelete: SetNull)
  fetuses             PregnancyFetus[]
  previousPregnancies PreviousPregnancy[]
  antenatalVisits     AntenatalVisit[]
  obUltrasounds       ObUltrasound[]
  calculations        PatientCalculation[]
  datingAssessments   PregnancyDatingAssessment[]

  @@index([branchId])
  @@index([patientId, createdAt])
  @@index([status])
}
```

Technical note: `Pregnancy.patientId` supports multiple pregnancies over a patient lifetime. Pregnancy lifecycle is represented by `status`; the status enum is elsewhere in the schema. Singleton/twin/multiple support is modeled through related `PregnancyFetus` rows rather than a count field. EDD can be stored directly on `estimatedDueDate`, with more detailed dating in `PregnancyDatingAssessment`. Audit fields are limited to creator and timestamps; there is no signature/review field on Pregnancy itself.

## Gravidity/parity storage fields

```prisma
  gravida          Int?
  para             Int?
  living           Int?
  abortions        Int?
```

Technical note: Gravidity/parity values are stored on each `Pregnancy` episode as optional integers. Current limitation: there is no structured parity breakdown beyond living and abortions in this model.

## PreviousPregnancy

```prisma
model PreviousPregnancy {
  id                      String    @id @default(uuid()) @db.Uuid
  patientId               String    @db.Uuid
  pregnancyId             String?   @db.Uuid
  year                    Int?
  outcomeDate             DateTime? @db.Date
  outcome                 String
  gestationalAgeAtOutcome String?
  modeOfDelivery          String?
  birthWeightGrams        Int?
  sex                     String?
  complications           String?
  notes                   String?
  createdByUserId         String?   @db.Uuid
  createdAt               DateTime  @default(now()) @db.Timestamptz(3)
  updatedAt               DateTime  @updatedAt @db.Timestamptz(3)

  patient       Patient    @relation(fields: [patientId], references: [id], onDelete: Restrict)
  pregnancy     Pregnancy? @relation(fields: [pregnancyId], references: [id], onDelete: SetNull)
  createdByUser User?      @relation("PreviousPregnanciesCreatedBy", fields: [createdByUserId], references: [id], onDelete: SetNull)

  @@index([patientId, createdAt])
  @@index([pregnancyId])
  @@index([outcome])
}
```

Technical note: This is the pregnancy outcome/history model. It links to Patient and optionally to a Pregnancy episode. It stores outcome date/year, delivery mode, birth weight, fetal sex, complications, and notes. Branch is not directly stored here; branch scope must come through patient or linked pregnancy. Audit fields are creator and timestamps only.

## PregnancyFetus

```prisma
model PregnancyFetus {
  id              String   @id @default(uuid()) @db.Uuid
  pregnancyId     String   @db.Uuid
  label           String
  chorionicity    String?
  amnionicity     String?
  status          String   @default("active")
  notes           String?
  createdByUserId String?  @db.Uuid
  createdAt       DateTime @default(now()) @db.Timestamptz(3)
  updatedAt       DateTime @updatedAt @db.Timestamptz(3)

  pregnancy     Pregnancy            @relation(fields: [pregnancyId], references: [id], onDelete: Cascade)
  createdByUser User?                @relation("PregnancyFetusesCreatedBy", fields: [createdByUserId], references: [id], onDelete: SetNull)
  obUltrasounds ObUltrasound[]
  calculations  PatientCalculation[]

  @@index([pregnancyId])
  @@index([status])
}
```

Technical note: Multiple gestation support is present through multiple fetus records per pregnancy. Chorionicity and amnionicity are stored as free text. Ultrasounds and calculations can point at a specific fetus. Audit fields are creator and timestamps only.

## AntenatalVisit

```prisma
model AntenatalVisit {
  id                    String    @id @default(uuid()) @db.Uuid
  branchId              String?   @db.Uuid
  patientId             String    @db.Uuid
  pregnancyId           String    @db.Uuid
  visitDate             DateTime  @db.Date
  gestationalAgeDisplay String?
  bloodPressure         String?
  weightKg              Decimal?  @db.Decimal(6, 2)
  pulseBpm              Int?
  edema                 String?
  urineProtein          String?
  symptomsText          String?
  examinationText       String?
  fetalHeartText        String?
  fundalHeightText      String?
  planText              String?
  medicationsNote       String?
  investigationsNote    String?
  nextFollowUpDate      DateTime? @db.Date
  createdByUserId       String?   @db.Uuid
  createdAt             DateTime  @default(now()) @db.Timestamptz(3)
  updatedAt             DateTime  @updatedAt @db.Timestamptz(3)

  branch    Branch?   @relation(fields: [branchId], references: [id], onDelete: SetNull)
  patient   Patient   @relation(fields: [patientId], references: [id], onDelete: Restrict)
  pregnancy Pregnancy @relation(fields: [pregnancyId], references: [id], onDelete: Cascade)

  @@index([branchId])
  @@index([patientId, visitDate])
  @@index([pregnancyId, visitDate])
}
```

Technical note: Antenatal visits link to Patient, Pregnancy, and optionally Branch. Pregnancy lifecycle is not changed by this model. It stores visit observations and plan text, not signed notes. Current limitation: createdByUserId is present but no User relation is declared in this model.

## ObUltrasound

```prisma
model ObUltrasound {
  id                    String             @id @default(uuid()) @db.Uuid
  branchId              String?            @db.Uuid
  patientId             String             @db.Uuid
  pregnancyId           String?            @db.Uuid
  fetusId               String?            @db.Uuid
  encounterId           String?            @db.Uuid
  status                ObUltrasoundStatus @default(draft)
  performedAt           DateTime           @default(now()) @db.Timestamptz(3)
  scanType              String?
  indication            String?
  gestationalAgeDisplay String?
  gestationalAgeWeeks   Int?
  gestationalAgeDays    Int?
  fetalHeartRateBpm     Int?
  fetalHeartText        String?
  presentation          String?
  placenta              String?
  amnioticFluid         String?
  bpdMm                 Decimal?           @db.Decimal(8, 2)
  hcMm                  Decimal?           @db.Decimal(8, 2)
  acMm                  Decimal?           @db.Decimal(8, 2)
  flMm                  Decimal?           @db.Decimal(8, 2)
  efwGrams              Int?
  dopplerNote           String?
  impressionText        String?
  createdByUserId       String?            @db.Uuid
  reviewedByUserId      String?            @db.Uuid
  reviewedAt            DateTime?          @db.Timestamptz(3)
  createdAt             DateTime           @default(now()) @db.Timestamptz(3)
  updatedAt             DateTime           @updatedAt @db.Timestamptz(3)

  branch         Branch?         @relation(fields: [branchId], references: [id], onDelete: SetNull)
  patient        Patient         @relation(fields: [patientId], references: [id], onDelete: Restrict)
  pregnancy      Pregnancy?      @relation(fields: [pregnancyId], references: [id], onDelete: SetNull)
  fetus          PregnancyFetus? @relation(fields: [fetusId], references: [id], onDelete: SetNull)
  encounter      Encounter?      @relation(fields: [encounterId], references: [id], onDelete: SetNull)
  createdByUser  User?           @relation("ObUltrasoundsCreatedBy", fields: [createdByUserId], references: [id], onDelete: SetNull)
  reviewedByUser User?           @relation("ObUltrasoundsReviewedBy", fields: [reviewedByUserId], references: [id], onDelete: SetNull)

  @@index([branchId])
  @@index([patientId, performedAt])
  @@index([pregnancyId])
  @@index([fetusId])
  @@index([encounterId])
  @@index([status])
}
```

Technical note: OB ultrasound links to Patient, optional Pregnancy, optional Fetus, optional Encounter, and optional Branch. Singleton/twin/multiple handling is supported by `fetusId` when linked to `PregnancyFetus`. Ultrasound measurements are stored directly on `ObUltrasound` as BPD/HC/AC/FL/EFW fields. Review fields are present (`reviewedByUserId`, `reviewedAt`) and status is modeled.

## Ultrasound measurement model

Not currently modeled.

Technical note: There is no separate ultrasound measurement table. Current measurement storage is embedded in `ObUltrasound`.

## PregnancyDatingAssessment

```prisma
model PregnancyDatingAssessment {
  id                           String    @id @default(cuid())
  patientId                    String    @db.Uuid
  pregnancyEpisodeId           String    @db.Uuid
  datingSource                 String
  lmpDate                      DateTime? @db.Date
  cycleLengthDays              Int?
  conceptionDate               DateTime? @db.Date
  embryoTransferDate           DateTime? @db.Date
  embryoAgeDays                Int?
  scanDate                     DateTime? @db.Date
  gaWeeks                      Int?
  gaDays                       Int?
  knownEdd                     DateTime? @db.Date
  calculatedEdd                DateTime  @db.Date
  calculatedGaAtAssessmentDays Int?
  discrepancyDays              Int?
  confidenceStatus             String
  isBestObstetricEstimate      Boolean   @default(false)
  isLocked                     Boolean   @default(false)
  lockedByUserId               String?   @db.Uuid
  lockedAt                     DateTime? @db.Timestamptz(3)
  changeReason                 String?
  calculationFormulaId         String?
  inputJson                    Json
  outputJson                   Json
  createdByUserId              String    @db.Uuid
  reviewedByUserId             String?   @db.Uuid
  reviewedAt                   DateTime? @db.Timestamptz(3)
  voidedAt                     DateTime? @db.Timestamptz(3)
  voidReason                   String?
  createdAt                    DateTime  @default(now()) @db.Timestamptz(3)
  updatedAt                    DateTime  @updatedAt @db.Timestamptz(3)

  patient            Patient            @relation(fields: [patientId], references: [id], onDelete: Restrict)
  pregnancyEpisode   Pregnancy          @relation(fields: [pregnancyEpisodeId], references: [id], onDelete: Restrict)
  calculationFormula CalculatorFormula? @relation(fields: [calculationFormulaId], references: [id], onDelete: SetNull)
  createdByUser      User               @relation("PregnancyDatingAssessmentsCreatedBy", fields: [createdByUserId], references: [id], onDelete: Restrict)
  reviewedByUser     User?              @relation("PregnancyDatingAssessmentsReviewedBy", fields: [reviewedByUserId], references: [id], onDelete: SetNull)
  lockedByUser       User?              @relation("PregnancyDatingAssessmentsLockedBy", fields: [lockedByUserId], references: [id], onDelete: SetNull)

  @@index([patientId, createdAt])
  @@index([pregnancyEpisodeId, createdAt])
  @@index([datingSource])
  @@index([confidenceStatus])
  @@index([isBestObstetricEstimate])
  @@index([isLocked])
  @@index([calculationFormulaId])
  @@index([createdByUserId])
  @@index([reviewedByUserId])
  @@index([lockedByUserId])
}
```

Technical note: This is the separate gestational dating/calculation model. It links to Patient and Pregnancy, stores source dates, known/calculated EDD, GA, discrepancy, confidence, best-estimate and lock flags, raw input/output JSON, creator, reviewer, lock, and void fields. Current limitation: branch linkage is indirect through Patient/Pregnancy; no direct `branchId` is stored on this model.
