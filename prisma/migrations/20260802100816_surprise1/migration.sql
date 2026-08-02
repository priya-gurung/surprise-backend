/*
  Warnings:

  - You are about to drop the column `reservedBy` on the `items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "items" DROP COLUMN "reservedBy",
ADD COLUMN     "reservedById" TEXT;

-- CreateTable
CREATE TABLE "guests" (
    "id" TEXT NOT NULL,
    "wishlistId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "guests_wishlistId_idx" ON "guests"("wishlistId");

-- CreateIndex
CREATE UNIQUE INDEX "guests_wishlistId_name_key" ON "guests"("wishlistId", "name");

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "wishlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_reservedById_fkey" FOREIGN KEY ("reservedById") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
