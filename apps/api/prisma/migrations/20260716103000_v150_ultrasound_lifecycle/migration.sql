-- Extend the existing shared ultrasound record lifecycle without rewriting history.
ALTER TYPE "ObUltrasoundStatus" ADD VALUE IF NOT EXISTS 'complete_for_review';
ALTER TYPE "ObUltrasoundStatus" ADD VALUE IF NOT EXISTS 'signed';
ALTER TYPE "ObUltrasoundStatus" ADD VALUE IF NOT EXISTS 'amended';
