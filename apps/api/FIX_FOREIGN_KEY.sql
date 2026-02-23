-- Fix foreign key constraint in whatsapp_official_logs
-- Migration: 20_fix_official_logs_foreign_key.ts

-- Step 1: Drop old foreign key constraint
ALTER TABLE `whatsapp_official_logs`
DROP FOREIGN KEY `whatsapp_official_logs_official_template_id_foreign`;

-- Step 2: Add new foreign key pointing to message_templates
ALTER TABLE `whatsapp_official_logs`
ADD CONSTRAINT `whatsapp_official_logs_official_template_id_foreign`
FOREIGN KEY (`official_template_id`)
REFERENCES `message_templates` (`id`)
ON DELETE SET NULL;

-- Verify the change
SHOW CREATE TABLE whatsapp_official_logs\G
