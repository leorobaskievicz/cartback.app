-- Execute este SQL no MySQL para aplicar as migrations de planos e pagamentos
-- USE cartback;

-- 1. Adicionar cpf_cnpj ao tenants (se não existir)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cpf_cnpj VARCHAR(255) NULL AFTER phone;

-- 2. Atualizar enum de subscriptions - plan
ALTER TABLE subscriptions MODIFY COLUMN plan ENUM('trial', 'starter', 'pro', 'business') NOT NULL;

-- 3. Atualizar enum de subscriptions - status
ALTER TABLE subscriptions MODIFY COLUMN status ENUM('active', 'past_due', 'cancelled', 'trial', 'pending') DEFAULT 'active';

-- 4. Atualizar enum de subscriptions - payment_gateway (permitir NULL)
ALTER TABLE subscriptions MODIFY COLUMN payment_gateway ENUM('asaas') NULL;

-- 5. Adicionar coluna trial_ends_at
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP NULL;

-- 6. Criar tabela payment_histories
CREATE TABLE IF NOT EXISTS payment_histories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT UNSIGNED NOT NULL,
  subscription_id INT UNSIGNED NOT NULL,
  external_payment_id VARCHAR(255) NOT NULL,
  amount INT NOT NULL COMMENT 'Valor em centavos',
  status ENUM('pending', 'confirmed', 'received', 'overdue', 'refunded', 'cancelled') DEFAULT 'pending',
  payment_method ENUM('pix', 'credit_card', 'boleto') NOT NULL,
  paid_at TIMESTAMP NULL,
  due_date TIMESTAMP NOT NULL,
  invoice_url VARCHAR(255) NULL,
  pix_qr_code TEXT NULL,
  pix_copy_paste TEXT NULL,
  boleto_url VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
  INDEX idx_external_payment_id (external_payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verificar as tabelas criadas
SHOW TABLES;
DESC subscriptions;
DESC payment_histories;
