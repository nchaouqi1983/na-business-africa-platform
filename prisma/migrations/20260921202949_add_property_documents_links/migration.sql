-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('BROCHURE', 'PLAN', 'DOCUMENT_JURIDIQUE', 'MANDAT', 'AUTRE');

-- CreateEnum
CREATE TYPE "AssetVisibility" AS ENUM ('INTERNE', 'PUBLIABLE');

-- CreateEnum
CREATE TYPE "ExternalLinkType" AS ENUM ('VIDEO_YOUTUBE', 'VIDEO_VIMEO', 'VISITE_VIRTUELLE', 'INSTAGRAM', 'TIKTOK', 'AUTRE');

-- CreateTable
CREATE TABLE "PropertyDocument" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "visibility" "AssetVisibility" NOT NULL DEFAULT 'INTERNE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyExternalLink" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "type" "ExternalLinkType" NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "visibility" "AssetVisibility" NOT NULL DEFAULT 'INTERNE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyExternalLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyDocument_propertyId_sortOrder_idx" ON "PropertyDocument"("propertyId", "sortOrder");

-- CreateIndex
CREATE INDEX "PropertyExternalLink_propertyId_sortOrder_idx" ON "PropertyExternalLink"("propertyId", "sortOrder");

-- AddForeignKey
ALTER TABLE "PropertyDocument" ADD CONSTRAINT "PropertyDocument_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyDocument" ADD CONSTRAINT "PropertyDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyExternalLink" ADD CONSTRAINT "PropertyExternalLink_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
