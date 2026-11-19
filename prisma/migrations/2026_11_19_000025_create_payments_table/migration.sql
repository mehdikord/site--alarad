-- Migration: create_payments_table

-- CreateTable
CREATE TABLE `payments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `gateway` VARCHAR(32) NOT NULL,
    `amount` INTEGER UNSIGNED NOT NULL,
    `status` ENUM('pending', 'paid', 'failed', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
    `authority` VARCHAR(191) NULL,
    `ref_id` VARCHAR(191) NULL,
    `card_pan` VARCHAR(32) NULL,
    `card_hash` VARCHAR(255) NULL,
    `description` VARCHAR(500) NULL,
    `failure_reason` VARCHAR(500) NULL,
    `meta` JSON NULL,
    `ip` VARCHAR(45) NULL,
    `paid_at` TIMESTAMP(0) NULL,
    `verified_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `payments_order_id_index`(`order_id`),
    INDEX `payments_user_id_index`(`user_id`),
    INDEX `payments_authority_index`(`authority`),
    INDEX `payments_status_index`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
