-- Adicionar campo de data de expiração do token Meta
ALTER TABLE whatsapp_official_credentials
ADD COLUMN token_expires_at DATETIME NULL AFTER access_token;

-- Comentário: Para tokens System User com "Never expire", esse campo fica NULL
-- Para tokens long-lived, armazena a data de expiração
