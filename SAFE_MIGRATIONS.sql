-- SQL SEGURO - Adiciona apenas colunas que não existem
-- Execute no Railway MySQL

-- Verificar se token_expires_at já existe
SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'whatsapp_official_credentials'
  AND COLUMN_NAME = 'token_expires_at'
);

SET @query = IF(
  @col_exists = 0,
  'ALTER TABLE whatsapp_official_credentials ADD COLUMN token_expires_at DATETIME NULL AFTER access_token',
  'SELECT "token_expires_at já existe" AS info'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar campos Meta à message_templates (um por vez)
-- meta_template_id
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'message_templates' AND COLUMN_NAME = 'meta_template_id');
SET @query = IF(@col_exists = 0, 'ALTER TABLE message_templates ADD COLUMN meta_template_id VARCHAR(255) NULL AFTER sort_order', 'SELECT "meta_template_id existe" AS info');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- meta_template_name
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'message_templates' AND COLUMN_NAME = 'meta_template_name');
SET @query = IF(@col_exists = 0, 'ALTER TABLE message_templates ADD COLUMN meta_template_name VARCHAR(255) NULL AFTER meta_template_id', 'SELECT "meta_template_name existe" AS info');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- meta_status
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'message_templates' AND COLUMN_NAME = 'meta_status');
SET @query = IF(@col_exists = 0, 'ALTER TABLE message_templates ADD COLUMN meta_status ENUM(\'pending\', \'approved\', \'rejected\', \'not_synced\') DEFAULT \'not_synced\' AFTER meta_template_name', 'SELECT "meta_status existe" AS info');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- meta_language
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'message_templates' AND COLUMN_NAME = 'meta_language');
SET @query = IF(@col_exists = 0, 'ALTER TABLE message_templates ADD COLUMN meta_language VARCHAR(10) DEFAULT \'pt_BR\' AFTER meta_status', 'SELECT "meta_language existe" AS info');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- meta_category
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'message_templates' AND COLUMN_NAME = 'meta_category');
SET @query = IF(@col_exists = 0, 'ALTER TABLE message_templates ADD COLUMN meta_category ENUM(\'MARKETING\', \'UTILITY\') DEFAULT \'MARKETING\' AFTER meta_language', 'SELECT "meta_category existe" AS info');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- meta_components
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'message_templates' AND COLUMN_NAME = 'meta_components');
SET @query = IF(@col_exists = 0, 'ALTER TABLE message_templates ADD COLUMN meta_components JSON NULL AFTER meta_category', 'SELECT "meta_components existe" AS info');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- meta_rejection_reason
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'message_templates' AND COLUMN_NAME = 'meta_rejection_reason');
SET @query = IF(@col_exists = 0, 'ALTER TABLE message_templates ADD COLUMN meta_rejection_reason TEXT NULL AFTER meta_components', 'SELECT "meta_rejection_reason existe" AS info');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- synced_at
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'message_templates' AND COLUMN_NAME = 'synced_at');
SET @query = IF(@col_exists = 0, 'ALTER TABLE message_templates ADD COLUMN synced_at TIMESTAMP NULL AFTER meta_rejection_reason', 'SELECT "synced_at existe" AS info');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Mostrar estrutura final
SELECT 'ESTRUTURA FINAL DA TABELA message_templates:' AS resultado;
DESCRIBE message_templates;

SELECT 'ESTRUTURA FINAL DA TABELA whatsapp_official_credentials:' AS resultado;
DESCRIBE whatsapp_official_credentials;

SELECT 'Migrations aplicadas com sucesso!' AS status;
