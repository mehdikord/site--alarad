-- Migration: create_shipping_method_province_table

-- CreateTable
CREATE TABLE `shipping_method_province` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `shipping_method_id` BIGINT UNSIGNED NOT NULL,
    `province_id` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `shipping_method_province_province_id_index`(`province_id`),
    UNIQUE INDEX `shipping_method_province_shipping_method_id_province_id_unique`(`shipping_method_id`, `province_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `shipping_method_province` ADD CONSTRAINT `shipping_method_province_shipping_method_id_foreign` FOREIGN KEY (`shipping_method_id`) REFERENCES `shipping_methods`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipping_method_province` ADD CONSTRAINT `shipping_method_province_province_id_foreign` FOREIGN KEY (`province_id`) REFERENCES `provinces`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
