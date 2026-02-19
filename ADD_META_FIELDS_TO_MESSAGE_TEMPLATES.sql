-- Adicionar campos Meta WhatsApp Official API à tabela message_templates
-- Execute este SQL se os campos ainda não existirem

-- Verificar se as colunas já existem antes de adicionar
SET @dbname = DATABASE();
SET @tablename = 'message_templates';

-- meta_template_id
SET @column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
  AND TABLE_NAME = @tablename
  AND COLUMN_NAME = 'meta_template_id'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE message_templates ADD COLUMN meta_template_id VARCHAR(255) NULL AFTER sort_order',
  'SELECT "meta_template_id already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- meta_template_name
SET @column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
  AND TABLE_NAME = @tablename
  AND COLUMN_NAME = 'meta_template_name'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE message_templates ADD COLUMN meta_template_name VARCHAR(255) NULL AFTER meta_template_id',
  'SELECT "meta_template_name already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- meta_status
SET @column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
  AND TABLE_NAME = @tablename
  AND COLUMN_NAME = 'meta_status'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE message_templates ADD COLUMN meta_status ENUM(''pending'', ''approved'', ''rejected'', ''not_synced'') DEFAULT ''not_synced'' AFTER meta_template_name',
  'SELECT "meta_status already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- meta_language
SET @column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
  AND TABLE_NAME = @tablename
  AND COLUMN_NAME = 'meta_language'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE message_templates ADD COLUMN meta_language VARCHAR(10) DEFAULT ''pt_BR'' AFTER meta_status',
  'SELECT "meta_language already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- meta_category
SET @column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
  AND TABLE_NAME = @tablename
  AND COLUMN_NAME = 'meta_category'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE message_templates ADD COLUMN meta_category ENUM(''MARKETING'', ''UTILITY'') DEFAULT ''MARKETING'' AFTER meta_language',
  'SELECT "meta_category already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- meta_components (JSON type for better support)
SET @column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
  AND TABLE_NAME = @tablename
  AND COLUMN_NAME = 'meta_components'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE message_templates ADD COLUMN meta_components JSON NULL AFTER meta_category',
  'SELECT "meta_components already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- meta_rejection_reason
SET @column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
  AND TABLE_NAME = @tablename
  AND COLUMN_NAME = 'meta_rejection_reason'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE message_templates ADD COLUMN meta_rejection_reason TEXT NULL AFTER meta_components',
  'SELECT "meta_rejection_reason already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- synced_at
SET @column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
  AND TABLE_NAME = @tablename
  AND COLUMN_NAME = 'synced_at'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE message_templates ADD COLUMN synced_at TIMESTAMP NULL AFTER meta_rejection_reason',
  'SELECT "synced_at already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar a estrutura final
DESCRIBE message_templates;
