# 📦 Integração Shopee - Envio em Lote com Controle de Taxa

## 🔍 Problema Identificado

Ao enviar mensagens WhatsApp em lote via Evolution API para múltiplos números da tabela `user_shopee.numero_notificacao`, apenas **metade das mensagens eram entregues**.

### Causas Prováveis

1. **Rate Limiting da Evolution API**: envio rápido demais causa rejeição
2. **Falta de Retry**: se uma mensagem falha, não há nova tentativa
3. **Timeouts**: requisições muito rápidas podem dar timeout
4. **WhatsApp Anti-Spam**: envios muito rápidos podem ser bloqueados
5. **Erros silenciosos**: falhas não eram logadas adequadamente

---

## ✅ Solução Implementada

Novo endpoint **robusto** com:
- ✅ Delay configurável entre mensagens (padrão: 2 segundos)
- ✅ Retry automático com backoff exponencial (padrão: 3 tentativas)
- ✅ Logs detalhados de cada envio
- ✅ Relatório completo: sucesso/falha de cada número
- ✅ Limite de 100 números por requisição

---

## 📡 Novo Endpoint

### URL
```
POST /api/webhooks/custom/:tenantUuid/whatsapp/batch-send
```

### Headers
```
X-CartBack-API-Key: <sua_api_key>
Content-Type: application/json
```

### Body
```json
{
  "phones": ["41999261087", "41998027292", "41992489909"],
  "message": "Olá! Sua entrega está a caminho 🚚",
  "delayBetweenMessages": 2000,  // 2 segundos entre cada envio (opcional)
  "maxRetries": 3                // Tentativas por número (opcional)
}
```

### Response
```json
{
  "success": true,
  "message": "Batch send completed: 9 sent, 1 failed",
  "summary": {
    "total": 10,
    "sent": 9,
    "failed": 1
  },
  "results": [
    {
      "phone": "41999261087",
      "status": "sent",
      "messageId": "success",
      "attempts": 1
    },
    {
      "phone": "41998027292",
      "status": "failed",
      "error": "Network timeout",
      "attempts": 3
    }
  ]
}
```

---

## 🐘 Código PHP para Integração Shopee

### 1. Função Auxiliar de Envio em Lote

```php
<?php

/**
 * Envia mensagens WhatsApp em lote via CartBack
 *
 * @param string $tenantUuid UUID do tenant no CartBack
 * @param string $apiKey API Key da integração webhook
 * @param array $phones Array de números de telefone
 * @param string $message Mensagem a ser enviada
 * @param int $delayBetweenMessages Delay em ms entre mensagens (padrão: 2000)
 * @param int $maxRetries Tentativas por número (padrão: 3)
 * @return array Resultado do envio
 */
function enviarWhatsAppEmLote($tenantUuid, $apiKey, $phones, $message, $delayBetweenMessages = 2000, $maxRetries = 3) {
    $url = "https://api.cartback.app/api/webhooks/custom/{$tenantUuid}/whatsapp/batch-send";

    $payload = [
        'phones' => $phones,
        'message' => $message,
        'delayBetweenMessages' => $delayBetweenMessages,
        'maxRetries' => $maxRetries
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        "X-CartBack-API-Key: {$apiKey}"
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 300); // 5 minutos de timeout

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        error_log("Erro ao enviar mensagens em lote. HTTP Code: {$httpCode}");
        error_log("Response: {$response}");
        return null;
    }

    return json_decode($response, true);
}

/**
 * Busca números de notificação da tabela user_shopee e envia mensagem
 *
 * @param PDO $pdo Conexão PDO com o banco
 * @param int $userId ID do usuário
 * @param string $mensagem Mensagem a enviar
 * @return array Resultado do envio
 */
function notificarNumerosShopee($pdo, $userId, $mensagem) {
    // Configurações CartBack (buscar de variáveis de ambiente ou config)
    $TENANT_UUID = getenv('CARTBACK_TENANT_UUID') ?: 'seu-uuid-aqui';
    $API_KEY = getenv('CARTBACK_API_KEY') ?: 'sua-api-key-aqui';

    try {
        // Buscar números de notificação do usuário
        $stmt = $pdo->prepare("
            SELECT numero_notificacao
            FROM user_shopee
            WHERE user = :user
            AND numero_notificacao IS NOT NULL
            AND numero_notificacao != ''
        ");
        $stmt->execute(['user' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row || empty($row['numero_notificacao'])) {
            error_log("Nenhum número de notificação encontrado para user_id: {$userId}");
            return null;
        }

        // Converter string "41999261087;41998027292" em array
        $numerosStr = $row['numero_notificacao'];
        $numeros = array_filter(array_map('trim', explode(';', $numerosStr)));

        if (empty($numeros)) {
            error_log("Lista de números vazia após parse: {$numerosStr}");
            return null;
        }

        error_log("Enviando mensagem para " . count($numeros) . " números: " . implode(', ', $numeros));

        // Enviar mensagens em lote via CartBack
        $resultado = enviarWhatsAppEmLote(
            $TENANT_UUID,
            $API_KEY,
            $numeros,
            $mensagem,
            2000,  // 2 segundos entre cada mensagem
            3      // 3 tentativas por número
        );

        if ($resultado && $resultado['success']) {
            error_log("✅ Envio em lote concluído:");
            error_log("  - Total: {$resultado['summary']['total']}");
            error_log("  - Enviados: {$resultado['summary']['sent']}");
            error_log("  - Falhados: {$resultado['summary']['failed']}");

            // Log de falhas detalhado
            foreach ($resultado['results'] as $result) {
                if ($result['status'] === 'failed') {
                    error_log("  ❌ Falha: {$result['phone']} - {$result['error']}");
                }
            }
        } else {
            error_log("❌ Erro ao enviar mensagens em lote");
        }

        return $resultado;

    } catch (Exception $e) {
        error_log("Erro ao notificar números Shopee: " . $e->getMessage());
        return null;
    }
}

// ============== EXEMPLO DE USO ==============

// Conexão PDO (ajuste conforme sua config)
$pdo = new PDO('mysql:host=localhost;dbname=seu_banco', 'usuario', 'senha');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Enviar notificação para números de um usuário
$userId = 123;
$mensagem = "🚚 Sua entrega chegou! Código de rastreamento: ABC123";

$resultado = notificarNumerosShopee($pdo, $userId, $mensagem);

if ($resultado && $resultado['summary']['sent'] > 0) {
    echo "✅ {$resultado['summary']['sent']} mensagens enviadas com sucesso!\n";
} else {
    echo "❌ Falha ao enviar mensagens.\n";
}
```

---

## 🔧 Configuração

### 1. No Projeto Shopee (apisite.tecworks.com.br)

Adicione as credenciais CartBack no seu arquivo de configuração:

```php
// config.php ou .env
putenv('CARTBACK_TENANT_UUID=seu-uuid-aqui');
putenv('CARTBACK_API_KEY=sua-api-key-aqui');
```

### 2. Onde encontrar as credenciais

- **Tenant UUID**: Dashboard CartBack → Integrações → UUID
- **API Key**: Dashboard CartBack → Integrações → Webhook Personalizado → API Key

---

## 📊 Exemplo de Job Shopee

```php
<?php
// jobs/notificar_entrega_shopee.php

require_once 'functions/whatsapp_batch.php';

// Buscar pedidos com status "Em trânsito"
$stmt = $pdo->query("
    SELECT DISTINCT us.user, us.numero_notificacao
    FROM pedidos_shopee ps
    INNER JOIN user_shopee us ON ps.shopee_shop_id = us.shopee_shop_id
    WHERE ps.status = 'Em trânsito'
    AND us.numero_notificacao IS NOT NULL
    AND ps.notificado = 0
");

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $userId = $row['user'];
    $numeros = array_filter(array_map('trim', explode(';', $row['numero_notificacao'])));

    if (empty($numeros)) continue;

    $mensagem = "🚚 Olá! Seus pedidos da Shopee estão a caminho!\n\nAcompanhe pelo app.";

    $resultado = enviarWhatsAppEmLote(
        getenv('CARTBACK_TENANT_UUID'),
        getenv('CARTBACK_API_KEY'),
        $numeros,
        $mensagem,
        3000,  // 3 segundos entre cada (mais seguro para listas grandes)
        3
    );

    if ($resultado && $resultado['success']) {
        // Marcar como notificado
        $pdo->prepare("UPDATE pedidos_shopee SET notificado = 1 WHERE user = ?")->execute([$userId]);
    }

    // Delay entre usuários (evitar sobrecarga)
    sleep(5);
}

echo "Job de notificação concluído!\n";
```

---

## 🎯 Boas Práticas

### 1. Delay Entre Mensagens
- **Recomendado**: 2-3 segundos
- **Mínimo**: 1 segundo
- **Máximo**: Não há, mas impacta tempo total

### 2. Max Retries
- **Recomendado**: 3 tentativas
- **Muito alto**: aumenta tempo de execução
- **Muito baixo**: menos confiabilidade

### 3. Limite de Números
- **Por requisição**: máximo 100 números
- **Para listas grandes**: dividir em lotes de 50-100

### 4. Formato dos Números
```php
// ✅ Correto
$numeros = ['41999261087', '41998027292'];

// ❌ Incorreto
$numeros = ['(41) 99926-1087', '+55 41 99926-1087'];

// Limpar números antes de enviar
$numeros = array_map(function($n) {
    return preg_replace('/[^0-9]/', '', $n);
}, $numerosRaw);
```

---

## 🐛 Debugging

### Habilitar Logs Detalhados

No PHP:
```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

### Verificar Falhas

```php
$resultado = enviarWhatsAppEmLote(...);

if ($resultado && $resultado['summary']['failed'] > 0) {
    echo "Houve falhas:\n";
    foreach ($resultado['results'] as $r) {
        if ($r['status'] === 'failed') {
            echo "- {$r['phone']}: {$r['error']}\n";
        }
    }
}
```

### Logs no Servidor CartBack

Os logs ficam em:
```bash
# Logs da API
tail -f /var/log/cartback/api.log | grep "Batch Send"
```

---

## ⚠️ Problemas Comuns

| Problema | Causa | Solução |
|----------|-------|---------|
| Só metade recebe | Delay muito baixo ou ausente | Use `delayBetweenMessages: 2000` ou mais |
| Timeout | Lista muito grande | Divida em lotes de 50 números |
| Números inválidos | Formato incorreto | Remova caracteres especiais |
| API Key inválida | Credencial errada | Verifique no dashboard CartBack |
| Rate limit atingido | Muitas requisições simultâneas | Use batch-send, não envios individuais |

---

## 📈 Monitoramento

### Script de Teste

```php
<?php
// test_batch_send.php

$numeros = ['41999261087', '41998027292', '41992489909'];
$mensagem = "🧪 Teste de envio em lote - " . date('Y-m-d H:i:s');

$inicio = microtime(true);

$resultado = enviarWhatsAppEmLote(
    getenv('CARTBACK_TENANT_UUID'),
    getenv('CARTBACK_API_KEY'),
    $numeros,
    $mensagem
);

$tempo = round(microtime(true) - $inicio, 2);

echo "Tempo total: {$tempo}s\n";
echo "Enviados: {$resultado['summary']['sent']}\n";
echo "Falhados: {$resultado['summary']['failed']}\n";
```

---

**Última atualização:** 26/02/2026
**Versão CartBack API:** 1.0.0
