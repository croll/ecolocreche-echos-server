--
-- https://forge.croll.fr/issues/1796
-- Rajouter des types et statuts quand on crée un nouvel audit : rajouter le type "assistant maternel" et rajouter les statuts "domicile", "crèche familiale" et "MAM"
--

ALTER TABLE `establishment` CHANGE `type` `type` ENUM('creche','halte-garderie','micro-creche','multi-accueil','relais-d-assistante','autre','assistant-maternel') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'autre';
ALTER TABLE `establishment` CHANGE `status` `status` ENUM('association','association-parentale','entreprise','publique','indetermine','autre','domicile','creche-familiale','mam') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'autre';


--
-- full schema update
--

ALTER TABLE `answer` ADD `comment` MEDIUMTEXT NOT NULL AFTER `value`;
ALTER TABLE `answer` ADD `status` ENUM('saved','not-saved') NOT NULL DEFAULT 'saved' AFTER `comment`;

ALTER TABLE `audit` ADD `id_audit_src` INT NULL DEFAULT NULL AFTER `id_inquiryform`;
ALTER TABLE `audit` ADD CONSTRAINT `audit_ibfk_3` FOREIGN KEY (`id_audit_src`) REFERENCES `audit`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `audit` ADD `inquiry_type` ENUM('audit','recapaction') NOT NULL DEFAULT 'audit' AFTER `id_audit_src`;
ALTER TABLE `audit` ADD `cached_percent_ignored` DOUBLE NOT NULL DEFAULT '0' AFTER `cached_percent_complete`;
ALTER TABLE `audit` CHANGE `date_end` `date_end` DATETIME NULL DEFAULT NULL;

ALTER TABLE `inquiryform` ADD `inquiry_type` ENUM('audit','recapaction') NOT NULL DEFAULT 'audit' AFTER `id`;
ALTER TABLE `inquiryform_hist` ADD `mail_title` MEDIUMTEXT NOT NULL AFTER `comment`, ADD `mail_body` MEDIUMTEXT NOT NULL AFTER `mail_title`;

ALTER TABLE `node_hist` ADD `linked_to_node_id` INT NULL AFTER `color`;

--
-- Table structure for table `labelingfile`
--

CREATE TABLE `labelingfile` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_establishment` int(11) NOT NULL,
  `id_labelingfile_src` int(11) DEFAULT NULL,
  `id_audit_1` int(11) NOT NULL,
  `id_audit_2` int(11) DEFAULT NULL,
  `id_audit_actionrecap` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_establishment` (`id_establishment`),
  KEY `id_labelingfile_src` (`id_labelingfile_src`),
  KEY `id_audit_1` (`id_audit_1`),
  KEY `id_audit_2` (`id_audit_2`),
  KEY `id_audit_actionrecap` (`id_audit_actionrecap`),
  CONSTRAINT `labelingfile_ibfk_1` FOREIGN KEY (`id_establishment`) REFERENCES `establishment` (`id`),
  CONSTRAINT `labelingfile_ibfk_2` FOREIGN KEY (`id_labelingfile_src`) REFERENCES `labelingfile` (`id`),
  CONSTRAINT `labelingfile_ibfk_3` FOREIGN KEY (`id_audit_1`) REFERENCES `audit` (`id`),
  CONSTRAINT `labelingfile_ibfk_4` FOREIGN KEY (`id_audit_2`) REFERENCES `audit` (`id`),
  CONSTRAINT `labelingfile_ibfk_5` FOREIGN KEY (`id_audit_actionrecap`) REFERENCES `audit` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Table structure for table `labelingfile_comment`
--

CREATE TABLE `labelingfile_comment` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_labelingfile` int(11) NOT NULL,
  `id_node` int(11) DEFAULT NULL,
  `comment` text NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_labelingfile` (`id_labelingfile`),
  KEY `id_node` (`id_node`),
  CONSTRAINT `labelingfile_comment_ibfk_1` FOREIGN KEY (`id_labelingfile`) REFERENCES `labelingfile` (`id`),
  CONSTRAINT `labelingfile_comment_ibfk_2` FOREIGN KEY (`id_node`) REFERENCES `node` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


--
-- Update mail default content
--
UPDATE `inquiryform_hist` SET `mail_title` = 'ECHO(S): Audit de {establishment_name}', `mail_body` = 'Bonjour,\r\n\r\nVoici le lien vers l\'audit concernant l\'établissement {establishment_name}.\r\n\r\n{audit_url}\r\n\r\nCordialement,\r\n\r\nEcho(s)\r\n';


--
-- inquiry_type doit aussi être dans node
--
ALTER TABLE `node` ADD `inquiry_type` ENUM('audit','recapaction') NOT NULL DEFAULT 'audit' AFTER `id_node_parent`;

--
-- type q_wysiwyg
--
ALTER TABLE `node_hist` CHANGE `type` `type` ENUM('directory','q_radio','q_checkbox','q_percents','q_text','q_numeric','q_wysiwyg') NOT NULL DEFAULT 'directory';

--
-- labelingfiles
--
ALTER TABLE `labelingfile` CHANGE `id_audit_actionrecap` `id_audit_recapaction` INT(11) NULL DEFAULT NULL;
ALTER TABLE `labelingfile` DROP INDEX `id_audit_actionrecap`, ADD INDEX `id_audit_recapaction` (`id_audit_recapaction`) USING BTREE;
ALTER TABLE `labelingfile` ADD `datajson` MEDIUMTEXT NOT NULL AFTER `id_audit_recapaction`;


--
-- oubli mail_from
--
ALTER TABLE `inquiryform_hist` ADD `mail_from` VARCHAR(256) NOT NULL AFTER `comment`;

--
-- vrai boolean
--
ALTER TABLE `answer` CHANGE `ignored` `ignored` BOOLEAN NOT NULL;

--
-- Ajout de header éditable dans les rapport d'audits
--
ALTER TABLE `inquiryform_hist` ADD `audit_report_header` TEXT NOT NULL AFTER `mail_body`;


--
-- move templates to not historisable (inquiryform)
--
ALTER TABLE `inquiryform` ADD `mail_from` VARCHAR(255) NOT NULL AFTER `inquiry_type`, ADD `mail_subject` TEXT NOT NULL AFTER `mail_from`, ADD `mail_body` TEXT NOT NULL AFTER `mail_subject`, ADD `audit_report_header` TEXT NOT NULL AFTER `mail_body`;
ALTER TABLE `inquiryform_hist`
  DROP `mail_from`,
  DROP `mail_title`,
  DROP `mail_body`,
  DROP `audit_report_header`;
