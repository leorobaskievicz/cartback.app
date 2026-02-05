# Integração Nuvemshop/TiendaNube

Documentação completa da integração com Nuvemshop (TiendaNube) incluindo OAuth2 e webhooks.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Configuração do App na Nuvemshop](#configuração-do-app-na-nuvemshop)
- [Fluxo OAuth 2.0](#fluxo-oauth-20)
- [Webhooks](#webhooks)
- [API Endpoints](#api-endpoints)
- [Implementação](#implementação)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

A integração com Nuvemshop permite:

1. **OAuth 2.0**: Autenticação segura para acessar dados da loja
2. **Carrinhos Abandonados**: Receber notificações via webhook
3. **Pedidos Criados**: Detectar quando carrinho foi recuperado
4. **API REST**: Consultar carrinhos, pedidos e clientes

### Tecnologias

- **OAuth 2.0**: Autorização segura
- **Webhooks**: Eventos em tempo real
- **REST API**: HTTPS com autenticação bearer token
- **HMAC-SHA256**: Validação de assinatura de webhooks

---

## ⚙️ Configuração do App na Nuvemshop

### 1. Criar Aplicação

1. Acesse: https://partners.nuvemshop.com.br
2. Clique em **"Criar nova aplicação"**
3. Preencha:
   - **Nome**: CartBack
   - **URL da aplicação**: https://cartback.app
   - **Descrição**: Sistema de recuperação de carrinhos abandonados via WhatsApp

### 2. Configurar OAuth

**URL de Redirecionamento (Callback)**:
```
https://api.cartback.app/api/integrations/nuvemshop/callback
```

**Escopos (Permissions)**:
- `read_orders` - Ler pedidos
- `read_customers` - Ler clientes
- `read_products` - Ler produtos
- `write_orders` - Criar/atualizar pedidos

### 3. Obter Credenciais

Após criar o app, você receberá:

- **App ID** (Client ID): Ex: `25664`
- **App Secret** (Client Secret): Ex: `67eaaa37955ca187f08ebb1495bb18a257c12b7c132616b5`

### 4. Configurar Variáveis de Ambiente

```bash
# .env
NUVEMSHOP_APP_ID=25664
NUVEMSHOP_APP_SECRET=67eaaa37955ca187f08ebb1495bb18a257c12b7c132616b5
NUVEMSHOP_REDIRECT_URI=http://localhost:3333/api/integrations/nuvemshop/callback

APP_URL=http://localhost:3333
WEB_URL=http://localhost:5173
```

**⚠️ IMPORTANTE**: Em produção, use URLs HTTPS.

---

## 🔐 Fluxo OAuth 2.0

### Diagrama do Fluxo

```
┌─────────────┐                                         ┌──────────────┐
│   Frontend  │                                         │  Nuvemshop   │
│  (usuário)  │                                         │              │
└─────┬───────┘                                         └──────┬───────┘
      │                                                        │
      │ 1. POST /api/integrations/nuvemshop/connect           │
      ├──────────────────────────────────────────►            │
      │                                            ┌─────────► │
      │ 2. { authUrl }                             │ Backend   │
      │◄──────────────────────────────────────────┤           │
      │                                            │           │
      │ 3. Redireciona para authUrl                │           │
      ├────────────────────────────────────────────────────────►
      │                                            │           │
      │ 4. Usuário autoriza app                    │           │
      │                                            │           │
      │ 5. Redirect para callback com code         │           │
      │◄────────────────────────────────────────────────────────
      │                                            │           │
      │ GET /callback?code=ABC&state=123           │           │
      ├────────────────────────────────────────────►           │
      │                                            │           │
      │                              6. POST /token com code   │
      │                              ├────────────────────────►│
      │                              │                         │
      │                              │ 7. { access_token }     │
      │                              │◄────────────────────────│
      │                              │                         │
      │                              │ 8. GET /store (info)    │
      │                              ├────────────────────────►│
      │                              │                         │
      │                              │ 9. POST /webhooks       │
      │                              ├────────────────────────►│
      │                              │                         │
      │ 10. Redireciona para frontend com sucesso  │           │
      │◄────────────────────────────────────────────           │
      │                                                        │
```

### Passo a Passo

#### 1. Usuário Inicia Conexão

**Request**:
```http
POST /api/integrations/nuvemshop/connect
Authorization: Bearer {jwt_token}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "authUrl": "https://www.tiendanube.com/apps/25664/authorize?client_id=25664&redirect_uri=...&state=1:uuid",
    "platform": "nuvemshop"
  }
}
```

#### 2. Frontend Redireciona

```javascript
window.location.href = authUrl
```

#### 3. Nuvemshop Redireciona de Volta (Callback)

**Request recebido**:
```http
GET /api/integrations/nuvemshop/callback?code=AUTH_CODE&state=1:uuid-123
```

#### 4. Backend Troca Code por Token

```typescript
const tokens = await nuvemshopService.exchangeCode(code)
// {
//   access_token: "abc123...",
//   token_type: "bearer",
//   scope: "read_orders read_customers",
//   user_id: 123456
// }
```

#### 5. Backend Busca Informações da Loja

```typescript
const storeInfo = await nuvemshopService.getStoreInfo(tokens.user_id, tokens.access_token)
// {
//   id: 123456,
//   name: "Minha Loja",
//   url_with_protocol: "https://minhaloja.lojavirtualnuvem.com.br",
//   ...
// }
```

#### 6. Backend Salva Integração

```typescript
const integration = await StoreIntegration.updateOrCreate(
  { tenantId, platform: 'nuvemshop' },
  {
    storeId: String(tokens.user_id),
    storeName: storeInfo.name,
    accessToken: tokens.access_token,
    isActive: true
  }
)
```

#### 7. Backend Configura Webhooks

```typescript
await nuvemshopService.createAbandonedCartWebhook(
  tokens.user_id,
  tokens.access_token,
  `${APP_URL}/api/webhooks/nuvemshop/${tenant.uuid}`
)

await nuvemshopService.createOrderWebhook(
  tokens.user_id,
  tokens.access_token,
  `${APP_URL}/api/webhooks/nuvemshop/${tenant.uuid}/order`
)
```

#### 8. Backend Redireciona para Frontend

```typescript
return response.redirect(`${WEB_URL}/integrations?connected=nuvemshop`)
```

---

## 📡 Webhooks

### Configuração

Os webhooks são configurados automaticamente no fluxo OAuth.

**URLs**:
- Carrinho Abandonado: `POST /api/webhooks/nuvemshop/{tenantUuid}`
- Pedido Criado: `POST /api/webhooks/nuvemshop/{tenantUuid}/order`

### 1. Webhook: Carrinho Abandonado

**Evento**: `cart/abandoned`

**Payload Example**:
```json
{
  "id": 789456123,
  "store_id": 123456,
  "contact_name": "João Silva",
  "contact_email": "joao@email.com",
  "contact_phone": "11999999999",
  "checkout_url": "https://loja.com.br/checkout/abc123",
  "total": "199.90",
  "currency": "BRL",
  "products": [
    {
      "product_id": 123,
      "variant_id": 456,
      "name": "Camiseta Preta",
      "price": "99.90",
      "quantity": 2,
      "image": {
        "url": "https://cdn.loja.com/img.jpg"
      }
    }
  ],
  "created_at": "2024-01-15T10:30:00-03:00"
}
```

**Processamento**:

1. Valida se tenant existe e está ativo
2. Valida se integração existe
3. Parseia dados do carrinho
4. Verifica se cliente tem telefone
5. Adiciona job à fila `process-abandoned-cart`

**Response**:
```json
{
  "received": true,
  "processed": true
}
```

### 2. Webhook: Pedido Criado

**Evento**: `order/created`

**Payload Example**:
```json
{
  "id": 987654,
  "number": 1234,
  "store_id": 123456,
  "customer": {
    "id": 789,
    "name": "João Silva",
    "email": "joao@email.com",
    "phone": "11999999999"
  },
  "total": "199.90",
  "status": "open",
  "payment_status": "pending",
  "created_at": "2024-01-15T10:45:00-03:00"
}
```

**Processamento**:

1. Valida tenant
2. Parseia dados do pedido
3. Busca carrinhos pending do cliente (por telefone OU email)
4. Marca carrinhos como `recovered`
5. Cancela mensagens pendentes na fila
6. Marca mensagens como `cancelled`

**Response**:
```json
{
  "received": true,
  "recovered": 2
}
```

### Validação de Assinatura

A Nuvemshop envia a assinatura no header:

```
X-Linkedstore-HMAC-SHA256: abc123def456...
```

**Validação** (✅ implementada em ambos os webhooks):

```typescript
const signature = request.header('X-Linkedstore-HMAC-SHA256')
if (signature) {
  const payloadString = JSON.stringify(payload)
  const isValid = nuvemshopService.validateWebhookSignature(payloadString, signature)

  if (!isValid) {
    console.error(`[Nuvemshop Webhook] Assinatura inválida`)
    return response.forbidden({ error: 'Invalid signature' })
  }
  console.log(`[Nuvemshop Webhook] ✅ Assinatura validada`)
} else {
  console.warn(`[Nuvemshop Webhook] ⚠️ Webhook sem assinatura HMAC`)
}
```

A validação HMAC protege contra webhooks falsificados, garantindo que apenas requisições legítimas da Nuvemshop sejam processadas.

---

## 🔌 API Endpoints

### Backend Endpoints

#### 1. Iniciar OAuth

```http
POST /api/integrations/nuvemshop/connect
Authorization: Bearer {jwt_token}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "authUrl": "https://www.tiendanube.com/apps/...",
    "platform": "nuvemshop"
  }
}
```

#### 2. Callback OAuth (sem auth)

```http
GET /api/integrations/nuvemshop/callback?code=ABC&state=123
```

**Response**: Redirect para `${WEB_URL}/integrations?connected=nuvemshop`

#### 3. Listar Integrações

```http
GET /api/integrations
Authorization: Bearer {jwt_token}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "platform": "nuvemshop",
      "storeName": "Minha Loja",
      "storeUrl": "https://minhaloja.lojavirtualnuvem.com.br",
      "isActive": true,
      "connectedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### 4. Desconectar Integração

```http
DELETE /api/integrations/1
Authorization: Bearer {jwt_token}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Integration disconnected successfully"
  }
}
```

---

## 💻 Implementação

### Service: NuvemshopService

```typescript
import nuvemshopService from '#services/nuvemshop_service'

// OAuth
const authUrl = nuvemshopService.getAuthUrl(state)
const tokens = await nuvemshopService.exchangeCode(code)
const storeInfo = await nuvemshopService.getStoreInfo(storeId, accessToken)

// Webhooks
await nuvemshopService.createAbandonedCartWebhook(storeId, accessToken, webhookUrl)
await nuvemshopService.createOrderWebhook(storeId, accessToken, webhookUrl)
await nuvemshopService.deleteWebhook(storeId, accessToken, webhookId)

// API
const checkout = await nuvemshopService.getAbandonedCheckout(storeId, accessToken, checkoutId)
const checkouts = await nuvemshopService.listAbandonedCheckouts(storeId, accessToken)
const order = await nuvemshopService.getOrder(storeId, accessToken, orderId)

// Parsing
const cartData = nuvemshopService.parseAbandonedCartWebhook(payload)
const orderData = nuvemshopService.parseOrderWebhook(payload)

// Validação
const isValid = nuvemshopService.validateWebhookSignature(payload, signature)
```

### Controller: StoreIntegrationsController

```typescript
// Iniciar OAuth
async connectNuvemshop({ auth, response }: HttpContext) {
  const state = `${user.tenantId}:${randomUUID()}`
  const authUrl = nuvemshopService.getAuthUrl(state)
  return response.ok({ data: { authUrl } })
}

// Callback OAuth
async nuvemshopCallback({ request, response }: HttpContext) {
  const { code, state } = request.qs()
  const tokens = await nuvemshopService.exchangeCode(code)
  // ... salvar integração, configurar webhooks
  return response.redirect(`${WEB_URL}/integrations?connected=nuvemshop`)
}
```

### Controller: NuvemshopWebhookController

```typescript
// Webhook: Carrinho Abandonado
async abandonedCart({ request, params }: HttpContext) {
  const cartData = nuvemshopService.parseAbandonedCartWebhook(request.body())
  await queueService.addJob('process-abandoned-cart', { ... })
  return response.ok({ received: true })
}

// Webhook: Pedido Criado
async orderCreated({ request, params }: HttpContext) {
  const orderData = nuvemshopService.parseOrderWebhook(request.body())
  // Marcar carrinhos como recuperados
  return response.ok({ received: true, recovered: count })
}
```

---

## 🔧 Troubleshooting

### Erro: "Invalid redirect_uri"

**Causa**: URL de callback não está configurada no app da Nuvemshop

**Solução**:
1. Acesse https://partners.nuvemshop.com.br
2. Edite seu app
3. Adicione a URL exata: `http://localhost:3333/api/integrations/nuvemshop/callback`
4. Em produção, use HTTPS

---

### Erro: "Invalid code"

**Causa**: Código de autorização já foi usado ou expirou

**Solução**:
- Códigos são válidos por apenas 1 uso
- Inicie o fluxo OAuth novamente
- Códigos expiram após 10 minutos

---

### Webhook não está chegando

**Possíveis causas**:

1. **URL incorreta**
   ```bash
   # Verificar no banco
   SELECT * FROM store_integrations WHERE platform = 'nuvemshop';
   ```

2. **Webhook não foi criado**
   ```bash
   # Reconectar integração para recriar webhooks
   ```

3. **Servidor não está acessível**
   ```bash
   # Usar ngrok para testar localmente
   ngrok http 3333
   # Atualizar NUVEMSHOP_REDIRECT_URI
   ```

4. **Firewall bloqueando**
   - IPs da Nuvemshop devem estar liberados

---

### Access Token expirado

**Sintoma**: Erro 401 ao chamar APIs

**Solução**:
- Nuvemshop não fornece refresh tokens
- Usuário precisa reconectar a integração manualmente
- Tokens têm validade longa (anos), mas podem ser revogados

---

### Carrinho não está sendo processado

**Verificar**:

1. **Logs do webhook**:
   ```bash
   # Ver logs do servidor
   tail -f logs/app.log | grep "Nuvemshop Webhook"
   ```

2. **Job na fila**:
   ```typescript
   const stats = await queueService.getQueueStats('process-abandoned-cart')
   console.log(stats)
   ```

3. **Telefone do cliente**:
   ```bash
   # Webhook ignora carrinhos sem telefone
   ```

---

### Order created não está detectando recuperação

**Verificar**:

1. **Mesmo telefone/email?**
   ```sql
   SELECT customer_phone, customer_email
   FROM abandoned_carts
   WHERE status = 'pending';
   ```

2. **Status do carrinho**:
   ```sql
   SELECT id, status, created_at
   FROM abandoned_carts
   WHERE customer_phone = '5511999999999';
   ```

---

## 📚 Referências

- [Nuvemshop API Documentation](https://tiendanube.github.io/api-documentation/)
- [OAuth 2.0 Flow](https://tiendanube.github.io/api-documentation/authentication)
- [Webhooks Reference](https://tiendanube.github.io/api-documentation/webhooks)
- [Partners Portal](https://partners.nuvemshop.com.br)

---

## 🚀 Status da Integração

### ✅ Implementado

- [x] Fluxo OAuth 2.0 completo
- [x] Validação de assinatura HMAC (ambos webhooks)
- [x] Webhook de carrinho abandonado
- [x] Webhook de pedido criado (detecção de recuperação)
- [x] Remoção automática de webhooks ao desconectar
- [x] Frontend para conectar/desconectar
- [x] Soft delete de integrações

### 🔜 Próximas Melhorias

- [ ] Adicionar refresh de access token (se Nuvemshop implementar)
- [ ] Sync inicial de carrinhos abandonados após conexão
- [ ] Dashboard com métricas da integração
- [ ] Logs detalhados de webhooks no banco
- [ ] Retry automático de webhooks falhados

**📖 Ver guia completo de testes:** `/NUVEMSHOP_TESTING.md`
