-- Debug detalhado dos números que falharam vs que funcionaram

-- 1. NÚMEROS QUE FALHARAM (com análise byte a byte)
SELECT
    '❌ FALHOU' as status,
    id,
    customer_phone,
    LENGTH(customer_phone) as tamanho_bytes,
    CHAR_LENGTH(customer_phone) as tamanho_chars,
    HEX(customer_phone) as hex_representation,
    ASCII(SUBSTRING(customer_phone, 1, 1)) as primeiro_char_ascii,
    ASCII(SUBSTRING(customer_phone, LENGTH(customer_phone), 1)) as ultimo_char_ascii,
    error_message,
    created_at
FROM unified_message_logs
WHERE (customer_phone LIKE '%98027292%' OR customer_phone LIKE '%92489909%')
    AND status = 'failed'
    AND provider = 'evolution'
ORDER BY created_at DESC
LIMIT 5;

-- 2. NÚMEROS QUE FUNCIONARAM (mesma formatação esperada)
SELECT
    '✅ FUNCIONOU' as status,
    id,
    customer_phone,
    LENGTH(customer_phone) as tamanho_bytes,
    CHAR_LENGTH(customer_phone) as tamanho_chars,
    HEX(customer_phone) as hex_representation,
    ASCII(SUBSTRING(customer_phone, 1, 1)) as primeiro_char_ascii,
    ASCII(SUBSTRING(customer_phone, LENGTH(customer_phone), 1)) as ultimo_char_ascii,
    '' as error_message,
    created_at
FROM unified_message_logs
WHERE status = 'sent'
    AND provider = 'evolution'
    AND customer_phone LIKE '5541%'
ORDER BY created_at DESC
LIMIT 5;

-- 3. COMPARAÇÃO DIRETA
SELECT
    'COMPARAÇÃO' as tipo,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as total_falhas,
    COUNT(CASE WHEN status = 'sent' THEN 1 END) as total_sucessos,
    AVG(CASE WHEN status = 'failed' THEN LENGTH(customer_phone) END) as media_tamanho_falhas,
    AVG(CASE WHEN status = 'sent' THEN LENGTH(customer_phone) END) as media_tamanho_sucessos
FROM unified_message_logs
WHERE provider = 'evolution'
    AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR);

-- 4. BUSCAR NO ABANDONED_CARTS como o número foi recebido originalmente
SELECT
    'CARRINHO ORIGINAL' as origem,
    ac.id,
    ac.customer_phone as phone_no_carrinho,
    LENGTH(ac.customer_phone) as tamanho,
    HEX(ac.customer_phone) as hex_carrinho,
    ac.status,
    ac.created_at
FROM abandoned_carts ac
WHERE (ac.customer_phone LIKE '%98027292%' OR ac.customer_phone LIKE '%92489909%')
ORDER BY ac.created_at DESC
LIMIT 5;
