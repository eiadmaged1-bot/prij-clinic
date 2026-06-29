import { Module } from "@nestjs/common";
import { AiDraftsModule } from "./ai-drafts/ai-drafts.module";
import { AuditModule } from "./audit/audit.module";
import { AppointmentsModule } from "./appointments/appointments.module";
import { AuthModule } from "./auth/auth.module";
import { BillingModule } from "./billing/billing.module";
import { ConsentsModule } from "./consents/consents.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { EncountersModule } from "./encounters/encounters.module";
import { GynecologyModule } from "./gynecology/gynecology.module";
import { HealthModule } from "./health/health.module";
import { InvestigationsModule } from "./investigations/investigations.module";
import { PatientsModule } from "./patients/patients.module";
import { PregnancyModule } from "./pregnancy/pregnancy.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PrescriptionsModule } from "./prescriptions/prescriptions.module";
import { QueueModule } from "./queue/queue.module";
import { RbacModule } from "./rbac/rbac.module";
import { ReportsModule } from "./reports/reports.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
    RbacModule,
    AuditModule,
    PatientsModule,
    ConsentsModule,
    AppointmentsModule,
    QueueModule,
    EncountersModule,
    GynecologyModule,
    PrescriptionsModule,
    InvestigationsModule,
    ReportsModule,
    PregnancyModule,
    BillingModule,
    DashboardModule,
    AiDraftsModule
  ]
})
export class AppModule {}
