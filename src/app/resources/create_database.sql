# MySQL scripts for dropping existing tables and recreating the database table structure

### DROP EVERYTHING ###
# Tables/views must be dropped in reverse order due to referential constraints (foreign keys).

DROP TABLE IF EXISTS `supporter`;
DROP TABLE IF EXISTS `support_tier`;
DROP TABLE IF EXISTS `petition`;
DROP TABLE IF EXISTS `category`;
DROP TABLE IF EXISTS `user`;

### TABLES ###
# Tables must be created in a particular order due to referential constraints i.e. foreign keys.

CREATE TABLE `user`
(
    `id`             INT(11)      NOT NULL AUTO_INCREMENT,
    `email`          VARCHAR(256) NOT NULL,
    `first_name`     VARCHAR(64)  NOT NULL,
    `last_name`      VARCHAR(64)  NOT NULL,
    `image_filename` VARCHAR(64)  DEFAULT NULL,
    `password`       VARCHAR(256) NOT NULL COMMENT 'Only store the hash here, not the actual password!',
    `auth_token`     VARCHAR(256) DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_key` (`email`)
);

CREATE TABLE `category`
(
    `id`   INT(11)     NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(64) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `name` (`name`)
);

CREATE TABLE `petition`
(
    `id`             INT(11)       NOT NULL AUTO_INCREMENT,
    `title`          VARCHAR(128)  NOT NULL,
    `description`    VARCHAR(1024) NOT NULL,
    `creation_date`  DATETIME      NOT NULL,
    `image_filename` VARCHAR(64)   NULL,
    `owner_id`       INT(11)       NOT NULL,
    `category_id`    INT(11)       NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY (`title`),
    FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`),
    FOREIGN KEY (`category_id`) REFERENCES `category` (`id`)
);

CREATE TABLE `support_tier`
(
    `id`          INT(11)       NOT NULL AUTO_INCREMENT,
    `petition_id` INT(11)       NOT NULL,
    `title`       VARCHAR(128)  NOT NULL,
    `description` VARCHAR(1024) NOT NULL,
    `cost`        INT(11)       NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY (`petition_id`, `title`),
    FOREIGN KEY (`petition_id`) REFERENCES `petition` (`id`) ON DELETE CASCADE
);

CREATE TABLE `supporter`
(
    `id`              INT(11)  NOT NULL AUTO_INCREMENT,
    `petition_id`     INT(11)  NOT NULL,
    `support_tier_id` INT(11)  NOT NULL,
    `user_id`         INT(11)  NOT NULL,
    `message`         VARCHAR(512),
    `timestamp`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY (`support_tier_id`, `user_id`),
    FOREIGN KEY (`petition_id`) REFERENCES `petition` (`id`),
    FOREIGN KEY (`support_tier_id`) REFERENCES `support_tier` (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
);
