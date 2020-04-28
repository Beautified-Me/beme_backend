CREATE TABLE `auth` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `password` tinytext,
  `userName` varchar(45) DEFAULT NULL,
  `email` varchar(45) DEFAULT NULL,
  `status` varchar(45) DEFAULT NULL,
  `type` varchar(45) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deviceInfo` json DEFAULT NULL,
  `last_access_at` datetime DEFAULT NULL,
  `last_active_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `auth_id` int(11) NOT NULL,
  `gender` varchar(45) DEFAULT NULL,
  `age` varchar(45) DEFAULT NULL,
  `phoneNo` varchar(45) DEFAULT NULL,
  `address1` varchar(45) DEFAULT NULL,
  `address2` varchar(45) DEFAULT NULL,
  `profile_picture` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`,`auth_id`),
  KEY `auth_id` (`auth_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`auth_id`) REFERENCES `auth` (`id`)
);

CREATE TABLE `product_makers`(
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `name` varchar(255) DEFAULT NULL,
    PRIMARY KEY (`id`)
);

CREATE TABLE `colour_code`(
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `colour_code` varchar(45) DEFAULT NULL,
    `colour_name` varchar(45) DEFAULT NULL,
    PRIMARY KEY (`id`)
);

CREATE TABLE `product_type`(
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `name` varchar(255) DEFAULT NULL,
    `product_makers` varchar(255) DEFAULT NULL,
    PRIMARY KEY (`id`)
);

CREATE TABLE `product` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `product_type` int(11) DEFAULT NULL,
  `product_makers` int(11) DEFAULT NULL,
  `colour_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_product_type_idx` (`product_type`),
  KEY `FK_product_makers_idx` (`product_makers`),
  KEY `FK_colour_id_idx` (`colour_id`),
  CONSTRAINT `product_ibfk_1` FOREIGN KEY (`product_type`) REFERENCES `product_type` (`id`),
  CONSTRAINT `product_ibfk_4` FOREIGN KEY (`product_makers`) REFERENCES `product_makers` (`id`),
  CONSTRAINT `product_ibfk_5` FOREIGN KEY (`colour_id`) REFERENCES `colour_code` (`id`)
);