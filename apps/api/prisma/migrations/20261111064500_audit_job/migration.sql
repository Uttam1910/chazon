-- CreateTable
CREATE TABLE "AuditJob" (
    "id" TEXT NOT NULL,
    "status" JSONB NOT NULL,
    "report" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditJob_expiresAt_idx" ON "AuditJob"("expiresAt");
