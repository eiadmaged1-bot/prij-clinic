DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SexualActivityStatus') THEN
    CREATE TYPE "SexualActivityStatus" AS ENUM (
      'not_sexually_active',
      'sexually_active',
      'prefer_not_to_say',
      'unknown'
    );
  END IF;
END $$;

ALTER TABLE "Patient"
  ADD COLUMN IF NOT EXISTS "sexualActivityStatus" "SexualActivityStatus" NOT NULL DEFAULT 'unknown';
