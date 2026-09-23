-- CreateEnum
CREATE TYPE "PropertyAvailability" AS ENUM ('IMMEDIATE', 'sous-1-mois', 'sous-3-mois', 'sous-6-mois', 'a-la-livraison');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "availability" "PropertyAvailability",
ADD COLUMN     "isExclusive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PropertyImportBatch" ADD COLUMN     "coordinatesValidCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ignoredColumns" JSONB,
ADD COLUMN     "imagesDownloadedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "imagesRejectedCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PropertyImportRow" ADD COLUMN     "imageErrors" JSONB,
ADD COLUMN     "imagesImportedCount" INTEGER NOT NULL DEFAULT 0;

