-- Execute todos os SQLs necessários para o sistema funcionar
-- USE railway;

-- 1. Adicionar campo de expiração do token (se não existir)
ALTER TABLE whatsapp_official_credentials
ADD COLUMN IF NOT EXISTS token_expires_at DATETIME NULL AFTER access_token;

-- 2. Adicionar campos Meta à message_templates (se não existirem)
ALTER TABLE message_templates
ADD COLUMN IF NOT EXISTS meta_template_id VARCHAR(255) NULL AFTER sort_order,
ADD COLUMN IF NOT EXISTS meta_template_name VARCHAR(255) NULL AFTER meta_template_id,
ADD COLUMN IF NOT EXISTS meta_status ENUM('pending', 'approved', 'rejected', 'not_synced') DEFAULT 'not_synced' AFTER meta_template_name,
ADD COLUMN IF NOT EXISTS meta_language VARCHAR(10) DEFAULT 'pt_BR' AFTER meta_status,
ADD COLUMN IF NOT EXISTS meta_category ENUM('MARKETING', 'UTILITY') DEFAULT 'MARKETING' AFTER meta_language,
ADD COLUMN IF NOT EXISTS meta_components JSON NULL AFTER meta_category,
ADD COLUMN IF NOT EXISTS meta_rejection_reason TEXT NULL AFTER meta_components,
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP NULL AFTER meta_rejection_reason;

-- Verificar estrutura
SELECT 'whatsapp_official_credentials structure:' AS info;
DESCRIBE whatsapp_official_credentials;

SELECT 'message_templates structure:' AS info;
DESCRIBE message_templates;

SELECT 'Done! All migrations applied.' AS status;
