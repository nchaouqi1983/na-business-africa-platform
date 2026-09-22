-- CreateEnum
CREATE TYPE "PartyKind" AS ENUM ('PHYSIQUE', 'SOCIETE');

-- CreateEnum
CREATE TYPE "ContactPreference" AS ENUM ('TELEPHONE', 'EMAIL', 'WHATSAPP', 'COURRIER');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('ETUDE', 'COMMERCIALISATION', 'LIVRE', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('DISPONIBLE', 'OPTIONNE', 'RESERVE', 'VENDU');

-- CreateEnum
CREATE TYPE "IntermediaryType" AS ENUM ('APPORTEUR', 'AGENCE_PARTENAIRE', 'COURTIER', 'NOTAIRE', 'AUTRE');

-- CreateEnum
CREATE TYPE "PropertyOwnerRole" AS ENUM ('PROPRIETAIRE', 'INDIVISAIRE', 'USUFRUITIER', 'MANDATAIRE', 'AUTRE');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('POURCENTAGE', 'FORFAIT');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "developmentLotId" TEXT,
ADD COLUMN     "developmentProgramId" TEXT;

-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL,
    "kind" "PartyKind" NOT NULL DEFAULT 'PHYSIQUE',
    "fullNameOrCompany" TEXT NOT NULL,
    "cinOrIce" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "contactPreference" "ContactPreference",
    "internalNotes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promoter" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "mainContactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "ice" TEXT,
    "address" TEXT,
    "city" TEXT,
    "internalNotes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promoter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevelopmentProgram" (
    "id" TEXT NOT NULL,
    "promoterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "internalDescription" TEXT,
    "status" "ProgramStatus" NOT NULL DEFAULT 'ETUDE',
    "expectedDeliveryDate" TIMESTAMP(3),
    "indicativeLotCount" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevelopmentProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevelopmentLot" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "lotType" TEXT,
    "typology" TEXT,
    "surface" DOUBLE PRECISION,
    "price" DECIMAL(14,2),
    "status" "LotStatus" NOT NULL DEFAULT 'DISPONIBLE',
    "floor" TEXT,
    "block" TEXT,
    "extraInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevelopmentLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Intermediary" (
    "id" TEXT NOT NULL,
    "kind" "PartyKind" NOT NULL DEFAULT 'PHYSIQUE',
    "nameOrCompany" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "type" "IntermediaryType" NOT NULL DEFAULT 'AUTRE',
    "city" TEXT,
    "internalNotes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Intermediary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyOwner" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "role" "PropertyOwnerRole" NOT NULL DEFAULT 'PROPRIETAIRE',
    "quoteShare" DECIMAL(5,2),
    "isMainContact" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyOwner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyIntermediary" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "intermediaryId" TEXT NOT NULL,
    "role" "IntermediaryType",
    "note" TEXT,
    "commissionType" "CommissionType",
    "commissionRate" DECIMAL(5,2),
    "commissionAmount" DECIMAL(14,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyIntermediary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Owner_isActive_idx" ON "Owner"("isActive");

-- CreateIndex
CREATE INDEX "Owner_city_idx" ON "Owner"("city");

-- CreateIndex
CREATE INDEX "Promoter_isActive_idx" ON "Promoter"("isActive");

-- CreateIndex
CREATE INDEX "Promoter_city_idx" ON "Promoter"("city");

-- CreateIndex
CREATE INDEX "DevelopmentProgram_promoterId_idx" ON "DevelopmentProgram"("promoterId");

-- CreateIndex
CREATE INDEX "DevelopmentProgram_isActive_idx" ON "DevelopmentProgram"("isActive");

-- CreateIndex
CREATE INDEX "DevelopmentProgram_status_idx" ON "DevelopmentProgram"("status");

-- CreateIndex
CREATE INDEX "DevelopmentLot_status_idx" ON "DevelopmentLot"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DevelopmentLot_programId_reference_key" ON "DevelopmentLot"("programId", "reference");

-- CreateIndex
CREATE INDEX "Intermediary_isActive_idx" ON "Intermediary"("isActive");

-- CreateIndex
CREATE INDEX "Intermediary_type_idx" ON "Intermediary"("type");

-- CreateIndex
CREATE INDEX "PropertyOwner_ownerId_idx" ON "PropertyOwner"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyOwner_propertyId_ownerId_key" ON "PropertyOwner"("propertyId", "ownerId");

-- CreateIndex
CREATE INDEX "PropertyIntermediary_intermediaryId_idx" ON "PropertyIntermediary"("intermediaryId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyIntermediary_propertyId_intermediaryId_key" ON "PropertyIntermediary"("propertyId", "intermediaryId");

-- CreateIndex
CREATE INDEX "Property_developmentProgramId_idx" ON "Property"("developmentProgramId");

-- CreateIndex
CREATE INDEX "Property_developmentLotId_idx" ON "Property"("developmentLotId");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_developmentProgramId_fkey" FOREIGN KEY ("developmentProgramId") REFERENCES "DevelopmentProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_developmentLotId_fkey" FOREIGN KEY ("developmentLotId") REFERENCES "DevelopmentLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevelopmentProgram" ADD CONSTRAINT "DevelopmentProgram_promoterId_fkey" FOREIGN KEY ("promoterId") REFERENCES "Promoter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevelopmentLot" ADD CONSTRAINT "DevelopmentLot_programId_fkey" FOREIGN KEY ("programId") REFERENCES "DevelopmentProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyOwner" ADD CONSTRAINT "PropertyOwner_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyOwner" ADD CONSTRAINT "PropertyOwner_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyIntermediary" ADD CONSTRAINT "PropertyIntermediary_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyIntermediary" ADD CONSTRAINT "PropertyIntermediary_intermediaryId_fkey" FOREIGN KEY ("intermediaryId") REFERENCES "Intermediary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
