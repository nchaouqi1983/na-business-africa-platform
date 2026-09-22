-- CreateEnum
CREATE TYPE "ProspectFormOrigin" AS ENUM ('CONTACT', 'VENDRE', 'OFF_MARKET');

-- DropForeignKey
ALTER TABLE "Prospect" DROP CONSTRAINT "Prospect_createdById_fkey";

-- AlterTable
ALTER TABLE "Prospect" ADD COLUMN     "formOrigin" "ProspectFormOrigin",
ALTER COLUMN "createdById" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Prospect_formOrigin_idx" ON "Prospect"("formOrigin");

-- CreateIndex
CREATE INDEX "Prospect_phone_idx" ON "Prospect"("phone");

-- CreateIndex
CREATE INDEX "Prospect_email_idx" ON "Prospect"("email");

-- AddForeignKey
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
