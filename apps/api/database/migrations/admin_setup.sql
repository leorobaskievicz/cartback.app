-- SQL para configuração do painel admin
-- Execute este script no seu banco de dados MySQL

-- 1. Adicionar coluna is_admin na tabela users
ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Tornar o primeiro usuário admin (ajuste o email conforme necessário)
UPDATE users SET is_admin = TRUE WHERE email = 'seu-email@exemplo.com' LIMIT 1;
-- Ou tornar admin pelo ID:
-- UPDATE users SET is_admin = TRUE WHERE id = 1;

-- 3. Verificar usuários admin
SELECT id, email, name, is_admin FROM users WHERE is_admin = TRUE;
