# 📡 Integração Webhook Personalizada - CartBack

Documentação completa para integrar sua plataforma customizada com CartBack usando webhooks.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Configuração](#configuração)
- [Autenticação](#autenticação)
- [API Webhook](#api-webhook)
- [Disparo Direto de Mensagem WhatsApp](#-disparo-direto-de-mensagem-whatsapp)
- [Exemplos de Implementação](#exemplos-de-implementação)
- [Testes](#testes)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

A integração webhook personalizada permite que você envie dados de carrinhos abandonados da sua plataforma para o CartBack, independente de qual e-commerce você utiliza.

### Para quem é?

- **Desenvolvedores** que querem integrar plataformas não suportadas nativamente
- **E-commerces customizados** que não usam Nuvemshop, Shopify, etc
- **Plataformas proprietárias** que precisam de integração flexível

### Como Funciona?

```
┌──────────────────┐                ┌──────────────────┐
│  Sua Plataforma  │   Webhook      │     CartBack     │
│                  ├───────────────►│                  │
│  (E-commerce)    │   POST         │  (Processa)      │
└──────────────────┘                └────────┬─────────┘
                                             │
                                             ▼
                                    ┌────────────────┐
                                    │   WhatsApp     │
                                    │   (Mensagem)   │
                                    └────────────────┘
```

**Fluxo:**
1. Cliente abandona carrinho na sua loja
2. Sua plataforma detecta o abandono
3. Sua plataforma envia webhook para CartBack com dados do carrinho
4. CartBack processa e envia mensagem WhatsApp para o cliente
5. Cliente retorna ao carrinho e finaliza compra

---

## ⚙️ Configuração

### 1. Criar Webhook no CartBack

**Via Frontend:**
1. Login: http://localhost:5173 (ou URL de produção)
2. Ir em **Integrações**
3. Clicar em **"Configurar"** no card **Webhook Personalizado**
4. Preencher:
   - **Nome**: Ex: "Minha Loja Custom"
   - **URL da Plataforma** (opcional): Ex: "https://minhaloja.com"
5. Clicar em **"Criar"**

**Via API (cURL):**
```bash
curl -X POST 'http://localhost:3333/api/integrations/custom/create' \
  -H 'Authorization: Bearer SEU_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Minha Loja Custom",
    "platformUrl": "https://minhaloja.com"
  }'
```

### 2. Copiar Credenciais

Após criar, você receberá:

```json
{
  "success": true,
  "data": {
    "integration": {
      "id": 1,
      "name": "Minha Loja Custom",
      "webhookUrl": "http://localhost:3333/api/webhooks/custom/abc-123-uuid",
      "apiKey": "cwh_64charsrandomkey...",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "message": "Save this API Key securely. It will not be shown again."
  }
}
```

**⚠️ IMPORTANTE:**
- A **API Key** é mostrada apenas UMA VEZ
- Salve em local seguro (variável de ambiente, secrets manager, etc)
- Se perder, você precisará regenerar (invalida a anterior)

---

## 🔐 Autenticação

Todas as requisições ao webhook devem incluir o header:

```http
X-CartBack-API-Key: cwh_sua_api_key_aqui
```

**Exemplo:**
```bash
curl -X POST 'https://api.cartback.app/api/webhooks/custom/your-uuid' \
  -H 'X-CartBack-API-Key: cwh_64charsrandomkey...' \
  -H 'Content-Type: application/json' \
  -d '{...}'
```

### Segurança

- API Key usa **64 caracteres** aleatórios (`cwh_` + 64 hex)
- Validação protegida contra **timing attacks**
- HTTPS obrigatório em produção
- Se API Key vazar, regenere imediatamente no painel

---

## 📡 API Webhook

### Endpoint

```http
POST /api/webhooks/custom/{tenantUuid}
```

**URL Completa:**
```
http://localhost:3333/api/webhooks/custom/abc-123-uuid
```

### Headers

| Header | Valor | Obrigatório |
|--------|-------|-------------|
| `Content-Type` | `application/json` | ✅ |
| `X-CartBack-API-Key` | `cwh_your_key` | ✅ |

### Payload

#### Campos Obrigatórios

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `cart_id` | `string` | ID único do carrinho | `"cart_123456"` |
| `customer_phone` | `string` | Telefone do cliente (com ou sem código do país) | `"11999999999"` |

#### Campos Opcionais

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `customer_id` | `string` | ID do cliente | `"user_789"` |
| `customer_name` | `string` | Nome completo | `"João Silva"` |
| `customer_email` | `string` | Email | `"joao@email.com"` |
| `cart_url` | `string` | URL para recuperar carrinho | `"https://loja.com/cart/abc"` |
| `total_value` | `number` | Valor total | `299.90` |
| `currency` | `string` | Código da moeda (ISO 4217) | `"BRL"` |
| `items` | `array` | Produtos no carrinho | Ver abaixo |

#### Estrutura de `items`

```json
{
  "id": "prod_001",           // ID do produto (obrigatório)
  "name": "Camiseta Preta",   // Nome do produto (obrigatório)
  "price": 99.90,             // Preço unitário (obrigatório)
  "quantity": 2,              // Quantidade (obrigatório)
  "image_url": "https://..."  // URL da imagem (opcional)
}
```

### Exemplo Completo

```json
{
  "cart_id": "cart_123456",
  "customer_id": "user_789",
  "customer_name": "João Silva",
  "customer_email": "joao@email.com",
  "customer_phone": "11999999999",
  "cart_url": "https://minhaloja.com/cart/abc123",
  "total_value": 299.90,
  "currency": "BRL",
  "items": [
    {
      "id": "prod_001",
      "name": "Camiseta Preta",
      "price": 99.90,
      "quantity": 2,
      "image_url": "https://minhaloja.com/images/camiseta.jpg"
    },
    {
      "id": "prod_002",
      "name": "Calça Jeans",
      "price": 100.10,
      "quantity": 1,
      "image_url": "https://minhaloja.com/images/calca.jpg"
    }
  ]
}
```

### Resposta de Sucesso

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Webhook received and queued for processing",
  "cart_id": "cart_123456"
}
```

### Respostas de Erro

#### 401 Unauthorized - API Key inválida

```json
{
  "error": "Invalid API Key"
}
```

#### 400 Bad Request - Payload inválido

```json
{
  "error": "Invalid webhook payload",
  "details": "Missing required field: customer_phone"
}
```

#### 404 Not Found - Tenant não encontrado

```json
{
  "error": "Tenant not found"
}
```

---

## 📬 Webhook de Pedido Criado (Order Created)

### ⚠️ CRÍTICO: Por que este webhook é obrigatório?

Sem o webhook de pedido criado:
- ❌ Cliente compra mas **continua recebendo mensagens** de carrinho abandonado
- ❌ **Métricas de recuperação** não funcionam corretamente
- ❌ **Mensagens pendentes** não são canceladas
- ❌ Cliente fica **irritado com spam**

### 📊 Status do Carrinho: RECUPERADO vs CONCLUÍDO

O CartBack **automaticamente** diferencia dois tipos de conversão:

**🎯 RECUPERADO (recovered)**
- Cliente finalizou a compra **APÓS** receber mensagens do CartBack
- Indica que o CartBack **ajudou na conversão**
- Usado para calcular ROI e efetividade das mensagens

**✅ CONCLUÍDO (completed)**
- Cliente finalizou a compra **SEM** ter recebido mensagens do CartBack
- Cliente ia comprar de qualquer forma (conversão orgânica)
- Não conta como recuperação nas métricas

> **💡 Como funciona:** O sistema verifica se houve mensagens enviadas (status `sent`). Se sim, marca como RECUPERADO. Se não, marca como CONCLUÍDO.

### Endpoint

```http
POST /api/webhooks/custom/{tenantUuid}/order
```

**URL Completa:**
```
http://localhost:3333/api/webhooks/custom/abc-123-uuid/order
```

### Headers

| Header | Valor | Obrigatório |
|--------|-------|-------------|
| `Content-Type` | `application/json` | ✅ |
| `X-CartBack-API-Key` | `cwh_your_key` | ✅ |

### Payload

#### Campos Obrigatórios

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `order_id` ou `order_number` | `string` | ID ou número do pedido (um dos dois) | `"order_789"` |
| `customer_phone` ou `customer_email` | `string` | Telefone ou email (um dos dois) | `"11999999999"` |

#### Campos Opcionais

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `order_id` | `string` | ID interno do pedido | `"order_789"` |
| `order_number` | `string` | Número do pedido | `"#1234"` |
| `customer_id` | `string` | ID do cliente | `"user_789"` |
| `customer_name` | `string` | Nome completo | `"João Silva"` |
| `customer_email` | `string` | Email | `"joao@email.com"` |
| `customer_phone` | `string` | Telefone | `"11999999999"` |
| `total_value` | `number` | Valor total do pedido | `299.90` |
| `created_at` | `string` | Data de criação (ISO 8601) | `"2024-01-15T10:30:00Z"` |

### Exemplo Completo

```json
{
  "order_id": "order_789",
  "order_number": "#1234",
  "customer_id": "user_789",
  "customer_name": "João Silva",
  "customer_email": "joao@email.com",
  "customer_phone": "11999999999",
  "total_value": 299.90,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Resposta de Sucesso

**Status:** `200 OK`

```json
{
  "success": true,
  "recovered": 2,
  "message": "2 cart(s) marked as recovered"
}
```

### O que o CartBack faz ao receber este webhook:

1. ✅ Busca carrinhos **pending** do cliente (por telefone ou email)
2. ✅ Marca todos os carrinhos como **recovered**
3. ✅ **Cancela mensagens pendentes** na fila
4. ✅ Atualiza mensagens como **cancelled** no banco
5. ✅ Atualiza métricas de recuperação

### Quando enviar este webhook?

**Envie IMEDIATAMENTE quando:**
- ✅ Pedido é criado/confirmado
- ✅ Pagamento é aprovado (se aplicável)
- ✅ Cliente finaliza checkout

**Exemplo de fluxo:**
```javascript
// No seu e-commerce, ao finalizar pedido:
app.post('/checkout/complete', async (req, res) => {
  const order = await createOrder(req.body)

  // ✅ ENVIAR WEBHOOK PARA CARTBACK
  await notifyCartBackOrderCreated(order)

  res.json({ success: true, orderId: order.id })
})
```

---

---

## 📲 Disparo Direto de Mensagem WhatsApp

Além do fluxo de carrinho abandonado, você pode usar a mesma integração para **disparar mensagens WhatsApp avulsas** diretamente via webhook — sem precisar de nenhum carrinho ou template configurado.

### Casos de Uso

- Confirmação de pedido personalizada
- Notificação de entrega/rastreio
- Alertas e comunicados para clientes
- Qualquer mensagem pontual que precise enviar via WhatsApp

### Endpoint

```http
POST /api/webhooks/custom/{tenantUuid}/whatsapp/send
```

**URL Completa:**
```
http://localhost:3333/api/webhooks/custom/abc-123-uuid/whatsapp/send
```

### Headers

| Header | Valor | Obrigatório |
|--------|-------|-------------|
| `Content-Type` | `application/json` | ✅ |
| `X-CartBack-API-Key` | `cwh_your_key` | ✅ |

### Body

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `phone` | `string` | Número de destino (com ou sem código do país) | `"11999999999"` |
| `message` | `string` | Texto da mensagem a ser enviada | `"Seu pedido foi enviado!"` |

### Exemplo de Request

```json
{
  "phone": "11999999999",
  "message": "Olá João! Seu pedido #1234 foi despachado e chegará em até 3 dias úteis. 🚚"
}
```

### Resposta de Sucesso

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "phone": "11999999999",
    "instance": "cartback-tenant-1",
    "messageId": "3EB0A2C4F1D7B8E9A0F1"
  }
}
```

### Respostas de Erro

#### 422 Unprocessable Entity - WhatsApp desconectado

```json
{
  "error": "No connected WhatsApp instance found for this tenant"
}
```

#### 400 Bad Request - Campo faltando

```json
{
  "error": "O campo \"phone\" é obrigatório"
}
```

#### 500 Internal Server Error - Falha no envio

```json
{
  "error": "Failed to send WhatsApp message",
  "details": "Phone number not registered on WhatsApp"
}
```

### Exemplo cURL

```bash
curl -X POST 'http://localhost:3333/api/webhooks/custom/seu-uuid/whatsapp/send' \
  -H 'Content-Type: application/json' \
  -H 'X-CartBack-API-Key: cwh_sua_api_key_aqui' \
  -d '{
    "phone": "11999999999",
    "message": "Olá! Sua mensagem aqui."
  }'
```

### Exemplo Node.js

```javascript
async function sendWhatsappMessage(phone, message) {
  const response = await axios.post(
    'https://api.cartback.app/api/webhooks/custom/seu-uuid/whatsapp/send',
    { phone, message },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-CartBack-API-Key': process.env.CARTBACK_API_KEY
      }
    }
  )
  return response.data
}

// Exemplo: notificar entrega
await sendWhatsappMessage('11999999999', `Olá ${cliente.nome}! Seu pedido #${pedido.numero} foi entregue. Obrigado pela compra! 🎉`)
```

> **⚠️ Atenção:** O tenant precisa ter o WhatsApp conectado no painel do CartBack para que o disparo funcione. Se não houver instância conectada, a API retornará erro 422.

---

## 💻 Exemplos de Implementação

### Node.js (Express)

```javascript
const axios = require('axios')

// Função para enviar carrinho abandonado
async function sendAbandonedCart(cartData) {
  try {
    const response = await axios.post(
      'https://api.cartback.app/api/webhooks/custom/your-tenant-uuid',
      {
        cart_id: cartData.id,
        customer_name: cartData.customer.name,
        customer_email: cartData.customer.email,
        customer_phone: cartData.customer.phone,
        cart_url: `https://minhaloja.com/cart/${cartData.id}`,
        total_value: cartData.total,
        currency: 'BRL',
        items: cartData.items.map(item => ({
          id: item.product_id,
          name: item.product_name,
          price: item.price,
          quantity: item.quantity,
          image_url: item.image
        }))
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-CartBack-API-Key': process.env.CARTBACK_API_KEY
        }
      }
    )

    console.log('✅ CartBack webhook enviado:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ Erro ao enviar webhook:', error.response?.data || error.message)
    throw error
  }
}

// Função para notificar pedido criado
async function notifyOrderCreated(orderData) {
  try {
    const response = await axios.post(
      'https://api.cartback.app/api/webhooks/custom/your-tenant-uuid/order',
      {
        order_id: orderData.id,
        order_number: orderData.number,
        customer_name: orderData.customer.name,
        customer_email: orderData.customer.email,
        customer_phone: orderData.customer.phone,
        total_value: orderData.total,
        created_at: new Date().toISOString()
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-CartBack-API-Key': process.env.CARTBACK_API_KEY
        }
      }
    )

    console.log('✅ CartBack notificado sobre pedido:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ Erro ao notificar pedido:', error.response?.data || error.message)
    throw error
  }
}

// Exemplo de uso no seu e-commerce
app.post('/checkout/abandoned', async (req, res) => {
  const cart = req.body
  await sendAbandonedCart(cart)
  res.json({ success: true })
})

app.post('/checkout/complete', async (req, res) => {
  const order = await createOrder(req.body)

  // ✅ CRÍTICO: Notificar CartBack
  await notifyOrderCreated(order)

  res.json({ success: true, orderId: order.id })
})
```

### PHP (Laravel)

```php
<?php

use Illuminate\Support\Facades\Http;

class CartBackService
{
    private $webhookUrl;
    private $apiKey;

    public function __construct()
    {
        $this->webhookUrl = env('CARTBACK_WEBHOOK_URL');
        $this->apiKey = env('CARTBACK_API_KEY');
    }

    public function sendAbandonedCart(array $cartData): bool
    {
        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'X-CartBack-API-Key' => $this->apiKey,
        ])->post($this->webhookUrl, [
            'cart_id' => $cartData['id'],
            'customer_name' => $cartData['customer']['name'],
            'customer_email' => $cartData['customer']['email'],
            'customer_phone' => $cartData['customer']['phone'],
            'cart_url' => "https://minhaloja.com/cart/{$cartData['id']}",
            'total_value' => $cartData['total'],
            'currency' => 'BRL',
            'items' => array_map(function($item) {
                return [
                    'id' => $item['product_id'],
                    'name' => $item['product_name'],
                    'price' => $item['price'],
                    'quantity' => $item['quantity'],
                    'image_url' => $item['image'] ?? null,
                ];
            }, $cartData['items'])
        ]);

        if ($response->successful()) {
            \Log::info('✅ CartBack webhook enviado', $response->json());
            return true;
        }

        \Log::error('❌ Erro ao enviar webhook CartBack', [
            'status' => $response->status(),
            'body' => $response->body()
        ]);

        return false;
    }

    public function notifyOrderCreated(array $orderData): bool
    {
        $orderWebhookUrl = $this->webhookUrl . '/order';

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'X-CartBack-API-Key' => $this->apiKey,
        ])->post($orderWebhookUrl, [
            'order_id' => $orderData['id'],
            'order_number' => $orderData['number'],
            'customer_name' => $orderData['customer']['name'],
            'customer_email' => $orderData['customer']['email'],
            'customer_phone' => $orderData['customer']['phone'],
            'total_value' => $orderData['total'],
            'created_at' => now()->toIso8601String(),
        ]);

        if ($response->successful()) {
            \Log::info('✅ Pedido notificado ao CartBack', $response->json());
            return true;
        }

        \Log::error('❌ Erro ao notificar pedido', [
            'status' => $response->status(),
            'body' => $response->body()
        ]);

        return false;
    }
}

// Uso no controller
public function abandonedCart(Request $request)
{
    $cart = $request->all();
    $cartBackService = new CartBackService();
    $cartBackService->sendAbandonedCart($cart);
    return response()->json(['success' => true]);
}

public function orderComplete(Request $request)
{
    $order = Order::create($request->all());

    // ✅ CRÍTICO: Notificar CartBack
    $cartBackService = new CartBackService();
    $cartBackService->notifyOrderCreated($order->toArray());

    return response()->json(['success' => true, 'order_id' => $order->id]);
}
```

### Python (FastAPI)

```python
import os
import httpx
from typing import List, Optional
from pydantic import BaseModel

# Models
class CartItem(BaseModel):
    id: str
    name: str
    price: float
    quantity: int
    image_url: Optional[str] = None

class AbandonedCart(BaseModel):
    cart_id: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: str
    cart_url: Optional[str] = None
    total_value: Optional[float] = None
    currency: str = "BRL"
    items: List[CartItem] = []

# Service
class CartBackService:
    def __init__(self):
        self.webhook_url = os.getenv("CARTBACK_WEBHOOK_URL")
        self.api_key = os.getenv("CARTBACK_API_KEY")

    async def send_abandoned_cart(self, cart: AbandonedCart) -> bool:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.webhook_url,
                    json=cart.dict(),
                    headers={
                        "Content-Type": "application/json",
                        "X-CartBack-API-Key": self.api_key
                    }
                )
                response.raise_for_status()
                print(f"✅ CartBack webhook enviado: {response.json()}")
                return True
            except httpx.HTTPError as e:
                print(f"❌ Erro ao enviar webhook: {e}")
                return False

    async def notify_order_created(self, order_data: dict) -> bool:
        order_webhook_url = f"{self.webhook_url}/order"
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    order_webhook_url,
                    json={
                        "order_id": order_data.get("id"),
                        "order_number": order_data.get("number"),
                        "customer_name": order_data.get("customer", {}).get("name"),
                        "customer_email": order_data.get("customer", {}).get("email"),
                        "customer_phone": order_data.get("customer", {}).get("phone"),
                        "total_value": order_data.get("total"),
                        "created_at": datetime.now().isoformat()
                    },
                    headers={
                        "Content-Type": "application/json",
                        "X-CartBack-API-Key": self.api_key
                    }
                )
                response.raise_for_status()
                print(f"✅ Pedido notificado ao CartBack: {response.json()}")
                return True
            except httpx.HTTPError as e:
                print(f"❌ Erro ao notificar pedido: {e}")
                return False

# Uso na API
from fastapi import FastAPI
from datetime import datetime
app = FastAPI()
cartback = CartBackService()

@app.post("/cart/abandoned")
async def abandoned_cart(cart: AbandonedCart):
    await cartback.send_abandoned_cart(cart)
    return {"success": True}

@app.post("/order/complete")
async def order_complete(order: dict):
    # ✅ CRÍTICO: Notificar CartBack
    await cartback.notify_order_created(order)
    return {"success": True, "order_id": order.get("id")}
```

### cURL (Teste Manual)

```bash
curl -X POST 'http://localhost:3333/api/webhooks/custom/your-tenant-uuid' \
  -H 'Content-Type: application/json' \
  -H 'X-CartBack-API-Key: cwh_your_api_key_here' \
  -d '{
    "cart_id": "cart_test_001",
    "customer_name": "João Teste",
    "customer_email": "joao@teste.com",
    "customer_phone": "11999999999",
    "cart_url": "https://minhaloja.com/cart/test",
    "total_value": 299.90,
    "currency": "BRL",
    "items": [
      {
        "id": "prod_001",
        "name": "Produto Teste",
        "price": 299.90,
        "quantity": 1,
        "image_url": "https://placehold.co/600x400"
      }
    ]
  }'
```

---

## 🧪 Testes

### Passo 1: Criar Webhook

```bash
# Login no CartBack e pegar JWT token
TOKEN="seu_jwt_token_aqui"

# Criar webhook
curl -X POST 'http://localhost:3333/api/integrations/custom/create' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Teste Local",
    "platformUrl": "http://localhost:3000"
  }'

# Copiar: webhookUrl e apiKey da resposta
```

### Passo 2: Enviar Webhook de Teste

```bash
# Substituir pelos valores copiados
WEBHOOK_URL="http://localhost:3333/api/webhooks/custom/seu-uuid"
API_KEY="cwh_sua_api_key"

curl -X POST "$WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -H "X-CartBack-API-Key: $API_KEY" \
  -d '{
    "cart_id": "test_001",
    "customer_name": "Teste Local",
    "customer_phone": "11999999999",
    "total_value": 100.00
  }'
```

### Passo 3: Verificar Carrinho no Banco

```bash
docker exec cartback-mysql mysql -u cartback -pcartback cartback -e "
  SELECT id, external_cart_id, customer_name, customer_phone, status
  FROM abandoned_carts
  WHERE external_cart_id = 'test_001';
" 2>&1 | grep -v "Warning"
```

**Resultado esperado:**
```
id  external_cart_id  customer_name  customer_phone  status
1   test_001          Teste Local    11999999999     pending
```

### Passo 4: Testar Webhook de Pedido (Order)

```bash
# Enviar webhook de pedido criado
curl -X POST "$WEBHOOK_URL/order" \
  -H 'Content-Type: application/json' \
  -H "X-CartBack-API-Key: $API_KEY" \
  -d '{
    "order_id": "order_001",
    "order_number": "#1234",
    "customer_name": "Teste Local",
    "customer_phone": "11999999999",
    "total_value": 100.00
  }'
```

**Logs esperados:**
```bash
[Custom Webhook] Recebido webhook de pedido (tenant: uuid-123)
[Custom Webhook] ✅ API Key validada
[Custom Webhook] Pedido #1234: Teste Local - 11999999999
[Custom Webhook] ✅ Carrinho 1 marcado como recuperado
```

### Passo 5: Verificar Carrinho Recuperado

```bash
docker exec cartback-mysql mysql -u cartback -pcartback cartback -e "
  SELECT id, external_cart_id, status, recovered_at
  FROM abandoned_carts
  WHERE id = 1;
" 2>&1 | grep -v "Warning"
```

**Resultado esperado:**
```
id  external_cart_id  status      recovered_at
1   test_001          recovered   2024-01-15 10:45:00
```

---

## 📊 Fluxo Completo (Com 2 Webhooks)

### Fluxo Ideal - Sistema Funcionando 100%

```
1. ✅ Cliente abandona carrinho na sua loja
   └─► Sua loja detecta abandono (timeout, inatividade, etc)

2. ✅ Sua loja envia WEBHOOK #1: Carrinho Abandonado
   POST /api/webhooks/custom/{uuid}
   └─► CartBack salva carrinho (status: pending)
   └─► CartBack adiciona job na fila

3. ✅ CartBack processa fila
   └─► Envia mensagem WhatsApp para cliente
   └─► Aguarda resposta...

4. ✅ Cliente recebe WhatsApp
   └─► Clica no link do carrinho
   └─► Retorna ao checkout

5. ✅ Cliente finaliza pedido na sua loja
   └─► Sua loja processa pagamento

6. ✅ Sua loja envia WEBHOOK #2: Pedido Criado 🚨 CRÍTICO
   POST /api/webhooks/custom/{uuid}/order
   └─► CartBack busca carrinhos pending do cliente
   └─► Marca como "recovered"
   └─► CANCELA mensagens pendentes na fila
   └─► Cliente NÃO recebe mais mensagens ✅

7. ✅ Métricas atualizadas
   └─► Dashboard mostra recuperação
   └─► ROI calculado corretamente
```

### ⚠️ O que acontece SEM o webhook de order:

```
1. ✅ Cliente abandona carrinho
2. ✅ CartBack envia mensagem 1
3. ✅ Cliente compra
4. ❌ CartBack NÃO sabe que comprou
5. ❌ CartBack envia mensagem 2 (SPAM!)
6. ❌ CartBack envia mensagem 3 (SPAM!)
7. ❌ Cliente irritado 😡
8. ❌ Métricas erradas
```

### ✅ Implementação Mínima Obrigatória:

**No seu e-commerce, você DEVE ter:**

```javascript
// 1. Detectar carrinho abandonado (exemplo: 15min de inatividade)
setInterval(() => {
  const abandonedCarts = detectAbandonedCarts()
  for (const cart of abandonedCarts) {
    sendWebhookToCartBack(cart) // ✅ Webhook #1
  }
}, 60000) // A cada 1 minuto

// 2. Ao finalizar pedido
app.post('/checkout/complete', async (req, res) => {
  const order = await createOrder(req.body)

  // ✅ Webhook #2 - OBRIGATÓRIO!
  await notifyCartBackOrderCreated(order)

  res.json({ success: true })
})
```

---

## 🐛 Troubleshooting

### Erro: "Invalid API Key"

**Causa:** API Key incorreta ou ausente

**Soluções:**
1. Verificar se o header `X-CartBack-API-Key` está presente
2. Confirmar que a API Key começa com `cwh_`
3. Verificar se não há espaços ou quebras de linha na key
4. Se necessário, regenerar a API Key no painel

```bash
# Testar com curl verbose
curl -v -X POST "$WEBHOOK_URL" \
  -H "X-CartBack-API-Key: $API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"cart_id":"test","customer_phone":"11999999999"}'
```

---

### Erro: "Missing required field: customer_phone"

**Causa:** Campo obrigatório ausente no payload

**Solução:**
```json
{
  "cart_id": "...",        // ✅ Obrigatório
  "customer_phone": "..."  // ✅ Obrigatório
}
```

Telefone pode ser:
- `"11999999999"` → Será normalizado para `5511999999999`
- `"5511999999999"` → OK
- `"+55 11 99999-9999"` → Será limpo e normalizado

---

### Erro: "Tenant not found"

**Causa:** UUID do tenant incorreto na URL

**Solução:**
1. Verificar URL do webhook no painel
2. Copiar URL completa (não montar manualmente)
3. UUID deve ser do formato: `abc-123-xyz`

```bash
# Ver webhook URL cadastrada
curl -X GET 'http://localhost:3333/api/integrations/custom/1' \
  -H "Authorization: Bearer $TOKEN"
```

---

### Webhook não aparece no banco

**Verificar:**

1. **API Key válida?**
   - Logs devem mostrar: `✅ API Key validada`

2. **Telefone válido?**
   - Precisa ter pelo menos 10 dígitos

3. **Integração ativa?**
   ```bash
   docker exec cartback-mysql mysql -u cartback -pcartback cartback -e "
     SELECT id, platform, is_active FROM store_integrations WHERE platform = 'webhook';
   " 2>&1 | grep -v "Warning"
   ```

4. **Job foi enfileirado?**
   - Logs devem mostrar: `✅ Carrinho XXX adicionado à fila`

---

## 📊 Fluxo Completo

```
1. ✅ Cliente abandona carrinho na sua loja
2. ✅ Sua loja detecta abandono (evento, timeout, etc)
3. ✅ Sua loja envia POST para webhook CartBack com API Key
4. ✅ CartBack valida API Key
5. ✅ CartBack valida payload (campos obrigatórios)
6. ✅ CartBack salva carrinho no banco
7. ✅ CartBack adiciona job na fila de processamento
8. ✅ Worker processa job e envia mensagem WhatsApp
9. ✅ Cliente recebe mensagem
10. ✅ Cliente clica no link do carrinho
11. ✅ Cliente finaliza compra
12. ✅ Sua loja notifica CartBack (webhook de pedido - futuro)
```

---

## 🔄 Regenerar API Key

Se a API Key vazar ou você perder acesso:

**Via Frontend:**
1. Ir em **Integrações**
2. Clicar em **"Ver Detalhes"** no webhook
3. Clicar no ícone **🔄 Refresh** ao lado de "API Key"
4. Copiar nova key
5. Atualizar sua aplicação

**Via API:**
```bash
curl -X POST 'http://localhost:3333/api/integrations/custom/1/regenerate-key' \
  -H "Authorization: Bearer $TOKEN"
```

**⚠️ Importante:**
- A API Key antiga será IMEDIATAMENTE invalidada
- Atualize sua aplicação o quanto antes
- Webhooks com key antiga retornarão 401

---

## 📚 Referências

- **API CartBack**: http://localhost:3333/api/webhooks/custom/docs
- **Repositório**: https://github.com/cartback/cartback
- **Suporte**: suporte@cartback.com

---

## ✅ Checklist de Implementação

- [ ] Webhook criado no CartBack
- [ ] API Key salva com segurança (variável de ambiente)
- [ ] Código implementado para detectar carrinhos abandonados
- [ ] Código implementado para enviar webhook
- [ ] Tratamento de erros implementado
- [ ] Retry logic implementado (recomendado)
- [ ] Logs configurados
- [ ] Testado em ambiente de desenvolvimento
- [ ] Testado em staging
- [ ] Deploy em produção
- [ ] Monitoramento configurado

---

**🎉 Integração concluída! Sua plataforma agora está conectada ao CartBack.**
