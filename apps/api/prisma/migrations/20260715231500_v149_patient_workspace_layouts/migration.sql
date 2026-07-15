CREATE TYPE "PatientWorkspaceLayoutScope" AS ENUM ('CLINIC', 'ROLE', 'SPECIALTY', 'PERSONAL', 'PATIENT');
CREATE TYPE "PatientWorkspacePanelSize" AS ENUM ('SMALL', 'MEDIUM', 'WIDE', 'FULL');

CREATE TABLE "PatientWorkspaceLayout" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "scope" "PatientWorkspaceLayoutScope" NOT NULL,
  "scopeKey" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "userId" UUID,
  "patientId" UUID,
  "roleKey" TEXT,
  "specialtyKey" TEXT,
  "presetKey" TEXT,
  "templateVersion" INTEGER NOT NULL DEFAULT 1,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "createdByUserId" UUID NOT NULL,
  "updatedByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "PatientWorkspaceLayout_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PatientWorkspacePanelLayout" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "layoutId" UUID NOT NULL,
  "panelKey" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "column" INTEGER NOT NULL DEFAULT 1,
  "size" "PatientWorkspacePanelSize" NOT NULL DEFAULT 'MEDIUM',
  "collapsed" BOOLEAN NOT NULL DEFAULT false,
  "pinned" BOOLEAN NOT NULL DEFAULT false,
  "hidden" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "PatientWorkspacePanelLayout_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PatientWorkspacePanelLayout_layoutId_fkey" FOREIGN KEY ("layoutId") REFERENCES "PatientWorkspaceLayout"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PatientWorkspaceLayout_scopeKey_key" ON "PatientWorkspaceLayout"("scopeKey");
CREATE INDEX "PatientWorkspaceLayout_scope_published_idx" ON "PatientWorkspaceLayout"("scope", "published");
CREATE INDEX "PatientWorkspaceLayout_userId_scope_idx" ON "PatientWorkspaceLayout"("userId", "scope");
CREATE INDEX "PatientWorkspaceLayout_patientId_scope_idx" ON "PatientWorkspaceLayout"("patientId", "scope");
CREATE INDEX "PatientWorkspaceLayout_roleKey_scope_idx" ON "PatientWorkspaceLayout"("roleKey", "scope");
CREATE INDEX "PatientWorkspaceLayout_specialtyKey_scope_idx" ON "PatientWorkspaceLayout"("specialtyKey", "scope");
CREATE UNIQUE INDEX "PatientWorkspacePanelLayout_layoutId_panelKey_key" ON "PatientWorkspacePanelLayout"("layoutId", "panelKey");
CREATE INDEX "PatientWorkspacePanelLayout_layoutId_order_idx" ON "PatientWorkspacePanelLayout"("layoutId", "order");
