export type AppActionAuditRequirement = "none" | "read_audit" | "mutation_audit" | "clinical_audit" | "financial_audit" | "security_audit";

export type AppActionDefinition = {
  id: string;
  labelAr: string;
  labelEn: string;
  permission: string | null;
  route?: string;
  handlerContract?: string;
  loadingState: string;
  successState: string;
  validationErrorState: string;
  networkErrorState: string;
  disabledReason: string;
  mobileBehavior: string;
  optimizedModeBehavior: string;
  minimalisticModeBehavior: string;
  accessibleName: string;
  auditRequirement: AppActionAuditRequirement;
  automatedTestStatus: "NOT_STARTED" | "IN_PROGRESS" | "IMPLEMENTED" | "TESTED" | "BLOCKED" | "DEFERRED_WITH_REASON";
};

export const coreAppActions: AppActionDefinition[] = [
  {
    id: "patient.search",
    labelAr: "بحث عن مريضة",
    labelEn: "Search Patient",
    permission: "patients.read",
    route: "/patients",
    loadingState: "Searching patients",
    successState: "Patient results loaded",
    validationErrorState: "Enter a valid search term",
    networkErrorState: "Patient search is unavailable",
    disabledReason: "You do not have permission to search patients",
    mobileBehavior: "Uses the same patient search route with mobile layout",
    optimizedModeBehavior: "Visible in doctor and reception workflows",
    minimalisticModeBehavior: "Visible as primary Search navigation item where permitted",
    accessibleName: "Search patient",
    auditRequirement: "read_audit",
    automatedTestStatus: "IN_PROGRESS"
  },
  {
    id: "patient.create",
    labelAr: "مريضة جديدة",
    labelEn: "New Patient",
    permission: "patient.create",
    route: "/patients/new",
    loadingState: "Saving patient",
    successState: "Patient saved",
    validationErrorState: "Correct patient details before saving",
    networkErrorState: "Patient creation is unavailable",
    disabledReason: "You do not have permission to create patients",
    mobileBehavior: "Uses quick-create form with duplicate warning",
    optimizedModeBehavior: "Visible in doctor and reception workflows where permitted",
    minimalisticModeBehavior: "Visible as New Patient where permitted",
    accessibleName: "Create new patient",
    auditRequirement: "mutation_audit",
    automatedTestStatus: "IN_PROGRESS"
  },
  {
    id: "patient.duplicateCheck", labelAr: "فحص التكرار", labelEn: "Check for Duplicates", permission: "patient.read", handlerContract: "GET /patients/duplicate-candidates", loadingState: "Checking existing patients", successState: "Duplicate review complete", validationErrorState: "Enter patient details", networkErrorState: "Duplicate check is unavailable", disabledReason: "Patient read permission is required", mobileBehavior: "Limited candidate cards stack vertically", optimizedModeBehavior: "Shown before doctor creation", minimalisticModeBehavior: "Shown only when candidates exist", accessibleName: "Check for duplicate patients", auditRequirement: "read_audit", automatedTestStatus: "TESTED"
  },
  {
    id: "patient.createOverrideDuplicate", labelAr: "إنشاء سجل جديد رغم التطابق", labelEn: "Create New Anyway", permission: "patient.create", handlerContract: "POST /patients with duplicateOverrideReason", loadingState: "Saving reviewed patient", successState: "Patient saved with audited override", validationErrorState: "Override reason is required", networkErrorState: "Patient creation is unavailable", disabledReason: "A reason is required for a high-confidence match", mobileBehavior: "Reason field and action stack vertically", optimizedModeBehavior: "Visible after high-confidence review", minimalisticModeBehavior: "Visible only when required", accessibleName: "Create new patient despite duplicate match", auditRequirement: "security_audit", automatedTestStatus: "TESTED"
  },
  {
    id: "patient.saveOnly", labelAr: "حفظ المريضة فقط", labelEn: "Save Patient Only", permission: "patient.create", handlerContract: "POST /patients", loadingState: "Saving patient", successState: "Patient saved", validationErrorState: "Correct patient details", networkErrorState: "Patient creation is unavailable", disabledReason: "Patient create permission is required", mobileBehavior: "Secondary full-width action", optimizedModeBehavior: "Secondary doctor fallback action", minimalisticModeBehavior: "Available beneath the primary action", accessibleName: "Save patient only", auditRequirement: "mutation_audit", automatedTestStatus: "TESTED"
  },
  {
    id: "patient.saveAndStartVisit", labelAr: "حفظ وبدء الزيارة", labelEn: "Save & Start Visit", permission: "patient.create", handlerContract: "POST /patients then POST /patients/:id/doctor-visit/start", loadingState: "Saving patient and starting visit", successState: "Doctor visit started", validationErrorState: "Correct patient and visit details", networkErrorState: "Patient saved state is reported before retry", disabledReason: "Patient create and encounter create permissions are required", mobileBehavior: "Primary full-width action", optimizedModeBehavior: "Primary doctor fallback action", minimalisticModeBehavior: "Primary New Patient action", accessibleName: "Save patient and start visit", auditRequirement: "clinical_audit", automatedTestStatus: "TESTED"
  },
  {
    id: "visit.startAfterPatientCreate", labelAr: "بدء الزيارة بعد التسجيل", labelEn: "Start Visit After Patient Create", permission: "encounter.create", handlerContract: "POST /patients/:id/doctor-visit/start", loadingState: "Starting doctor visit", successState: "Doctor visit started", validationErrorState: "A patient is required", networkErrorState: "Open the saved patient to retry", disabledReason: "Encounter create permission is required", mobileBehavior: "Navigates to current visit", optimizedModeBehavior: "Runs after successful create", minimalisticModeBehavior: "Runs behind primary save action", accessibleName: "Start visit after creating patient", auditRequirement: "clinical_audit", automatedTestStatus: "TESTED"
  },
  {
    id: "encounter.create",
    labelAr: "زيارة جديدة",
    labelEn: "New Encounter",
    permission: "encounter.create",
    loadingState: "Starting visit",
    successState: "Visit started",
    validationErrorState: "Validation failed",
    networkErrorState: "Service unavailable",
    disabledReason: "Requires encounter create permission",
    mobileBehavior: "Primary action",
    optimizedModeBehavior: "Primary action",
    minimalisticModeBehavior: "Primary action",
    accessibleName: "New encounter",
    auditRequirement: "clinical_audit",
    automatedTestStatus: "NOT_STARTED"
  },
  {
    id: "prescription.create",
    labelAr: "وصفة جديدة",
    labelEn: "Add Prescription",
    permission: "prescription.create",
    loadingState: "Loading prescription tool",
    successState: "Ready",
    validationErrorState: "Validation failed",
    networkErrorState: "Service unavailable",
    disabledReason: "Requires prescription create permission",
    mobileBehavior: "Secondary action",
    optimizedModeBehavior: "Secondary action",
    minimalisticModeBehavior: "Secondary action",
    accessibleName: "Add prescription",
    auditRequirement: "clinical_audit",
    automatedTestStatus: "NOT_STARTED"
  },
  {
    id: "investigation.create",
    labelAr: "طلب فحص",
    labelEn: "Request Investigation",
    permission: "clinical_requests.create",
    loadingState: "Loading requests",
    successState: "Ready",
    validationErrorState: "Validation failed",
    networkErrorState: "Service unavailable",
    disabledReason: "Requires clinical request permission",
    mobileBehavior: "Secondary action",
    optimizedModeBehavior: "Secondary action",
    minimalisticModeBehavior: "Secondary action",
    accessibleName: "Request investigation",
    auditRequirement: "clinical_audit",
    automatedTestStatus: "NOT_STARTED"
  },
  {
    id: "encounter.delete",
    labelAr: "حذف الزيارة",
    labelEn: "Delete Visit",
    permission: "encounter.delete",
    loadingState: "Deleting visit",
    successState: "Visit deleted",
    validationErrorState: "Cannot delete visit",
    networkErrorState: "Service unavailable",
    disabledReason: "Requires Owner role or encounter.delete permission",
    mobileBehavior: "Hidden context action",
    optimizedModeBehavior: "Hidden context action",
    minimalisticModeBehavior: "Hidden context action",
    accessibleName: "Delete visit",
    auditRequirement: "security_audit",
    automatedTestStatus: "NOT_STARTED"
  },
  {
    id: "patient.openExistingCandidate", labelAr: "فتح سجل المريضة الموجود", labelEn: "Open Existing Patient", permission: "patient.read", route: "/patients/:id", loadingState: "Opening patient", successState: "Patient opened", validationErrorState: "Patient selection is required", networkErrorState: "Patient file is unavailable", disabledReason: "Patient read permission is required", mobileBehavior: "Full-width candidate action", optimizedModeBehavior: "Visible on every candidate", minimalisticModeBehavior: "Visible on every candidate", accessibleName: "Open existing patient", auditRequirement: "read_audit", automatedTestStatus: "TESTED"
  }
];
