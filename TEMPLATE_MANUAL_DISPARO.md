# 📤 Templates de Disparo Manual

## O que são?

Templates de **Disparo Manual** são templates que **não** são processados automaticamente pelo sistema de carrinhos abandonados. Eles servem para disparos avulsos via webhook, permitindo que você envie mensagens personalizadas quando quiser.

## Diferenças entre os tipos de templates

| Característica | Carrinho Abandonado | Disparo Manual |
|----------------|---------------------|----------------|
| **Trigger** | Automático (quando carrinho é abandonado) | Manual (via webhook) |
| **Delay** | Sim (ex: enviar após 60min) | Não (disparo imediato) |
| **Variáveis** | Fixas (nome, produtos, link, total) | Dinâmicas (você define ao disparar) |
| **Uso** | Recuperação de vendas | Boas-vindas, notificações, promoções, etc |

---

## Como Criar um Template Manual

### 1. No Frontend

1. Acesse **Templates** no dashboard
2. Clique em **Novo Template**
3. No campo **Tipo**, selecione **📤 Disparo Manual**
4. Preencha:
   - **Nome**: Ex: "Boas-vindas novo cliente"
   - **Conteúdo**: Use variáveis como `{{nome}}`, `{{link}}`, etc
   - **Modo**: Simples (Evolution) ou Completo (Meta API)
5. Salve

**Exemplo de conteúdo:**
```
Olá {{nome}}! 👋

Seja bem-vindo(a) à nossa loja!

{{link}}
```

### 2. Via API

```bash
POST /api/templates
Authorization: Bearer <seu_token>

{
  "name": "Boas-vindas",
  "triggerType": "manual",
  "content": "Olá {{nome}}! Seja bem-vindo(a)! {{link}}",
  "isActive": true,
  "metaMode": false
}
```

---

## Como Disparar um Template Manual

### Endpoint

```
POST /api/webhooks/custom/:tenantUuid/template/send
```

### Headers

```
X-CartBack-API-Key: <sua_api_key>
Content-Type: application/json
```

### Body

```json
{
  "template_id": 123,                  // OU "template_name": "Boas-vindas"
  "phone": "5541999999999",            // Número com código do país
  "variables": {
    "nome": "João Silva",
    "link": "https://minhaloja.com",
    "produtos": "Produto X",
    "total": "R$ 100,00"
  }
}
```

### Exemplo completo com cURL

```bash
curl -X POST 'https://api.cartback.app/api/webhooks/custom/SEU_TENANT_UUID/template/send' \
  -H 'Content-Type: application/json' \
  -H 'X-CartBack-API-Key: SUA_API_KEY' \
  -d '{
    "template_id": 10,
    "phone": "5541999999999",
    "variables": {
      "nome": "Maria Santos",
      "link": "https://loja.com/produtos"
    }
  }'
```

### Exemplo com Node.js

```javascript
const axios = require('axios')

async function enviarBoasVindas(nome, telefone, link) {
  const response = await axios.post(
    'https://api.cartback.app/api/webhooks/custom/SEU_TENANT_UUID/template/send',
    {
      template_name: 'Boas-vindas',
      phone: telefone,
      variables: {
        nome: nome,
        link: link
      }
    },
    {
      headers: {
        'X-CartBack-API-Key': 'SUA_API_KEY',
        'Content-Type': 'application/json'
      }
    }
  )

  console.log('Mensagem enviada:', response.data)
}

// Uso
await enviarBoasVindas('João Silva', '5541999999999', 'https://loja.com')
```

---

## Casos de Uso

### 1. Boas-vindas para novos clientes

**Template:**
```
Olá {{nome}}! 👋

Seja bem-vindo(a) à {{loja}}!

Navegue pela nossa loja:
{{link}}
```

**Disparo:**
```json
{
  "template_name": "Boas-vindas",
  "phone": "5541999999999",
  "variables": {
    "nome": "Maria Santos",
    "loja": "Moda Fashion",
    "link": "https://modafashion.com"
  }
}
```

### 2. Notificação de promoção

**Template:**
```
🎉 {{nome}}, promoção especial pra você!

{{descricao}}

Use o cupom: {{cupom}}
Válido até: {{validade}}

{{link}}
```

**Disparo:**
```json
{
  "template_name": "Promoção",
  "phone": "5541999999999",
  "variables": {
    "nome": "João",
    "descricao": "50% OFF em toda loja",
    "cupom": "PROMO50",
    "validade": "31/12/2026",
    "link": "https://loja.com/promo"
  }
}
```

### 3. Lembrete de evento

**Template:**
```
📅 Lembrete para {{nome}}

Seu evento: {{evento}}
Data: {{data}}
Local: {{local}}

{{link}}
```

**Disparo:**
```json
{
  "template_name": "Lembrete",
  "phone": "5541999999999",
  "variables": {
    "nome": "Carlos",
    "evento": "Workshop de Marketing",
    "data": "15/03/2026 às 14h",
    "local": "Auditório Central",
    "link": "https://eventos.com/detalhes/123"
  }
}
```

---

## Respostas da API

### Sucesso (200 OK)

```json
{
  "success": true,
  "message": "Template sent successfully",
  "data": {
    "phone": "5541999999999",
    "template_id": 10,
    "template_name": "Boas-vindas",
    "messageId": "wamid.HBgNMTU1MTIzNDU2Nzg5FQIAERgSQjI3RDNGM0Q1N0E4QThBQkM3AA=="
  }
}
```

### Erros

| Código | Erro | Solução |
|--------|------|---------|
| 400 | `Missing API Key` | Adicione header `X-CartBack-API-Key` |
| 401 | `Invalid API Key` | Verifique sua API Key |
| 404 | `Template not found` | Verifique se template existe e é do tipo `manual` |
| 422 | `Template is inactive` | Ative o template no dashboard |
| 422 | `No connected WhatsApp instance` | Conecte uma instância WhatsApp |

---

## Integração com E-commerce

### Shopify (após finalizar cadastro)

```javascript
// webhook.js no Shopify
fetch('https://api.cartback.app/api/webhooks/custom/SEU_UUID/template/send', {
  method: 'POST',
  headers: {
    'X-CartBack-API-Key': 'SUA_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    template_name: 'Boas-vindas',
    phone: customer.phone,
    variables: {
      nome: customer.first_name,
      link: 'https://loja.com/produtos'
    }
  })
})
```

### WooCommerce (após compra)

```php
// functions.php
add_action('woocommerce_thankyou', function($order_id) {
    $order = wc_get_order($order_id);

    wp_remote_post('https://api.cartback.app/api/webhooks/custom/SEU_UUID/template/send', [
        'headers' => [
            'X-CartBack-API-Key' => 'SUA_KEY',
            'Content-Type' => 'application/json'
        ],
        'body' => json_encode([
            'template_name' => 'Agradecimento',
            'phone' => $order->get_billing_phone(),
            'variables' => [
                'nome' => $order->get_billing_first_name(),
                'pedido' => $order->get_order_number()
            ]
        ])
    ]);
});
```

---

## SQL para Adicionar a Coluna (se ainda não rodou)

```sql
ALTER TABLE message_templates
ADD COLUMN variable_mapping JSON NULL
AFTER meta_components;
```

---

## Observações Importantes

1. **Templates manuais NÃO aparecem no fluxo de carrinhos abandonados**
2. **Variáveis são flexíveis**: você define quais usar ao disparar
3. **API Key**: mesma usada nos webhooks personalizados
4. **Número de telefone**: deve incluir código do país (ex: 5541999999999)
5. **Templates Meta aprovados**: enviados via template, outros enviados como texto
6. **Logs**: todos disparos ficam registrados em `whatsapp_official_logs`

---

**Última atualização:** 26/02/2026
