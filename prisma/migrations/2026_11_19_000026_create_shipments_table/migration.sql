-- Migration: create_shipments_table

-- CreateTable
CREATE TABLE `shipments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `shipping_method_id` BIGINT UNSIGNED NULL,
    `admin_id` BIGINT UNSIGNED NULL,
    `carrier` VARCHAR(100) NULL,
    `tracking_code` VARCHAR(100) NULL,
    `tracking_url` VARCHAR(500) NULL,
    `status` ENUM('pending', 'preparing', 'shipped', 'delivered', 'returned') NOT NULL DEFAULT 'pending',
    `note` VARCHAR(1000) NULL,
    `shipped_at` TIMESTAMP(0) NULL,
    `delivered_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `shipments_order_id_index`(`order_id`),
    INDEX `shipments_shipping_method_id_index`(`shipping_method_id`),
    INDEX `shipments_admin_id_index`(`admin_id`),
    INDEX `shipments_tracking_code_index`(`tracking_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_shipping_method_id_foreign` FOREIGN KEY (`shipping_method_id`) REFERENCES `shipping_methods`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_admin_id_foreign` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
