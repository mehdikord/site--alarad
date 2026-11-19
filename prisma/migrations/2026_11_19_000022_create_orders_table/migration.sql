-- Migration: create_orders_table

-- CreateTable
CREATE TABLE `orders` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(32) NOT NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `address_id` BIGINT UNSIGNED NULL,
    `shipping_method_id` BIGINT UNSIGNED NULL,
    `coupon_id` BIGINT UNSIGNED NULL,
    `status` ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned') NOT NULL DEFAULT 'pending',
    `payment_status` ENUM('unpaid', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'unpaid',
    `payment_method` ENUM('online', 'cod') NOT NULL DEFAULT 'online',
    `receiver_name` VARCHAR(255) NOT NULL,
    `receiver_phone` VARCHAR(20) NOT NULL,
    `province_id` BIGINT UNSIGNED NOT NULL,
    `city_id` BIGINT UNSIGNED NOT NULL,
    `postal_code` VARCHAR(10) NOT NULL,
    `address` VARCHAR(500) NOT NULL,
    `unit` VARCHAR(255) NULL,
    `customer_note` VARCHAR(1000) NULL,
    `item_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `subtotal` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `discount` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `shipping_cost` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `tax` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `total` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `coupon_code` VARCHAR(50) NULL,
    `shipping_title` VARCHAR(255) NULL,
    `shipping_eta` VARCHAR(255) NULL,
    `admin_note` TEXT NULL,
    `ip` VARCHAR(45) NULL,
    `user_agent` VARCHAR(500) NULL,
    `paid_at` TIMESTAMP(0) NULL,
    `shipped_at` TIMESTAMP(0) NULL,
    `delivered_at` TIMESTAMP(0) NULL,
    `cancelled_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `orders_code_unique`(`code`),
    INDEX `orders_user_id_index`(`user_id`),
    INDEX `orders_address_id_index`(`address_id`),
    INDEX `orders_shipping_method_id_index`(`shipping_method_id`),
    INDEX `orders_coupon_id_index`(`coupon_id`),
    INDEX `orders_province_id_index`(`province_id`),
    INDEX `orders_city_id_index`(`city_id`),
    INDEX `orders_status_index`(`status`),
    INDEX `orders_payment_status_index`(`payment_status`),
    INDEX `orders_created_at_index`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_address_id_foreign` FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_shipping_method_id_foreign` FOREIGN KEY (`shipping_method_id`) REFERENCES `shipping_methods`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_coupon_id_foreign` FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_province_id_foreign` FOREIGN KEY (`province_id`) REFERENCES `provinces`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_city_id_foreign` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
