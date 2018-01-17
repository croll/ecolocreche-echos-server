--
-- https://forge.croll.fr/issues/1796
-- Rajouter des types et statuts quand on crée un nouvel audit : rajouter le type "assistant maternel" et rajouter les statuts "domicile", "crèche familiale" et "MAM"
--

ALTER TABLE `establishment` CHANGE `type` `type` ENUM('creche','halte-garderie','micro-creche','multi-accueil','relais-d-assistante','autre','assistant-maternel') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'autre';
ALTER TABLE `establishment` CHANGE `status` `status` ENUM('association','association-parentale','entreprise','publique','indetermine','autre','domicile','creche-familiale','mam') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'autre';
