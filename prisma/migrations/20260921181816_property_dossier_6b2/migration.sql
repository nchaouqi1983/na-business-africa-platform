-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "agencyFeePercent" DECIMAL(5,2),
ADD COLUMN     "balconyArea" DOUBLE PRECISION,
ADD COLUMN     "basementArea" DOUBLE PRECISION,
ADD COLUMN     "estimatedYieldPercent" DECIMAL(5,2),
ADD COLUMN     "isCoupDeCoeur" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kitchens" INTEGER,
ADD COLUMN     "monthlyCharges" DECIMAL(14,2),
ADD COLUMN     "negotiable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "proximityNotes" TEXT,
ADD COLUMN     "securityDeposit" DECIMAL(14,2),
ADD COLUMN     "shortDescription" TEXT,
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "PropertyPrivate" ADD COLUMN     "source" TEXT;

-- CreateTable
CREATE TABLE "PropertyReferenceCounter" (
    "year" INTEGER NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PropertyReferenceCounter_pkey" PRIMARY KEY ("year")
);

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
