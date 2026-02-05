import { randomBytes } from 'crypto'
import crypto from 'crypto'

/**
 * Serviço para gerenciar integração webhook personalizada
 * Permite que desenvolvedores enviem seus próprios dados de carrinhos abandonados
 */
class CustomWebhookService {
  /**
   * Gera um API key único para autenticação de webhooks
   */
  generateApiKey(): string {
    return `cwh_${randomBytes(32).toString('hex')}`
  }

  /**
   * Valida API key do webhook
   */
  validateApiKey(providedKey: string, storedKey: string): boolean {
    if (!providedKey || !storedKey) {
      return false
    }

    // Comparação segura contra timing attacks
    return crypto.timingSafeEqual(Buffer.from(providedKey), Buffer.from(storedKey))
  }

  /**
   * Valida e parseia payload do webhook
   */
  parseWebhookPayload(payload: any): ParsedWebhookData {
    // Validações obrigatórias
    if (!payload.cart_id) {
      throw new Error('Missing required field: cart_id')
    }

    if (!payload.customer_phone) {
      throw new Error('Missing required field: customer_phone')
    }

    // Normalizar telefone (remover caracteres especiais)
    const phone = this.normalizePhone(payload.customer_phone)

    if (!phone) {
      throw new Error('Invalid customer_phone format')
    }

    // Validar items se fornecido
    let items = null
    if (payload.items && Array.isArray(payload.items)) {
      items = payload.items.map((item: any) => ({
        id: item.id || item.product_id,
        name: item.name || item.product_name,
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 1,
        image: item.image_url || item.image || null,
      }))
    }

    // Validar total
    let totalValue = null
    if (payload.total_value !== undefined && payload.total_value !== null) {
      totalValue = parseFloat(String(payload.total_value))
      if (isNaN(totalValue)) {
        throw new Error('Invalid total_value format')
      }
    }

    return {
      cartId: String(payload.cart_id),
      customerId: payload.customer_id ? String(payload.customer_id) : null,
      customerName: payload.customer_name || null,
      customerEmail: payload.customer_email || null,
      customerPhone: phone,
      cartUrl: payload.cart_url || payload.checkout_url || null,
      totalValue,
      currency: payload.currency || 'BRL',
      items,
    }
  }

  /**
   * Normaliza telefone: remove caracteres especiais e valida formato
   */
  private normalizePhone(phone: string): string | null {
    if (!phone) return null

    // Remover tudo exceto números e +
    let normalized = phone.replace(/[^\d+]/g, '')

    // Se começar com +, manter. Caso contrário, adicionar +55 se tiver 10-11 dígitos
    if (!normalized.startsWith('+')) {
      // Se tiver 10-11 dígitos, assumir Brasil
      if (normalized.length >= 10 && normalized.length <= 11) {
        normalized = `55${normalized}`
      }
    } else {
      // Remover + para padronizar
      normalized = normalized.substring(1)
    }

    // Validar se tem pelo menos 10 dígitos
    if (normalized.length < 10) {
      return null
    }

    return normalized
  }

  /**
   * Valida e parseia payload de pedido criado (order)
   */
  parseOrderWebhook(payload: any): ParsedOrderData {
    // Validações obrigatórias
    if (!payload.order_id && !payload.order_number) {
      throw new Error('Missing required field: order_id or order_number')
    }

    // Pelo menos um identificador do cliente é obrigatório
    if (!payload.customer_phone && !payload.customer_email) {
      throw new Error('At least one customer identifier required: customer_phone or customer_email')
    }

    // Normalizar telefone se fornecido
    let phone = null
    if (payload.customer_phone) {
      phone = this.normalizePhone(payload.customer_phone)
    }

    return {
      orderId: payload.order_id ? String(payload.order_id) : null,
      orderNumber: payload.order_number ? String(payload.order_number) : null,
      customerId: payload.customer_id ? String(payload.customer_id) : null,
      customerName: payload.customer_name || null,
      customerEmail: payload.customer_email || null,
      customerPhone: phone,
      totalValue: payload.total_value ? parseFloat(String(payload.total_value)) : null,
      createdAt: payload.created_at || new Date().toISOString(),
    }
  }

  /**
   * Gera documentação completa da API
   */
  getPayloadDocumentation(): FullWebhookDocumentation {
    return {
      abandoned_cart: {
        title: 'Webhook de Carrinho Abandonado',
        endpoint: 'POST /api/webhooks/custom/{tenantUuid}',
        description: 'Envia dados de um carrinho abandonado para processamento',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CartBack-API-Key': 'cwh_your_api_key_here',
        },
        required_fields: {
          cart_id: 'string - ID único do carrinho na sua plataforma',
          customer_phone: 'string - Telefone do cliente (com ou sem código do país)',
        },
        optional_fields: {
          customer_id: 'string - ID do cliente na sua plataforma',
          customer_name: 'string - Nome completo do cliente',
          customer_email: 'string - Email do cliente',
          cart_url: 'string - URL para retornar ao carrinho',
          total_value: 'number - Valor total do carrinho',
          currency: 'string - Código da moeda (padrão: BRL)',
          items: 'array - Lista de produtos no carrinho',
        },
        example_payload: {
          cart_id: 'cart_123456',
          customer_id: 'user_789',
          customer_name: 'João Silva',
          customer_email: 'joao@email.com',
          customer_phone: '11999999999',
          cart_url: 'https://minhaloja.com/cart/abc123',
          total_value: 299.9,
          currency: 'BRL',
          items: [
            {
              id: 'prod_001',
              name: 'Camiseta Preta',
              price: 99.9,
              quantity: 2,
              image_url: 'https://minhaloja.com/images/camiseta.jpg',
            },
          ],
        },
      },
      order_created: {
        title: 'Webhook de Pedido Criado (OBRIGATÓRIO)',
        endpoint: 'POST /api/webhooks/custom/{tenantUuid}/order',
        description:
          '🚨 CRÍTICO: Notifica quando um pedido é criado. O sistema automaticamente distingue entre:\n• RECUPERADO: Cliente finalizou após receber mensagens do CartBack (conversão assistida)\n• CONCLUÍDO: Cliente finalizou sozinho sem receber mensagens (conversão orgânica)',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CartBack-API-Key': 'cwh_your_api_key_here',
        },
        required_fields: {
          'order_id ou order_number':
            'string - ID ou número do pedido (pelo menos um é obrigatório)',
          'customer_phone ou customer_email':
            'string - Telefone ou email (pelo menos um é obrigatório)',
        },
        optional_fields: {
          order_id: 'string - ID interno do pedido',
          order_number: 'string - Número do pedido (#1234)',
          customer_id: 'string - ID do cliente',
          customer_name: 'string - Nome completo',
          customer_email: 'string - Email',
          customer_phone: 'string - Telefone',
          total_value: 'number - Valor total do pedido',
          created_at: 'string - Data de criação (ISO 8601)',
        },
        example_payload: {
          order_id: 'order_789',
          order_number: '#1234',
          customer_name: 'João Silva',
          customer_email: 'joao@email.com',
          customer_phone: '11999999999',
          total_value: 299.9,
          created_at: '2024-01-15T10:30:00Z',
        },
      },
      examples: {
        nodejs: `// Enviar carrinho abandonado
const axios = require('axios')

async function sendAbandonedCart(cart) {
  await axios.post('https://api.cartback.app/api/webhooks/custom/YOUR_UUID', {
    cart_id: cart.id,
    customer_phone: cart.customer.phone,
    customer_name: cart.customer.name,
    total_value: cart.total,
    items: cart.items
  }, {
    headers: { 'X-CartBack-API-Key': process.env.CARTBACK_API_KEY }
  })
}

// 🚨 OBRIGATÓRIO: Enviar quando pedido for criado
async function notifyOrderCreated(order) {
  await axios.post('https://api.cartback.app/api/webhooks/custom/YOUR_UUID/order', {
    order_id: order.id,
    customer_phone: order.customer.phone,
    total_value: order.total
  }, {
    headers: { 'X-CartBack-API-Key': process.env.CARTBACK_API_KEY }
  })
}`,
        php: `<?php
// Enviar carrinho abandonado
function sendAbandonedCart($cart) {
    $response = Http::withHeaders([
        'X-CartBack-API-Key' => env('CARTBACK_API_KEY')
    ])->post('https://api.cartback.app/api/webhooks/custom/YOUR_UUID', [
        'cart_id' => $cart['id'],
        'customer_phone' => $cart['customer']['phone'],
        'total_value' => $cart['total']
    ]);
    return $response->successful();
}

// 🚨 OBRIGATÓRIO: Enviar quando pedido for criado
function notifyOrderCreated($order) {
    $response = Http::withHeaders([
        'X-CartBack-API-Key' => env('CARTBACK_API_KEY')
    ])->post('https://api.cartback.app/api/webhooks/custom/YOUR_UUID/order', [
        'order_id' => $order['id'],
        'customer_phone' => $order['customer']['phone']
    ]);
    return $response->successful();
}`,
        python: `import httpx
import os

# Enviar carrinho abandonado
async def send_abandoned_cart(cart):
    async with httpx.AsyncClient() as client:
        await client.post(
            'https://api.cartback.app/api/webhooks/custom/YOUR_UUID',
            json={
                'cart_id': cart['id'],
                'customer_phone': cart['customer']['phone'],
                'total_value': cart['total']
            },
            headers={'X-CartBack-API-Key': os.getenv('CARTBACK_API_KEY')}
        )

# 🚨 OBRIGATÓRIO: Enviar quando pedido for criado
async def notify_order_created(order):
    async with httpx.AsyncClient() as client:
        await client.post(
            'https://api.cartback.app/api/webhooks/custom/YOUR_UUID/order',
            json={
                'order_id': order['id'],
                'customer_phone': order['customer']['phone']
            },
            headers={'X-CartBack-API-Key': os.getenv('CARTBACK_API_KEY')}
        )`,
        curl: `# 1. Enviar carrinho abandonado
curl -X POST 'https://api.cartback.app/api/webhooks/custom/YOUR_UUID' \\
  -H 'Content-Type: application/json' \\
  -H 'X-CartBack-API-Key: YOUR_API_KEY' \\
  -d '{"cart_id":"cart_123","customer_phone":"11999999999"}'

# 2. 🚨 OBRIGATÓRIO: Enviar quando pedido criado
curl -X POST 'https://api.cartback.app/api/webhooks/custom/YOUR_UUID/order' \\
  -H 'Content-Type: application/json' \\
  -H 'X-CartBack-API-Key: YOUR_API_KEY' \\
  -d '{"order_id":"order_789","customer_phone":"11999999999"}'`,
      },
    }
  }
}

// Types
export interface ParsedWebhookData {
  cartId: string
  customerId: string | null
  customerName: string | null
  customerEmail: string | null
  customerPhone: string
  cartUrl: string | null
  totalValue: number | null
  currency: string
  items: any[] | null
}

export interface ParsedOrderData {
  orderId: string | null
  orderNumber: string | null
  customerId: string | null
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  totalValue: number | null
  createdAt: string
}

export interface WebhookDocumentation {
  title: string
  endpoint: string
  description: string
  method: string
  headers: Record<string, string>
  required_fields: Record<string, string>
  optional_fields: Record<string, string>
  example_payload: Record<string, any>
}

export interface FullWebhookDocumentation {
  abandoned_cart: WebhookDocumentation
  order_created: WebhookDocumentation
  examples: {
    nodejs: string
    php: string
    python: string
    curl: string
  }
}

export default new CustomWebhookService()
