-- CreateEnum
CREATE TYPE "OpportunityStage" AS ENUM ('NOUVELLE', 'QUALIFICATION', 'MATCHING', 'VISITE', 'OFFRE', 'NEGOCIATION', 'RESERVATION', 'COMPROMIS', 'FINANCEMENT', 'ACTE', 'GAGNEE', 'PERDUE');

-- CreateEnum
CREATE TYPE "OpportunityLossReason" AS ENUM ('PRIX', 'FINANCEMENT', 'BIEN_INDISPONIBLE', 'CONCURRENT', 'SANS_REPONSE', 'AUTRE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'OPPORTUNITE_ASSIGNEE';
ALTER TYPE "NotificationType" ADD VALUE 'OPPORTUNITE_STADE';
ALTER TYPE "NotificationType" ADD VALUE 'OPPORTUNITE_CLOTURE_PROCHE';
ALTER TYPE "NotificationType" ADD VALUE 'OPPORTUNITE_SANS_ACTIVITE';

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "opportunityId" TEXT;

-- AlterTable
ALTER TABLE "CommissionCase" ADD COLUMN     "opportunityId" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "opportunityId" TEXT;

-- AlterTable
ALTER TABLE "Visit" ADD COLUMN     "opportunityId" TEXT;

-- CreateTable
CREATE TABLE "OpportunityReferenceCounter" (
    "year" INTEGER NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OpportunityReferenceCounter_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "propertyId" TEXT,
    "transaction" "PropertyTransaction" NOT NULL,
    "title" TEXT NOT NULL,
    "stage" "OpportunityStage" NOT NULL DEFAULT 'NOUVELLE',
    "estimatedAmount" DECIMAL(14,2),
    "finalAmount" DECIMAL(14,2),
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "probability" INTEGER NOT NULL DEFAULT 5,
    "probabilityIsManual" BOOLEAN NOT NULL DEFAULT false,
    "expectedCloseDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "lossReason" "OpportunityLossReason",
    "lossNote" TEXT,
    "internalNote" TEXT,
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stageChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityStageHistory" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "fromStage" "OpportunityStage",
    "toStage" "OpportunityStage" NOT NULL,
    "changedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityStageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Opportunity_reference_key" ON "Opportunity"("reference");

-- CreateIndex
CREATE INDEX "Opportunity_prospectId_idx" ON "Opportunity"("prospectId");

-- CreateIndex
CREATE INDEX "Opportunity_propertyId_idx" ON "Opportunity"("propertyId");

-- CreateIndex
CREATE INDEX "Opportunity_stage_idx" ON "Opportunity"("stage");

-- CreateIndex
CREATE INDEX "Opportunity_assignedToId_idx" ON "Opportunity"("assignedToId");

-- CreateIndex
CREATE INDEX "Opportunity_createdById_idx" ON "Opportunity"("createdById");

-- CreateIndex
CREATE INDEX "Opportunity_expectedCloseDate_idx" ON "Opportunity"("expectedCloseDate");

-- CreateIndex
CREATE INDEX "Opportunity_lastActivityAt_idx" ON "Opportunity"("lastActivityAt");

-- CreateIndex
CREATE INDEX "OpportunityStageHistory_opportunityId_createdAt_idx" ON "OpportunityStageHistory"("opportunityId", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_opportunityId_idx" ON "Activity"("opportunityId");

-- CreateIndex
CREATE INDEX "CommissionCase_opportunityId_idx" ON "CommissionCase"("opportunityId");

-- CreateIndex
CREATE INDEX "Notification_opportunityId_idx" ON "Notification"("opportunityId");

-- CreateIndex
CREATE INDEX "Visit_opportunityId_idx" ON "Visit"("opportunityId");

-- AddForeignKey
ALTER TABLE "CommissionCase" ADD CONSTRAINT "CommissionCase_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityStageHistory" ADD CONSTRAINT "OpportunityStageHistory_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityStageHistory" ADD CONSTRAINT "OpportunityStageHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
