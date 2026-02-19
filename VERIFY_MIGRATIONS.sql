-- SQL para verificar se todas as colunas necessárias existem

-- 1. Verificar whatsapp_official_credentials
SELECT
  'whatsapp_official_credentials' AS tabela,
  COLUMN_NAME AS coluna,
  COLUMN_TYPE AS tipo,
  IS_NULLABLE AS permite_null
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'whatsapp_official_credentials'
  AND COLUMN_NAME IN ('token_expires_at')
ORDER BY ORDINAL_POSITION;

-- 2. Verificar message_templates - campos Meta
SELECT
  'message_templates' AS tabela,
  COLUMN_NAME AS coluna,
  COLUMN_TYPE AS tipo,
  IS_NULLABLE AS permite_null
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'message_templates'
  AND COLUMN_NAME IN (
    'meta_template_id',
    'meta_template_name',
    'meta_status',
    'meta_language',
    'meta_category',
    'meta_components',
    'meta_rejection_reason',
    'synced_at'
  )
ORDER BY ORDINAL_POSITION;

-- 3. Contar quantas colunas Meta existem (deve ser 8)
SELECT
  'Total de colunas Meta:' AS info,
  COUNT(*) AS quantidade,
  CASE
    WHEN COUNT(*) = 8 THEN '✅ TODAS AS COLUNAS CRIADAS!'
    ELSE '❌ FALTAM COLUNAS'
  END AS status
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'message_templates'
  AND COLUMN_NAME IN (
    'meta_template_id',
    'meta_template_name',
    'meta_status',
    'meta_language',
    'meta_category',
    'meta_components',
    'meta_rejection_reason',
    'synced_at'
  );

-- 4. Verificar se token_expires_at existe
SELECT
  'Campo token_expires_at:' AS info,
  CASE
    WHEN COUNT(*) = 1 THEN '✅ CRIADO'
    ELSE '❌ NÃO EXISTE'
  END AS status
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'whatsapp_official_credentials'
  AND COLUMN_NAME = 'token_expires_at';
