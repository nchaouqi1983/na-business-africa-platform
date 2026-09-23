-- CreateEnum
CREATE TYPE "ImportSourceType" AS ENUM ('CAPITAL_PARC', 'AUTRE');

-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('BROUILLON', 'VALIDE', 'IMPORTE', 'ECHEC');

-- CreateEnum
CREATE TYPE "ImportRowStatus" AS ENUM ('VALIDE', 'ERREUR', 'IGNORE', 'IMPORTE');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "importSource" TEXT,
ADD COLUMN     "sourceExternalId" TEXT;

-- CreateTable
CREATE TABLE "PropertyImportBatch" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "source" "ImportSourceType" NOT NULL,
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'BROUILLON',
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "validCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "createdCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyImportRow" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "sourceData" JSONB NOT NULL,
    "status" "ImportRowStatus" NOT NULL DEFAULT 'ERREUR',
    "errors" JSONB,
    "isUpdate" BOOLEAN NOT NULL DEFAULT false,
    "propertyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyImportRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PropertyImportBatch_reference_key" ON "PropertyImportBatch"("reference");

-- CreateIndex
CREATE INDEX "PropertyImportBatch_status_idx" ON "PropertyImportBatch"("status");

-- CreateIndex
CREATE INDEX "PropertyImportBatch_createdById_idx" ON "PropertyImportBatch"("createdById");

-- CreateIndex
CREATE INDEX "PropertyImportRow_batchId_status_idx" ON "PropertyImportRow"("batchId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyImportRow_batchId_lineNumber_key" ON "PropertyImportRow"("batchId", "lineNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Property_importSource_sourceExternalId_key" ON "Property"("importSource", "sourceExternalId");

-- AddForeignKey
ALTER TABLE "PropertyImportBatch" ADD CONSTRAINT "PropertyImportBatch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyImportRow" ADD CONSTRAINT "PropertyImportRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "PropertyImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyImportRow" ADD CONSTRAINT "PropertyImportRow_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

