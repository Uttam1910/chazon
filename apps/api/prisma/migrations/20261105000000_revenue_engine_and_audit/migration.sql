-- AlterEnum
ALTER TYPE "LeadStatus" ADD VALUE 'REVIEWED';
ALTER TYPE "LeadStatus" ADD VALUE 'ARCHIVED';

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "reference" TEXT;
UPDATE "Lead" SET "reference" = "id" WHERE "reference" IS NULL;
ALTER TABLE "Lead" ALTER COLUMN "reference" SET NOT NULL;
ALTER TABLE "Lead" ADD COLUMN "preferredContact" TEXT DEFAULT 'Email';
ALTER TABLE "Lead" ADD COLUMN "services" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Lead" ADD COLUMN "businessStage" TEXT;
ALTER TABLE "Lead" ADD COLUMN "targetAudience" TEXT;
ALTER TABLE "Lead" ADD COLUMN "businessDescription" TEXT;
ALTER TABLE "Lead" ADD COLUMN "timeline" TEXT;
ALTER TABLE "Lead" ADD COLUMN "dynamicAnswers" JSONB;
ALTER TABLE "Lead" ADD COLUMN "consentToContact" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Lead" ADD COLUMN "marketingConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Lead" ADD COLUMN "auditRef" TEXT;
ALTER TABLE "Lead" ADD COLUMN "auditData" JSONB;
ALTER TABLE "Lead" ADD COLUMN "assignedToId" TEXT;

-- CreateTable
CREATE TABLE "AuditScan" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "normalizedUrl" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "performanceScore" INTEGER NOT NULL,
    "seoScore" INTEGER NOT NULL,
    "mobileScore" INTEGER NOT NULL,
    "conversionScore" INTEGER NOT NULL,
    "metrics" JSONB NOT NULL,
    "issues" JSONB NOT NULL,
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditScan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_reference_key" ON "Lead"("reference");
CREATE INDEX "Lead_reference_idx" ON "Lead"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "AuditScan_reference_key" ON "AuditScan"("reference");
CREATE INDEX "AuditScan_reference_idx" ON "AuditScan"("reference");
CREATE INDEX "AuditScan_url_idx" ON "AuditScan"("url");
CREATE INDEX "AuditScan_createdAt_idx" ON "AuditScan"("createdAt");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

