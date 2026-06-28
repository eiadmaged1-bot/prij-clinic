import { Module } from "@nestjs/common";
import { AuditModule } from "./audit/audit.module";
import { AppointmentsModule } from "./appointments/appointments.module";
import { AuthModule } from "./auth/auth.module";
import { EncountersModule } from "./encounters/encounters.module";
import { HealthModule } from "./health/health.module";
import { InvestigationsModule } from "./investigations/investigations.module";
import { PatientsModule } from "./patients/patients.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PrescriptionsModule } from "./prescriptions/prescriptions.module";
import { QueueModule } from "./queue/queue.module";
import { RbacModule } from "./rbac/rbac.module";
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
    AppointmentsModule,
    QueueModule,
    EncountersModule,
    PrescriptionsModule,
    InvestigationsModule
  ]
})
export class AppModule {}
