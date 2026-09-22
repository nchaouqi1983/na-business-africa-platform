-- CreateEnum
CREATE TYPE "ProspectType" AS ENUM ('ACHETEUR', 'LOCATAIRE', 'VENDEUR', 'INVESTISSEUR', 'AUTRE');

-- CreateEnum
CREATE TYPE "ProspectLanguage" AS ENUM ('FR', 'AR', 'EN');

-- CreateEnum
CREATE TYPE "ProspectSource" AS ENUM ('SITE_WEB', 'WHATSAPP', 'TELEPHONE', 'RECOMMANDATION', 'RESEAUX_SOCIAUX', 'PORTAIL', 'AUTRE');

-- CreateEnum
CREATE TYPE "ProspectStatus" AS ENUM ('NOUVEAU', 'A_QUALIFIER', 'QUALIFIE', 'VISITE_PLANIFIEE', 'OFFRE', 'NEGOCIATION', 'GAGNE', 'PERDU', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "InterestLevel" AS ENUM ('A_SUIVRE', 'INTERESSE', 'FAVORI', 'REFUSE');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('PLANIFIEE', 'CONFIRMEE', 'REALISEE', 'ANNULEE', 'ABSENT');

-- CreateEnum
CREATE TYPE "VisitType" AS ENUM ('PREMIERE_VISITE', 'REVISITE', 'VISITE_PROPRIETAIRE', 'AUTRE');

-- CreateEnum
CREATE TYPE "PostVisitInterest" AS ENUM ('AUCUN', 'FAIBLE', 'MOYEN', 'FORT', 'OFFRE_ENVISAGEE');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('APPEL', 'WHATSAPP', 'EMAIL', 'NOTE', 'TACHE', 'RELANCE');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('A_FAIRE', 'TERMINEE', 'ANNULEE');

-- CreateTable
CREATE TABLE "ProspectReferenceCounter" (
    "year" INTEGER NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProspectReferenceCounter_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "VisitReferenceCounter" (
    "year" INTEGER NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VisitReferenceCounter_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "type" "ProspectType" NOT NULL,
    "kind" "PartyKind" NOT NULL DEFAULT 'PHYSIQUE',
    "firstName" TEXT,
    "lastName" TEXT,
    "companyName" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "preferredLanguage" "ProspectLanguage" NOT NULL DEFAULT 'FR',
    "source" "ProspectSource" NOT NULL DEFAULT 'AUTRE',
    "status" "ProspectStatus" NOT NULL DEFAULT 'NOUVEAU',
    "searchCities" TEXT[],
    "searchDistricts" TEXT[],
    "searchPropertyTypes" "PropertyType"[],
    "searchTransaction" "PropertyTransaction",
    "budgetMin" DECIMAL(14,2),
    "budgetMax" DECIMAL(14,2),
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "projectTimeline" TEXT,
    "internalNotes" TEXT,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProspectPropertyInterest" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "interestLevel" "InterestLevel" NOT NULL DEFAULT 'A_SUIVRE',
    "internalNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProspectPropertyInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3),
    "status" "VisitStatus" NOT NULL DEFAULT 'PLANIFIEE',
    "type" "VisitType" NOT NULL DEFAULT 'PREMIERE_VISITE',
    "participantsCount" INTEGER,
    "preVisitNote" TEXT,
    "prospectFeedback" TEXT,
    "internalNote" TEXT,
    "postVisitInterest" "PostVisitInterest",
    "nextFollowUpAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "propertyId" TEXT,
    "visitId" TEXT,
    "type" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" "ActivityStatus" NOT NULL DEFAULT 'A_FAIRE',
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Prospect_reference_key" ON "Prospect"("reference");

-- CreateIndex
CREATE INDEX "Prospect_status_idx" ON "Prospect"("status");

-- CreateIndex
CREATE INDEX "Prospect_type_idx" ON "Prospect"("type");

-- CreateIndex
CREATE INDEX "Prospect_source_idx" ON "Prospect"("source");

-- CreateIndex
CREATE INDEX "Prospect_assignedToId_idx" ON "Prospect"("assignedToId");

-- CreateIndex
CREATE INDEX "Prospect_createdById_idx" ON "Prospect"("createdById");

-- CreateIndex
CREATE INDEX "ProspectPropertyInterest_propertyId_idx" ON "ProspectPropertyInterest"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "ProspectPropertyInterest_prospectId_propertyId_key" ON "ProspectPropertyInterest"("prospectId", "propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "Visit_reference_key" ON "Visit"("reference");

-- CreateIndex
CREATE INDEX "Visit_propertyId_idx" ON "Visit"("propertyId");

-- CreateIndex
CREATE INDEX "Visit_prospectId_idx" ON "Visit"("prospectId");

-- CreateIndex
CREATE INDEX "Visit_assignedToId_idx" ON "Visit"("assignedToId");

-- CreateIndex
CREATE INDEX "Visit_status_idx" ON "Visit"("status");

-- CreateIndex
CREATE INDEX "Visit_scheduledStart_idx" ON "Visit"("scheduledStart");

-- CreateIndex
CREATE INDEX "Activity_prospectId_idx" ON "Activity"("prospectId");

-- CreateIndex
CREATE INDEX "Activity_propertyId_idx" ON "Activity"("propertyId");

-- CreateIndex
CREATE INDEX "Activity_visitId_idx" ON "Activity"("visitId");

-- CreateIndex
CREATE INDEX "Activity_assignedToId_idx" ON "Activity"("assignedToId");

-- CreateIndex
CREATE INDEX "Activity_status_idx" ON "Activity"("status");

-- CreateIndex
CREATE INDEX "Activity_dueAt_idx" ON "Activity"("dueAt");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- AddForeignKey
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProspectPropertyInterest" ADD CONSTRAINT "ProspectPropertyInterest_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProspectPropertyInterest" ADD CONSTRAINT "ProspectPropertyInterest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
