-- ---
-- Globals
-- ---

-- SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
-- SET FOREIGN_KEY_CHECKS=0;

-- ---
-- Table 'audit'
--
-- ---

DROP TABLE IF EXISTS `audit`;

CREATE TABLE `audit` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `id_etablissement` INTEGER NOT NULL,
  `key` VARCHAR(64) NOT NULL,
  `active` TINYINT(1) NOT NULL,
  `synthesis` MEDIUMTEXT NOT NULL,
  PRIMARY KEY (`id`)
);

-- ---
-- Table 'choice_hist'
--
-- ---

DROP TABLE IF EXISTS `choice_hist`;

CREATE TABLE `choice_hist` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `id_choice` INTEGER NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `comment` VARCHAR(255) NOT NULL,
  `position` INTEGER NOT NULL DEFAULT 0,
  `impact` INTEGER NULL DEFAULT NULL,
  `state` ENUM('latest','modified','deleted') NOT NULL,
  PRIMARY KEY (`id`)
);

-- ---
-- Table 'etablissement'
--
-- ---

DROP TABLE IF EXISTS `etablissement`;

CREATE TABLE `etablissement` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `address` VARCHAR(300) NOT NULL,
  `postalcode` VARCHAR(20) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `mail` VARCHAR(100) NOT NULL,
  `type` INT NOT NULL COMMENT 'creche, halte-garderie, micro-crèche, etc.',
  `status` INTEGER NOT NULL COMMENT 'association, association parental, publique, etc.',
  PRIMARY KEY (`id`)
);

-- ---
-- Table 'answer'
--
-- ---

DROP TABLE IF EXISTS `answer`;

CREATE TABLE `answer` (
  `id_audit` INTEGER NOT NULL,
  `id_node` INTEGER NOT NULL,
  `ignored` TINYINT(1) NOT NULL,
  `value` MEDIUMTEXT NOT NULL,
  PRIMARY KEY (`id_audit`, `id_node`)
);

-- ---
-- Table 'node_hist'
--
-- ---

DROP TABLE IF EXISTS `node_hist`;

CREATE TABLE `node_hist` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `id_directory` INTEGER NOT NULL,
  `type` ENUM('directory','q_radio','q_checkbox','q_percents','q_text','q_numeric') NOT NULL DEFAULT 'directory',
  `title` VARCHAR(255) NOT NULL,
  `description` VARCHAR(200) NOT NULL,
  `position` INTEGER NOT NULL DEFAULT 0,
  `color` VARCHAR(6) NULL DEFAULT NULL,
  `state` ENUM('latest','modified','deleted') NOT NULL DEFAULT 'latest',
  PRIMARY KEY (`id`)
);

-- ---
-- Table 'users'
--
-- ---

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(64) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `email` VARCHAR(64) NOT NULL,
  `account_type` ENUM('admin','agent') NOT NULL DEFAULT 'agent' COMMENT 'orig: agent=1, admin=2',
  `rememberme_token` VARCHAR(64) NOT NULL,
  `creation_timestamp` BIGINT(20) NOT NULL,
  `last_login_timestamp` BIGINT(20) NULL DEFAULT NULL,
  `failed_logins` INTEGER NOT NULL DEFAULT 0,
  `last_failed_login` INTEGER(10) NULL DEFAULT NULL,
  `password_reset_hash` CHAR(40) NULL DEFAULT NULL,
  `password_reset_timestamp` BIGINT(20) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY (`name`),
  UNIQUE KEY (`email`)
);

-- ---
-- Table 'questionnaire'
--
-- ---

DROP TABLE IF EXISTS `questionnaire`;

CREATE TABLE `questionnaire` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(100) NOT NULL,
  `description` VARCHAR(200) NOT NULL,
  `position` INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

-- ---
-- Table 'node'
--
-- ---

DROP TABLE IF EXISTS `node`;

CREATE TABLE `node` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `id_directory_parent` INTEGER NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

-- ---
-- Table 'choice'
--
-- ---

DROP TABLE IF EXISTS `choice`;

CREATE TABLE `choice` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `id_node` INTEGER NOT NULL,
  PRIMARY KEY (`id`)
);

-- ---
-- Table 'questionnaire_node'
--
-- ---

DROP TABLE IF EXISTS `questionnaire_node`;

CREATE TABLE `questionnaire_node` (
  `id_questionnaire` INTEGER NOT NULL,
  `id_node` INTEGER NULL DEFAULT NULL,
  PRIMARY KEY (`id_questionnaire`, `id_node`)
);

-- ---
-- Foreign Keys
-- ---

ALTER TABLE `audit` ADD FOREIGN KEY (id_etablissement) REFERENCES `etablissement` (`id`);
ALTER TABLE `choice_hist` ADD FOREIGN KEY (id_choice) REFERENCES `choice` (`id`);
ALTER TABLE `answer` ADD FOREIGN KEY (id_audit) REFERENCES `audit` (`id`);
ALTER TABLE `answer` ADD FOREIGN KEY (id_node) REFERENCES `node` (`id`);
ALTER TABLE `node_hist` ADD FOREIGN KEY (id_directory) REFERENCES `node` (`id`);
ALTER TABLE `node` ADD FOREIGN KEY (id_directory_parent) REFERENCES `node` (`id`);
ALTER TABLE `choice` ADD FOREIGN KEY (id_node) REFERENCES `node` (`id`);
ALTER TABLE `questionnaire_node` ADD FOREIGN KEY (id_questionnaire) REFERENCES `questionnaire` (`id`);
ALTER TABLE `questionnaire_node` ADD FOREIGN KEY (id_node) REFERENCES `node` (`id`);

-- ---
-- Table Properties
-- ---

-- ALTER TABLE `audit` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
-- ALTER TABLE `choice_hist` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
-- ALTER TABLE `etablissement` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
-- ALTER TABLE `answer` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
-- ALTER TABLE `node_hist` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
-- ALTER TABLE `users` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
-- ALTER TABLE `questionnaire` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
-- ALTER TABLE `node` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
-- ALTER TABLE `choice` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
-- ALTER TABLE `questionnaire_node` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- ---
-- Test Data
-- ---

-- INSERT INTO `audit` (`id`,`id_etablissement`,`key`,`active`,`synthesis`) VALUES
-- ('','','','','');
-- INSERT INTO `choice_hist` (`id`,`id_choice`,`title`,`comment`,`position`,`impact`,`state`) VALUES
-- ('','','','','','','');
-- INSERT INTO `etablissement` (`id`,`name`,`address`,`postalcode`,`city`,`phone`,`mail`,`type`,`status`) VALUES
-- ('','','','','','','','','');
-- INSERT INTO `answer` (`id_audit`,`id_node`,`ignored`,`value`) VALUES
-- ('','','','');
-- INSERT INTO `node_hist` (`id`,`id_directory`,`type`,`title`,`description`,`position`,`color`,`state`) VALUES
-- ('','','','','','','','');
-- INSERT INTO `users` (`id`,`name`,`password_hash`,`email`,`account_type`,`rememberme_token`,`creation_timestamp`,`last_login_timestamp`,`failed_logins`,`last_failed_login`,`password_reset_hash`,`password_reset_timestamp`) VALUES
-- ('','','','','','','','','','','','');
-- INSERT INTO `questionnaire` (`id`,`title`,`description`,`position`) VALUES
-- ('','','','');
-- INSERT INTO `node` (`id`,`id_directory_parent`) VALUES
-- ('','');
-- INSERT INTO `choice` (`id`,`id_node`) VALUES
-- ('','');
-- INSERT INTO `questionnaire_node` (`id_questionnaire`,`id_node`) VALUES
-- ('','');
