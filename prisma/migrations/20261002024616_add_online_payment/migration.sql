/*
  Warnings:

  - A unique constraint covering the columns `[paymentRef]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `transaction` ADD COLUMN `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'TUNAI',
    ADD COLUMN `paymentRef` VARCHAR(191) NULL,
    ADD COLUMN `paymentType` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Transaction_paymentRef_key` ON `Transaction`(`paymentRef`);
