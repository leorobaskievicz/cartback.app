# CartBack API Reference

Base URL: `http://localhost:3333/api`

## Formato de Resposta

### Sucesso
```json
{
  "success": true,
  "data": { ... }
}
```

### Erro
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": []
  }
}
```

---

## Autenticação

### POST /api/auth/register
Registra novo tenant + usuário owner

**Body:**
```json
{
  "tenantName": "Minha Loja",
  "name": "João Silva",
  "email": "joao@minhaloja.com",
  "password": "senha123",
  "phone": "11999999999"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "joao@minhaloja.com",
      "name": "João Silva",
      "role": "owner"
    },
    "tenant": {
      "id": 1,
      "uuid": "abc-123",
      "name": "Minha Loja",
      "plan": "trial",
      "trialEndsAt": "2024-02-15T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1..."
  }
}
```

### POST /api/auth/login
Login

**Body:**
```json
{
  "email": "joao@minhaloja.com",
  "password": "senha123"
}
```

**Response:** (igual ao register)

### POST /api/auth/logout
Revoga token atual

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

### GET /api/auth/me
Dados do usuário + tenant

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "joao@minhaloja.com",
      "name": "João Silva",
      "role": "owner"
    },
    "tenant": {
      "id": 1,
      "uuid": "abc-123",
      "name": "Minha Loja",
      "email": "contato@minhaloja.com",
      "plan": "trial",
      "isActive": true
    }
  }
}
```

---

## Tenant

### PUT /api/tenant
Atualiza dados do tenant

**Headers:** `Authorization: Bearer {token}`

**Body:**
```json
{
  "name": "Minha Loja Atualizada",
  "email": "novo@email.com",
  "phone": "11988888888"
}
```

---

## Store Integrations

### GET /api/integrations
Lista integrações

**Headers:** `Authorization: Bearer {token}`

**Response:**
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
      "connectedAt": "2024-01-20T10:00:00.000Z"
    }
  ]
}
```

### POST /api/integrations/nuvemshop/connect
Inicia OAuth Nuvemshop

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://www.nuvemshop.com.br/apps/authorize?..."
  }
}
```

### GET /api/integrations/nuvemshop/callback
Callback OAuth (chamado pela Nuvemshop)

**Query Params:** `?code=xxx`

### DELETE /api/integrations/:id
Desconecta integração

**Headers:** `Authorization: Bearer {token}`

---

## WhatsApp

### GET /api/whatsapp
Status da instância

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "instance": {
      "id": 1,
      "instanceName": "cartback-tenant-1",
      "phoneNumber": "5511999999999",
      "status": "connected",
      "connectedAt": "2024-01-20T10:00:00.000Z"
    }
  }
}
```

### POST /api/whatsapp/connect
Gera QR Code

**Headers:** `Authorization: Bearer {token}`

**Body:**
```json
{
  "instanceName": "cartback-tenant-1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,...",
    "instanceName": "cartback-tenant-1"
  }
}
```

### GET /api/whatsapp/qrcode
Retorna QR Code atual

**Headers:** `Authorization: Bearer {token}`

### POST /api/whatsapp/disconnect
Desconecta WhatsApp

**Headers:** `Authorization: Bearer {token}`

### POST /api/whatsapp/webhook
Webhook Evolution API (não autenticado)

---

## Message Templates

### GET /api/templates
Lista templates

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "30 minutos",
      "triggerType": "abandoned_cart",
      "delayMinutes": 30,
      "content": "Olá {{nome}}! Vi que você deixou itens no carrinho...",
      "isActive": true,
      "sortOrder": 1
    }
  ]
}
```

### POST /api/templates
Cria template

**Headers:** `Authorization: Bearer {token}`

**Body:**
```json
{
  "name": "24 horas",
  "delayMinutes": 1440,
  "content": "Olá {{nome}}! Seus itens ainda estão esperando...",
  "isActive": true
}
```

### PUT /api/templates/:id
Atualiza template

**Headers:** `Authorization: Bearer {token}`

### DELETE /api/templates/:id
Remove template

**Headers:** `Authorization: Bearer {token}`

### PUT /api/templates/reorder
Reordena templates

**Headers:** `Authorization: Bearer {token}`

**Body:**
```json
{
  "templates": [
    { "id": 1, "sortOrder": 0 },
    { "id": 2, "sortOrder": 1 },
    { "id": 3, "sortOrder": 2 }
  ]
}
```

---

## Abandoned Carts

### GET /api/carts
Lista carrinhos (paginado)

**Headers:** `Authorization: Bearer {token}`

**Query Params:**
- `page`: número da página (default: 1)
- `limit`: itens por página (default: 20)
- `status`: filtro por status (pending, processing, recovered, expired, cancelled)
- `search`: busca por nome, email ou telefone

**Response:**
```json
{
  "success": true,
  "data": {
    "meta": {
      "total": 50,
      "perPage": 20,
      "currentPage": 1,
      "lastPage": 3
    },
    "data": [
      {
        "id": 1,
        "externalCartId": "cart-123",
        "customerName": "Maria Silva",
        "customerEmail": "maria@email.com",
        "customerPhone": "11999999999",
        "totalValue": 150.00,
        "currency": "BRL",
        "status": "pending",
        "createdAt": "2024-01-20T10:00:00.000Z"
      }
    ]
  }
}
```

### GET /api/carts/:id
Detalhe do carrinho + mensagens

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "cart": {
      "id": 1,
      "customerName": "Maria Silva",
      "items": [
        {
          "id": "prod-1",
          "name": "Camiseta",
          "quantity": 2,
          "price": 50.00,
          "image": "https://..."
        }
      ],
      "status": "pending"
    },
    "messageLogs": [
      {
        "id": 1,
        "templateName": "30 minutos",
        "content": "Olá Maria! Vi que você deixou...",
        "status": "delivered",
        "sentAt": "2024-01-20T10:30:00.000Z",
        "deliveredAt": "2024-01-20T10:31:00.000Z"
      }
    ]
  }
}
```

### PUT /api/carts/:id/cancel
Cancela recuperação

**Headers:** `Authorization: Bearer {token}`

---

## Dashboard

### GET /api/dashboard/stats
Métricas gerais

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCarts": 150,
    "recoveredCarts": 45,
    "recoveryRate": 30.00,
    "totalRecovered": 6750.50,
    "messagesSent": 320,
    "activeCarts": 25
  }
}
```

### GET /api/dashboard/chart
Dados para gráficos (últimos 30 dias)

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "cartsByDay": [
      { "date": "2024-01-20", "total": 5 }
    ],
    "recoveriesByDay": [
      { "date": "2024-01-20", "total": 2, "value": 300.00 }
    ],
    "messagesByDay": [
      { "date": "2024-01-20", "total": 10 }
    ]
  }
}
```

---

## Webhooks

### POST /api/webhooks/nuvemshop/:tenantUuid
Webhook Nuvemshop (não autenticado)

Recebe eventos de carrinho abandonado da Nuvemshop.

**Body:** (enviado pela Nuvemshop)
```json
{
  "event": "cart/abandoned",
  "data": {
    "id": "cart-123",
    "customer": {
      "id": "cust-456",
      "name": "Maria Silva",
      "email": "maria@email.com",
      "phone": "11999999999"
    },
    "products": [...],
    "abandoned_checkout_url": "https://..."
  }
}
```

---

## Placeholders de Mensagem

Templates suportam os seguintes placeholders:

- `{{nome}}` - Nome do cliente
- `{{produtos}}` - Lista de produtos
- `{{link}}` - Link para recuperar carrinho
- `{{total}}` - Valor total do carrinho

---

## Códigos de Erro

- `VALIDATION_ERROR` - Erro de validação de dados
- `UNAUTHORIZED` - Não autenticado
- `TENANT_INACTIVE` - Tenant inativo
- `NO_TENANT` - Usuário sem tenant
- `TENANT_NOT_FOUND` - Tenant não encontrado
- `INTEGRATION_NOT_FOUND` - Integração não encontrada
- `WHATSAPP_CONNECTION_FAILED` - Falha ao conectar WhatsApp
- `WEBHOOK_PROCESSING_FAILED` - Falha ao processar webhook

---

## Autenticação

Todas as rotas autenticadas requerem header:

```
Authorization: Bearer {token}
```

O token é retornado nas rotas de registro e login, e deve ser incluído em todas as requisições autenticadas.
