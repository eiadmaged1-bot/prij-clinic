CREATE TYPE "DoctorWorkspaceMode" AS ENUM ('CLASSIC', 'COCKPIT');

ALTER TABLE "UserPreference"
ADD COLUMN "doctorWorkspaceMode" "DoctorWorkspaceMode" NOT NULL DEFAULT 'CLASSIC';
