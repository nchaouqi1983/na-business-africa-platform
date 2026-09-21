-- CreateEnum
CREATE TYPE "PropertyTransaction" AS ENUM ('VENTE', 'LOCATION', 'location-saisonniere', 'programme-neuf');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('VILLA', 'MAISON', 'RIAD', 'APPARTEMENT', 'DUPLEX', 'PENTHOUSE', 'TERRAIN', 'HOTEL', 'maison-hotes', 'RESTAURANT', 'COMMERCE', 'BUREAU', 'DEPOT', 'fonds-de-commerce', 'programme-neuf');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('DISPONIBLE', 'reserve', 'VENDU', 'loue', 'retire');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('BROUILLON', 'PUBLIE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'OFF_MARKET', 'PRIVE');

-- CreateEnum
CREATE TYPE "FurnishedState" AS ENUM ('MEUBLE', 'semi-meuble', 'non-meuble');

-- CreateEnum
CREATE TYPE "PropertyCondition" AS ENUM ('NEUF', 'EXCELLENT', 'bon-etat', 'a-rafraichir', 'a-renover', 'a-demolir');

-- CreateEnum
CREATE TYPE "Orientation" AS ENUM ('NORD', 'SUD', 'EST', 'OUEST', 'nord-est', 'nord-ouest', 'sud-est', 'sud-ouest');

-- CreateEnum
CREATE TYPE "TagCategory" AS ENUM ('exterieur', 'confort', 'securite', 'loisirs', 'technique', 'juridique', 'MARKETING', 'vue', 'environnement', 'proximite');

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleFr" TEXT NOT NULL,
    "descriptionFr" TEXT,
    "transaction" "PropertyTransaction" NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "propertySubtype" TEXT,
    "status" "PropertyStatus" NOT NULL DEFAULT 'DISPONIBLE',
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'BROUILLON',
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "city" TEXT NOT NULL,
    "district" TEXT,
    "addressPublic" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "price" DECIMAL(14,2),
    "priceOnRequest" BOOLEAN NOT NULL DEFAULT false,
    "pricePerSqm" DECIMAL(14,2),
    "livingArea" DOUBLE PRECISION,
    "builtArea" DOUBLE PRECISION,
    "landArea" DOUBLE PRECISION,
    "terraceArea" DOUBLE PRECISION,
    "bedrooms" INTEGER,
    "suites" INTEGER,
    "bathrooms" INTEGER,
    "salons" INTEGER,
    "parkingSpaces" INTEGER,
    "floor" INTEGER,
    "totalFloors" INTEGER,
    "yearBuilt" INTEGER,
    "furnished" "FurnishedState",
    "condition" "PropertyCondition",
    "orientation" "Orientation",
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isGoodDeal" BOOLEAN NOT NULL DEFAULT false,
    "isCreditEligible" BOOLEAN NOT NULL DEFAULT false,
    "isMourabahaEligible" BOOLEAN NOT NULL DEFAULT false,
    "details" JSONB,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyTag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "labelFr" TEXT NOT NULL,
    "category" "TagCategory" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyPrivate" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "privateAddress" TEXT,
    "ownerName" TEXT,
    "ownerPhone" TEXT,
    "ownerEmail" TEXT,
    "mandateReference" TEXT,
    "mandateStartDate" TIMESTAMP(3),
    "mandateEndDate" TIMESTAMP(3),
    "minimumNetPrice" DECIMAL(14,2),
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyPrivate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PropertyToPropertyTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PropertyToPropertyTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Property_reference_key" ON "Property"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");

-- CreateIndex
CREATE INDEX "Property_city_idx" ON "Property"("city");

-- CreateIndex
CREATE INDEX "Property_transaction_idx" ON "Property"("transaction");

-- CreateIndex
CREATE INDEX "Property_propertyType_idx" ON "Property"("propertyType");

-- CreateIndex
CREATE INDEX "Property_publicationStatus_idx" ON "Property"("publicationStatus");

-- CreateIndex
CREATE INDEX "Property_visibility_idx" ON "Property"("visibility");

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyTag_slug_key" ON "PropertyTag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyPrivate_propertyId_key" ON "PropertyPrivate"("propertyId");

-- CreateIndex
CREATE INDEX "_PropertyToPropertyTag_B_index" ON "_PropertyToPropertyTag"("B");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyPrivate" ADD CONSTRAINT "PropertyPrivate_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PropertyToPropertyTag" ADD CONSTRAINT "_PropertyToPropertyTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PropertyToPropertyTag" ADD CONSTRAINT "_PropertyToPropertyTag_B_fkey" FOREIGN KEY ("B") REFERENCES "PropertyTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
