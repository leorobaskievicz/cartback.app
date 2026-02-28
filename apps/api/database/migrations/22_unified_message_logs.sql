-- Tabela unificada de logs de mensagens
-- Registra TODOS os envios: Evolution API, WhatsApp Oficial, sucessos e falhas

CREATE TABLE unified_message_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  -- Identificação
  tenant_id INT UNSIGNED NOT NULL,

  -- Tipo de envio
  provider ENUM('evolution', 'official') NOT NULL COMMENT 'evolution = Evolution API, official = WhatsApp Official API',
  message_type ENUM('text', 'template', 'image', 'document', 'video', 'audio') NOT NULL DEFAULT 'text',

  -- Destinatário
  customer_phone VARCHAR(20) NOT NULL COMMENT 'Telefone do destinatário com código do país',
  customer_name VARCHAR(255) NULL COMMENT 'Nome do destinatário',

  -- Contexto (opcional)
  abandoned_cart_id INT UNSIGNED NULL,

  -- Template usado
  message_template_id INT UNSIGNED NULL,
  template_name VARCHAR(255) NULL COMMENT 'Nome do template no momento do envio',

  -- Credenciais/Instância utilizada
  whatsapp_instance_id INT UNSIGNED NULL,
  official_credential_id INT UNSIGNED NULL,

  -- Conteúdo da mensagem
  message_content TEXT NULL COMMENT 'Conteúdo final enviado (texto ou JSON para templates)',
  template_variables JSON NULL COMMENT 'Variáveis usadas no template (formato JSON)',

  -- Status e rastreamento
  status ENUM('queued', 'sent', 'delivered', 'read', 'failed', 'cancelled') NOT NULL DEFAULT 'queued',
  external_message_id VARCHAR(255) NULL COMMENT 'ID da mensagem retornado pela API',

  -- Erro (se houver)
  error_message TEXT NULL,
  error_code VARCHAR(50) NULL,

  -- Timestamps do ciclo de vida
  queued_at TIMESTAMP NULL COMMENT 'Quando foi colocado na fila',
  sent_at TIMESTAMP NULL COMMENT 'Quando foi efetivamente enviado',
  delivered_at TIMESTAMP NULL COMMENT 'Quando foi entregue (confirmação)',
  read_at TIMESTAMP NULL COMMENT 'Quando foi lido pelo destinatário',
  failed_at TIMESTAMP NULL COMMENT 'Quando falhou',

  -- Metadados adicionais
  metadata JSON NULL COMMENT 'Dados extras (origem, campanha, etc)',

  -- Timestamps padrão
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign Keys
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (abandoned_cart_id) REFERENCES abandoned_carts(id) ON DELETE SET NULL,
  FOREIGN KEY (message_template_id) REFERENCES message_templates(id) ON DELETE SET NULL,
  FOREIGN KEY (whatsapp_instance_id) REFERENCES whatsapp_instances(id) ON DELETE SET NULL,
  FOREIGN KEY (official_credential_id) REFERENCES whatsapp_official_credentials(id) ON DELETE SET NULL,

  -- Índices para performance
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_provider (provider),
  INDEX idx_status (status),
  INDEX idx_customer_phone (customer_phone),
  INDEX idx_abandoned_cart_id (abandoned_cart_id),
  INDEX idx_message_template_id (message_template_id),
  INDEX idx_tenant_status (tenant_id, status),
  INDEX idx_tenant_provider (tenant_id, provider),
  INDEX idx_tenant_created (tenant_id, created_at),
  INDEX idx_external_message_id (external_message_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exemplo de queries úteis:

-- Ver todos os disparos de um tenant
-- SELECT * FROM unified_message_logs WHERE tenant_id = 1 ORDER BY created_at DESC;

-- Ver falhas dos últimos 7 dias
-- SELECT * FROM unified_message_logs WHERE status = 'failed' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) ORDER BY created_at DESC;

-- Estatísticas por provider
-- SELECT provider, status, COUNT(*) as total FROM unified_message_logs GROUP BY provider, status;

-- Taxa de sucesso por telefone
-- SELECT customer_phone,
--        COUNT(*) as total_envios,
--        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as enviados,
--        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as falhas
-- FROM unified_message_logs
-- GROUP BY customer_phone
-- ORDER BY total_envios DESC;
