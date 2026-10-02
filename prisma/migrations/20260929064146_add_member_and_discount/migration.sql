-- AlterTable
ALTER TABLE `transaction` ADD COLUMN `discountAmount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `discountPercent` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `memberId` INTEGER NULL,
    ADD COLUMN `subtotalAmount` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `Member` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `discountPercent` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Member_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
