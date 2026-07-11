import { Module } from "@nestjs/common";
import { AiDraftsModule } from "./ai-drafts/ai-drafts.module";
import { AiManagementModule } from "./ai-management/ai-management.module";
import { AuditModule } from "./audit/audit.module";
import { AppointmentsModule } from "./appointments/appointments.module";
import { AuthModule } from "./auth/auth.module";
import { BillingModule } from "./billing/billing.module";
import { CalculatorsModule } from "./calculators/calculators.module";
import { CareAssistModule } from "./care-assist/care-assist.module";
import { CaseLibraryModule } from "./case-library/case-library.module";
import { ConsentsModule } from "./consents/consents.module";
import { ConsentTemplatesModule } from "./consent-templates/consent-templates.module";
import { ClinicDirectoryModule } from "./clinic-directory/clinic-directory.module";
import { ClinicalTagsModule } from "./clinical-tags/clinical-tags.module";
import { ClinicalCalendarModule } from "./clinical-calendar/clinical-calendar.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { DoctorVisitModule } from "./doctor-visit/doctor-visit.module";
import { DrugMarketModule } from "./drug-market/drug-market.module";
import { EncountersModule } from "./encounters/encounters.module";
import { ExternalIntakeModule } from "./external-intake/external-intake.module";
import { GynecologyModule } from "./gynecology/gynecology.module";
import { IdempotencyModule } from "./idempotency/idempotency.module";
import { GuidelinesModule } from "./guidelines/guidelines.module";
import { HealthModule } from "./health/health.module";
import { InvestigationsModule } from "./investigations/investigations.module";
import { InvestigationResultsModule } from "./investigation-results/investigation-results.module";
import { PatientsModule } from "./patients/patients.module";
import { PatientDocumentsModule } from "./patient-documents/patient-documents.module";
import { PatientIntakeModule } from "./patient-intake/patient-intake.module";
import { PatientInternalNotesModule } from "./patient-internal-notes/patient-internal-notes.module";
import { PatientTasksModule } from "./patient-tasks/patient-tasks.module";
import { MedicationsModule } from "./medications/medications.module";
import { PregnancyModule } from "./pregnancy/pregnancy.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PrescriptionsModule } from "./prescriptions/prescriptions.module";
import { ProtocolAtlasModule } from "./protocol-atlas/protocol-atlas.module";
import { QueueModule } from "./queue/queue.module";
import { RbacModule } from "./rbac/rbac.module";
import { ReportsModule } from "./reports/reports.module";
import { ReferralsModule } from "./referrals/referrals.module";
import { ReferenceModule } from "./reference/reference.module";
import { SearchModule } from "./search/search.module";
import { StaffChatModule } from "./staff-chat/staff-chat.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    IdempotencyModule,
    GuidelinesModule,
    UsersModule,
    AuthModule,
    RbacModule,
    AuditModule,
    PatientsModule,
    PatientIntakeModule,
    ConsentsModule,
    ConsentTemplatesModule,
    AppointmentsModule,
    QueueModule,
    EncountersModule,
    ExternalIntakeModule,
    GynecologyModule,
    PrescriptionsModule,
    InvestigationsModule,
    InvestigationResultsModule,
    ReportsModule,
    PatientDocumentsModule,
    ReferralsModule,
    ReferenceModule,
    SearchModule,
    PatientTasksModule,
    PatientInternalNotesModule,
    ClinicDirectoryModule,
    ClinicalTagsModule,
    ClinicalCalendarModule,
    PregnancyModule,
    BillingModule,
    CalculatorsModule,
    CareAssistModule,
    CaseLibraryModule,
    DoctorVisitModule,
    DashboardModule,
    MedicationsModule,
    DrugMarketModule,
    AiDraftsModule,
    ProtocolAtlasModule,
    AiManagementModule,
    StaffChatModule
  ]
})
export class AppModule {}
