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
  }
];

