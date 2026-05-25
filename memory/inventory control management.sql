-- password here is bcrypt hash of "admin123"
-- generate your own hash by running this in Python:
-- from werkzeug.security import generate_password_hash
-- print(generate_password_hash("yourpassword"))

-- 1. Register normally at /register with your details
-- 2. Then run this in MySQL Workbench or terminal:
-- UPDATE employee SET role = 'admin' WHERE email = 'bora.dayou@email.com';

-- DROP DATABASE IF EXISTS inventory_control_management; --- IGNORE ---

-- =============================================================================
-- inventory_control_management — PRODUCTION READY SCHEMA
-- =============================================================================

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS,   UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

CREATE SCHEMA IF NOT EXISTS `inventory_control_management`;
USE `inventory_control_management`;

-- -----------------------------------------------------
-- Table `employee`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `employee` (
  `id`             INT          NOT NULL AUTO_INCREMENT,
  `name`           VARCHAR(100) NOT NULL,
  `number`         VARCHAR(45)  NOT NULL,
  `email`          VARCHAR(100) NOT NULL,
  `password_hash`  VARCHAR(255) NOT NULL COMMENT 'Bcrypt hash of the password',
  `role`           ENUM('admin','staff') NOT NULL DEFAULT 'staff',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_employee_number` (`number` ASC),
  UNIQUE INDEX `uq_employee_email`  (`email`  ASC)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `employee_image`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `employee_image` (
  `id`           INT          NOT NULL AUTO_INCREMENT,
  `employee_id`  INT          NOT NULL,
  `url`          VARCHAR(255) NOT NULL COMMENT 'File path or URL of the image',
  `is_primary`   TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '1 = main profile photo',
  `uploaded_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_employee_image_employee_idx` (`employee_id` ASC),
  CONSTRAINT `fk_employee_image_employee`
    FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `customer` (Moved Up to fix Foreign Key build order)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `customer` (
  `id`            INT          NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(100) NOT NULL,
  `number`        VARCHAR(45)  NOT NULL,
  `email`         VARCHAR(100) NULL COMMENT 'Required once front-end login is added',
  `password_hash` VARCHAR(255) NULL COMMENT 'Bcrypt hash for public customer storefront accounts',
  `address`       VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_customer_number` (`number` ASC),
  UNIQUE INDEX `uq_customer_email`  (`email`  ASC)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `customer_image` (Moved Up)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `customer_image` (
  `id`           INT          NOT NULL AUTO_INCREMENT,
  `customer_id`  INT          NOT NULL,
  `url`          VARCHAR(255) NOT NULL,
  `is_primary`   TINYINT(1)   NOT NULL DEFAULT 0,
  `uploaded_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_customer_image_customer_idx` (`customer_id` ASC),
  CONSTRAINT `fk_customer_image_customer`
    FOREIGN KEY (`customer_id`) REFERENCES `customer` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `category`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `category` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(45)  NOT NULL,
  `description` VARCHAR(255) NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `product`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `product` (
  `id`          INT           NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(100)  NOT NULL,
  `description` TEXT          NULL,
  `price`       DECIMAL(10,2) NOT NULL,
  `company`     VARCHAR(100)  NOT NULL,
  `expire`      DATE          NULL,
  `category_id` INT           NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_product_category_idx` (`category_id` ASC),
  CONSTRAINT `fk_product_category`
    FOREIGN KEY (`category_id`) REFERENCES `category` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `product_image`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_image` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `product_id`  INT          NOT NULL,
  `url`         VARCHAR(255) NOT NULL,
  `is_primary`  TINYINT(1)   NOT NULL DEFAULT 0,
  `uploaded_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_product_image_product_idx` (`product_id` ASC),
  CONSTRAINT `fk_product_image_product`
    FOREIGN KEY (`product_id`) REFERENCES `product` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `supplier`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `supplier` (
  `id`      INT          NOT NULL AUTO_INCREMENT,
  `name`    VARCHAR(100) NOT NULL,
  `number`  VARCHAR(45)  NOT NULL,
  `email`   VARCHAR(100) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_supplier_number` (`number` ASC),
  UNIQUE INDEX `uq_supplier_email`  (`email`  ASC)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `warehouse`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `warehouse` (
  `id`       INT          NOT NULL AUTO_INCREMENT,
  `name`     VARCHAR(100) NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `capacity` INT          NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `inventory`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory` (
  `id`                 INT       NOT NULL AUTO_INCREMENT,
  `inventory_quantity` INT       NOT NULL DEFAULT 0,
  `last_update`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `product_id`         INT       NOT NULL,
  `warehouse_id`       INT       NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_inventory_product_warehouse` (`product_id` ASC, `warehouse_id` ASC),
  INDEX `fk_inventory_warehouse_idx` (`warehouse_id` ASC),
  CONSTRAINT `fk_inventory_product`
    FOREIGN KEY (`product_id`)   REFERENCES `product`   ( `id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_inventory_warehouse`
    FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `purchase`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `purchase` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `date`        DATE         NOT NULL,
  `note`        VARCHAR(255) NULL,
  `supplier_id` INT          NOT NULL,
  `employee_id` INT          NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_purchase_supplier_idx` (`supplier_id` ASC),
  INDEX `fk_purchase_employee_idx` (`employee_id` ASC),
  CONSTRAINT `fk_purchase_supplier`
    FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_purchase_employee`
    FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `purchase_detail`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `purchase_detail` (
  `id`          INT           NOT NULL AUTO_INCREMENT,
  `price`       DECIMAL(10,2) NOT NULL,
  `quantity`    INT           NOT NULL,
  `purchase_id` INT           NOT NULL,
  `product_id`  INT           NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_purchase_detail_purchase_idx` (`purchase_id` ASC),
  INDEX `fk_purchase_detail_product_idx`  (`product_id`  ASC),
  CONSTRAINT `fk_purchase_detail_purchase`
    FOREIGN KEY (`purchase_id`) REFERENCES `purchase` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_purchase_detail_product`
    FOREIGN KEY (`product_id`)  REFERENCES `product`  (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `orders`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id`          INT  NOT NULL AUTO_INCREMENT,
  `date`        DATE NOT NULL,
  `customer_id` INT  NOT NULL,
  `employee_id` INT  NOT NULL COMMENT 'Staff who processed the sale',
  PRIMARY KEY (`id`),
  INDEX `fk_orders_customer_idx`  (`customer_id` ASC),
  INDEX `fk_orders_employee_idx`  (`employee_id` ASC),
  CONSTRAINT `fk_orders_customer`
    FOREIGN KEY (`customer_id`) REFERENCES `customer` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_orders_employee`
    FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `order_detail`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_detail` (
  `id`         INT           NOT NULL AUTO_INCREMENT,
  `quantity`   INT           NOT NULL,
  `price`      DECIMAL(10,2) NOT NULL COMMENT 'Price at time of sale',
  `order_id`   INT           NOT NULL,
  `product_id` INT           NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_order_detail_order_idx`   (`order_id`   ASC),
  INDEX `fk_order_detail_product_idx` (`product_id` ASC),
  CONSTRAINT `fk_order_detail_order`
    FOREIGN KEY (`order_id`)   REFERENCES `orders`  (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_order_detail_product`
    FOREIGN KEY (`product_id`) REFERENCES `product` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `payment_customer`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `payment_customer` (
  `id`          INT           NOT NULL AUTO_INCREMENT,
  `date`        DATE          NOT NULL,
  `amount`      DECIMAL(10,2) NOT NULL,
  `status`      TINYINT(1)    NOT NULL DEFAULT 0 COMMENT '0=unpaid 1=paid',
  `method`      ENUM('Cash', 'Credit card', 'Transfer') NOT NULL,
  `order_id`    INT           NOT NULL,
  `employee_id` INT           NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_payment_customer_order_idx`    (`order_id`    ASC),
  INDEX `fk_payment_customer_employee_idx` (`employee_id` ASC),
  CONSTRAINT `fk_payment_customer_order`
    FOREIGN KEY (`order_id`)     REFERENCES `orders`   (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_payment_customer_employee`
    FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `payment_supplier`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `payment_supplier` (
  `id`          INT           NOT NULL AUTO_INCREMENT,
  `date`        DATE          NOT NULL,
  `amount`      DECIMAL(10,2) NOT NULL,
  `status`      TINYINT(1)    NOT NULL DEFAULT 0 COMMENT '0=unpaid 1=paid',
  `method`      ENUM('Cash', 'Credit card', 'Transfer') NOT NULL,
  `purchase_id` INT           NOT NULL,
  `employee_id` INT           NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_payment_supplier_purchase_idx` (`purchase_id` ASC),
  INDEX `fk_payment_supplier_employee_idx` (`employee_id` ASC),
  CONSTRAINT `fk_payment_supplier_purchase`
    FOREIGN KEY (`purchase_id`) REFERENCES `purchase` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_payment_supplier_employee`
    FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- unit product
CREATE TABLE IF NOT EXISTS `unit_of_measure` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE,         -- e.g., 'Each', 'Box', 'Kilogram'
    `abbreviation` VARCHAR(10) NOT NULL UNIQUE  -- e.g., 'EA', 'BX', 'KG'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `product`
ADD COLUMN `uom_id` INT NOT NULL AFTER `category_id`,
ADD CONSTRAINT `fk_product_uom`
    FOREIGN KEY (`uom_id`) REFERENCES `unit_of_measure` (`id`)
    ON DELETE RESTRICT 
    ON UPDATE CASCADE;

    INSERT INTO `unit_of_measure` (`name`, `abbreviation`) VALUES
('Each', 'EA'),
('Box', 'BX'),
('Pack', 'PK'),
('Kilogram', 'KG'),
('Liter', 'L'),
('Meter', 'M');

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
