CREATE TYPE "InterfaceMode" AS ENUM ('OPTIMIZED', 'MINIMALISTIC');
CREATE TYPE "DensityMode" AS ENUM ('COMPACT', 'COMFORTABLE', 'LARGE');
CREATE TYPE "MobileNavigationMode" AS ENUM ('AUTO', 'BOTTOM_NAV', 'DRAWER');

CREATE TABLE "UserPreference" (
  "userId" UUID NOT NULL,
  "interfaceMode" "InterfaceMode" NOT NULL DEFAULT 'OPTIMIZED',
  "densityMode" "DensityMode" NOT NULL DEFAULT 'COMFORTABLE',
  "mobileNavigationMode" "MobileNavigationMode" NOT NULL DEFAULT 'AUTO',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
