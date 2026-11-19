-- Migration: create_products_table

-- CreateTable
CREATE TABLE `products` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `category_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `subtitle` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `audience` ENUM('women', 'men', 'kids', 'unisex') NOT NULL DEFAULT 'women',
    `price` INTEGER UNSIGNED NOT NULL,
    `compare_at_price` INTEGER UNSIGNED NULL,
    `material` VARCHAR(255) NULL,
    `care` VARCHAR(255) NULL,
    `origin` VARCHAR(255) NULL,
    `highlights` JSON NULL,
    `status` ENUM('draft', 'active', 'archived') NOT NULL DEFAULT 'draft',
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `rating` DECIMAL(2, 1) NOT NULL DEFAULT 0,
    `review_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `sales_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `popularity` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` VARCHAR(500) NULL,
    `published_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `products_slug_unique`(`slug`),
    INDEX `products_category_id_index`(`category_id`),
    INDEX `products_status_index`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
