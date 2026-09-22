-- CreateEnum
CREATE TYPE "MandateType" AS ENUM ('VENTE', 'LOCATION', 'EXCLUSIF', 'SIMPLE', 'OFF_MARKET');

-- CreateEnum
CREATE TYPE "MandateStatus" AS ENUM ('BROUILLON', 'ACTIF', 'EXPIRE', 'RESILIE', 'FINALISE');

-- CreateEnum
CREATE TYPE "CommissionTransactionType" AS ENUM ('VENTE', 'LOCATION');

-- CreateEnum
CREATE TYPE "CommissionCaseStatus" AS ENUM ('PREVISION', 'A_CONFIRMER', 'DUE', 'PARTIELLEMENT_PAYEE', 'PAYEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "CommissionBasis" AS ENUM ('PRIX_FINAL', 'LOYER_ANNUEL', 'MONTANT_FIXE');

-- CreateEnum
CREATE TYPE "CommissionBilledTo" AS ENUM ('VENDEUR', 'ACQUEREUR', 'LOCATAIRE');

-- CreateEnum
CREATE TYPE "CommissionBeneficiaryType" AS ENUM ('AGENCE', 'INTERMEDIAIRE', 'AGENT_INTERNE', 'AUTRE');

-- CreateEnum
CREATE TYPE "CommissionShareMode" AS ENUM ('POURCENTAGE', 'MONTANT_FIXE');

-- CreateEnum
CREATE TYPE "CommissionShareStatus" AS ENUM ('PREVU', 'VALIDE', 'PAYE');

-- CreateEnum
CREATE TYPE "CommissionPaymentStatus" AS ENUM ('PREVU', 'RECU', 'PARTIEL', 'ANNULE');

-- CreateTable
CREATE TABLE "MandateReferenceCounter" (
    "year" INTEGER NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MandateReferenceCounter_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "Mandate" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "ownerId" TEXT,
    "type" "MandateType" NOT NULL,
    "status" "MandateStatus" NOT NULL DEFAULT 'BROUILLON',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isExclusive" BOOLEAN NOT NULL DEFAULT false,
    "displayedPrice" DECIMAL(14,2),
    "agreedNetSellerPrice" DECIMAL(14,2),
    "internalConditions" TEXT,
    "documentId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mandate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionReferenceCounter" (
    "year" INTEGER NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CommissionReferenceCounter_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "CommissionCase" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "mandateId" TEXT,
    "transaction" "CommissionTransactionType" NOT NULL,
    "status" "CommissionCaseStatus" NOT NULL DEFAULT 'PREVISION',
    "basis" "CommissionBasis" NOT NULL,
    "baseAmount" DECIMAL(14,2) NOT NULL,
    "agencyCommissionRate" DECIMAL(5,2),
    "agencyCommissionAmount" DECIMAL(14,2) NOT NULL,
    "billedTo" "CommissionBilledTo",
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "finalTransactionAmount" DECIMAL(14,2),
    "expectedCollectionDate" TIMESTAMP(3),
    "internalNotes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionShare" (
    "id" TEXT NOT NULL,
    "commissionCaseId" TEXT NOT NULL,
    "beneficiaryType" "CommissionBeneficiaryType" NOT NULL,
    "intermediaryId" TEXT,
    "userId" TEXT,
    "freeBeneficiaryName" TEXT,
    "mode" "CommissionShareMode" NOT NULL,
    "value" DECIMAL(14,2) NOT NULL,
    "computedAmount" DECIMAL(14,2) NOT NULL,
    "status" "CommissionShareStatus" NOT NULL DEFAULT 'PREVU',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionPayment" (
    "id" TEXT NOT NULL,
    "commissionCaseId" TEXT NOT NULL,
    "commissionShareId" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "expectedDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "status" "CommissionPaymentStatus" NOT NULL DEFAULT 'PREVU',
    "internalReference" TEXT,
    "paymentMethod" TEXT,
    "internalNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Mandate_reference_key" ON "Mandate"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Mandate_documentId_key" ON "Mandate"("documentId");

-- CreateIndex
CREATE INDEX "Mandate_propertyId_idx" ON "Mandate"("propertyId");

-- CreateIndex
CREATE INDEX "Mandate_ownerId_idx" ON "Mandate"("ownerId");

-- CreateIndex
CREATE INDEX "Mandate_status_idx" ON "Mandate"("status");

-- CreateIndex
CREATE INDEX "Mandate_type_idx" ON "Mandate"("type");

-- CreateIndex
CREATE INDEX "Mandate_endDate_idx" ON "Mandate"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionCase_reference_key" ON "CommissionCase"("reference");

-- CreateIndex
CREATE INDEX "CommissionCase_propertyId_idx" ON "CommissionCase"("propertyId");

-- CreateIndex
CREATE INDEX "CommissionCase_mandateId_idx" ON "CommissionCase"("mandateId");

-- CreateIndex
CREATE INDEX "CommissionCase_status_idx" ON "CommissionCase"("status");

-- CreateIndex
CREATE INDEX "CommissionCase_transaction_idx" ON "CommissionCase"("transaction");

-- CreateIndex
CREATE INDEX "CommissionShare_commissionCaseId_idx" ON "CommissionShare"("commissionCaseId");

-- CreateIndex
CREATE INDEX "CommissionShare_intermediaryId_idx" ON "CommissionShare"("intermediaryId");

-- CreateIndex
CREATE INDEX "CommissionShare_userId_idx" ON "CommissionShare"("userId");

-- CreateIndex
CREATE INDEX "CommissionPayment_commissionCaseId_idx" ON "CommissionPayment"("commissionCaseId");

-- CreateIndex
CREATE INDEX "CommissionPayment_commissionShareId_idx" ON "CommissionPayment"("commissionShareId");

-- CreateIndex
CREATE INDEX "CommissionPayment_status_idx" ON "CommissionPayment"("status");

-- AddForeignKey
ALTER TABLE "Mandate" ADD CONSTRAINT "Mandate_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mandate" ADD CONSTRAINT "Mandate_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mandate" ADD CONSTRAINT "Mandate_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "PropertyDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mandate" ADD CONSTRAINT "Mandate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionCase" ADD CONSTRAINT "CommissionCase_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionCase" ADD CONSTRAINT "CommissionCase_mandateId_fkey" FOREIGN KEY ("mandateId") REFERENCES "Mandate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionCase" ADD CONSTRAINT "CommissionCase_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionShare" ADD CONSTRAINT "CommissionShare_commissionCaseId_fkey" FOREIGN KEY ("commissionCaseId") REFERENCES "CommissionCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionShare" ADD CONSTRAINT "CommissionShare_intermediaryId_fkey" FOREIGN KEY ("intermediaryId") REFERENCES "Intermediary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionShare" ADD CONSTRAINT "CommissionShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionPayment" ADD CONSTRAINT "CommissionPayment_commissionCaseId_fkey" FOREIGN KEY ("commissionCaseId") REFERENCES "CommissionCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionPayment" ADD CONSTRAINT "CommissionPayment_commissionShareId_fkey" FOREIGN KEY ("commissionShareId") REFERENCES "CommissionShare"("id") ON DELETE SET NULL ON UPDATE CASCADE;
