-- SQL compatível com MySQL 5.7+ (sem IF NOT EXISTS para colunas)
-- Execute este SQL no Railway

-- 1. Token expiration field
ALTER TABLE whatsapp_official_credentials
ADD COLUMN token_expires_at DATETIME NULL AFTER access_token;

-- 2. Meta fields para message_templates
ALTER TABLE message_templates
ADD COLUMN meta_template_id VARCHAR(255) NULL AFTER sort_order,
ADD COLUMN meta_template_name VARCHAR(255) NULL AFTER meta_template_id,
ADD COLUMN meta_status ENUM('pending', 'approved', 'rejected', 'not_synced') DEFAULT 'not_synced' AFTER meta_template_name,
ADD COLUMN meta_language VARCHAR(10) DEFAULT 'pt_BR' AFTER meta_status,
ADD COLUMN meta_category ENUM('MARKETING', 'UTILITY') DEFAULT 'MARKETING' AFTER meta_language,
ADD COLUMN meta_components JSON NULL AFTER meta_category,
ADD COLUMN meta_rejection_reason TEXT NULL AFTER meta_components,
ADD COLUMN synced_at TIMESTAMP NULL AFTER meta_rejection_reason;

-- Verificar
DESCRIBE message_templates;
DESCRIBE whatsapp_official_credentials;
