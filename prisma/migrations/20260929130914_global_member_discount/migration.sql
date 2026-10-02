/*
  Warnings:

  - You are about to drop the column `discountPercent` on the `member` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `member` DROP COLUMN `discountPercent`;

-- CreateTable
CREATE TABLE `Setting` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `memberDiscountPercent` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
