ALTER TYPE "public"."runtime_status" ADD VALUE IF NOT EXISTS 'registered';
ALTER TYPE "public"."runtime_status" ADD VALUE IF NOT EXISTS 'stale';
ALTER TYPE "public"."decision_status" ADD VALUE IF NOT EXISTS 'resolved';
ALTER TABLE "runtimes" ALTER COLUMN "status" SET DEFAULT 'registered';
