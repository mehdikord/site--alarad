-- Migration: create_coupons_table

-- CreateTable
CREATE TABLE `coupons` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `type` ENUM('percent', 'fixed') NOT NULL DEFAULT 'percent',
    `value` INTEGER UNSIGNED NOT NULL,
    `max_discount` INTEGER UNSIGNED NULL,
    `min_order_amount` INTEGER UNSIGNED NULL,
    `usage_limit` INTEGER UNSIGNED NULL,
    `per_user_limit` INTEGER UNSIGNED NULL,
    `used_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `starts_at` TIMESTAMP(0) NULL,
    `expires_at` TIMESTAMP(0) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `coupons_code_unique`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
