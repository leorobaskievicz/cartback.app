import axios, { AxiosInstance } from 'axios'
import env from '#start/env'
import crypto from 'crypto'

/**
 * Tokens OAuth retornados pela Nuvemshop
 */
interface NuvemshopTokens {
  access_token: string
  token_type: string
  scope: string
  user_id: number
}

/**
 * Informações da loja
 */
interface NuvemshopStore {
  id: number
  name: string
  description: string
  url_with_protocol: string
  main_currency: string
  main_language: string
  contact_email: string
  phone: string
  logo: { url: string } | null
}

/**
 * Webhook configurado
 */
interface NuvemshopWebhook {
  id: number
  url: string
  event: string
  created_at: string
  updated_at: string
}

/**
 * Carrinho abandonado
 */
interface AbandonedCheckout {
  id: number
  token: string
  store_id: number
  customer: {
    id: number
    name: string
    email: string
    phone: string
  } | null
  contact_email: string
  contact_phone: string
  contact_name: string
  checkout_url: string
  subtotal: string
  total: string
  currency: string
  products: Array<{
    product_id: number
    variant_id: number
    name: string
    price: string
    quantity: number
    image: { url: string } | null
  }>
  created_at: string
  updated_at: string
}

/**
 * Pedido da Nuvemshop
 */
interface NuvemshopOrder {
  id: number
  number: number
  token: string
  store_id: number
  customer: {
    id: number
    name: string
    email: string
    phone: string
  }
  total: string
  subtotal: string
  currency: string
  status: string
  payment_status: string
  created_at: string
  updated_at: string
}

/**
 * Service para integração com Nuvemshop (TiendaNube)
 * Documentação: https://tiendanube.github.io/api-documentation/
 */
class NuvemshopService {
  private appId: string
  private appSecret: string
  private redirectUri: string
  private baseAuthUrl = 'https://www.tiendanube.com/apps/authorize/token'

  constructor() {
    this.appId = env.get('NUVEMSHOP_APP_ID', '')
    this.appSecret = env.get('NUVEMSHOP_APP_SECRET', '')
    this.redirectUri = env.get('NUVEMSHOP_REDIRECT_URI', '')
  }

  /**
   * Gera URL de autorização OAuth para iniciar o fluxo
   *
   * Scopes disponíveis:
   * - read_orders: Ler pedidos
   * - read_customers: Ler clientes
   * - read_products: Ler produtos
   * - write_orders: Criar/atualizar pedidos
   * - write_customers: Criar/atualizar clientes
   */
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'read_orders read_customers read_products write_orders',
      state,
    })

    return `https://www.tiendanube.com/apps/${this.appId}/authorize?${params.toString()}`
  }

  /**
   * Troca código de autorização por access token
   *
   * @param code - Código recebido no callback OAuth
   * @returns Tokens de acesso e informações do usuário
   */
  async exchangeCode(code: string): Promise<NuvemshopTokens> {
    const response = await axios.post(
      this.baseAuthUrl,
      {
        client_id: this.appId,
        client_secret: this.appSecret,
        grant_type: 'authorization_code',
        code,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )

    return response.data
  }

  /**
   * Cria cliente autenticado para fazer chamadas à API
   * da loja específica
   */
  private createClient(storeId: number | string, accessToken: string): AxiosInstance {
    return axios.create({
      baseURL: `https://api.tiendanube.com/v1/${storeId}`,
      headers: {
        Authentication: `bearer ${accessToken}`,
        'User-Agent': 'Cartback (suporte@cartback.app)',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })
  }

  /**
   * Busca informações da loja
   */
  async getStoreInfo(storeId: number, accessToken: string): Promise<NuvemshopStore> {
    const client = this.createClient(storeId, accessToken)
    const response = await client.get('/store')
    return response.data
  }

  /**
   * Lista todos os webhooks configurados
   */
  async listWebhooks(storeId: number, accessToken: string): Promise<NuvemshopWebhook[]> {
    const client = this.createClient(storeId, accessToken)
    const response = await client.get('/webhooks')
    return response.data
  }

  /**
   * Cria webhook para carrinhos abandonados
   * Se já existir, retorna o existente
   */
  async createAbandonedCartWebhook(
    storeId: number,
    accessToken: string,
    webhookUrl: string
  ): Promise<NuvemshopWebhook> {
    const client = this.createClient(storeId, accessToken)

    // Verificar se já existe
    const existing = await this.listWebhooks(storeId, accessToken)
    const abandonedWebhook = existing.find(
      (w) => w.event === 'cart/abandoned' && w.url === webhookUrl
    )

    if (abandonedWebhook) {
      console.log(`[Nuvemshop] Webhook cart/abandoned já existe (ID: ${abandonedWebhook.id})`)
      return abandonedWebhook
    }

    // Criar novo
    const response = await client.post('/webhooks', {
      url: webhookUrl,
      event: 'cart/abandoned',
    })

    console.log(`[Nuvemshop] Webhook cart/abandoned criado (ID: ${response.data.id})`)
    return response.data
  }

  /**
   * Cria webhook para pedidos criados (para detectar recuperação)
   * Se já existir, retorna o existente
   */
  async createOrderWebhook(
    storeId: number,
    accessToken: string,
    webhookUrl: string
  ): Promise<NuvemshopWebhook> {
    const client = this.createClient(storeId, accessToken)

    const existing = await this.listWebhooks(storeId, accessToken)
    const orderWebhook = existing.find((w) => w.event === 'order/created' && w.url === webhookUrl)

    if (orderWebhook) {
      console.log(`[Nuvemshop] Webhook order/created já existe (ID: ${orderWebhook.id})`)
      return orderWebhook
    }

    const response = await client.post('/webhooks', {
      url: webhookUrl,
      event: 'order/created',
    })

    console.log(`[Nuvemshop] Webhook order/created criado (ID: ${response.data.id})`)
    return response.data
  }

  /**
   * Remove webhook
   */
  async deleteWebhook(storeId: number, accessToken: string, webhookId: number): Promise<void> {
    const client = this.createClient(storeId, accessToken)
    await client.delete(`/webhooks/${webhookId}`)
    console.log(`[Nuvemshop] Webhook ${webhookId} removido`)
  }

  /**
   * Busca carrinho abandonado específico
   */
  async getAbandonedCheckout(
    storeId: number,
    accessToken: string,
    checkoutId: number
  ): Promise<AbandonedCheckout> {
    const client = this.createClient(storeId, accessToken)
    const response = await client.get(`/checkouts/${checkoutId}`)
    return response.data
  }

  /**
   * Lista carrinhos abandonados com paginação
   */
  async listAbandonedCheckouts(
    storeId: number,
    accessToken: string,
    params?: { since_id?: number; created_at_min?: string; page?: number }
  ): Promise<AbandonedCheckout[]> {
    const client = this.createClient(storeId, accessToken)
    const response = await client.get('/checkouts', { params })
    return response.data
  }

  /**
   * Busca pedido por ID
   */
  async getOrder(
    storeId: number,
    accessToken: string,
    orderId: number
  ): Promise<NuvemshopOrder> {
    const client = this.createClient(storeId, accessToken)
    const response = await client.get(`/orders/${orderId}`)
    return response.data
  }

  /**
   * Valida assinatura do webhook usando HMAC-SHA256
   *
   * A Nuvemshop envia a assinatura no header X-Linkedstore-HMAC-SHA256
   * calculada a partir do payload JSON + app_secret
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.appSecret)
      .update(payload)
      .digest('hex')

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  }

  /**
   * Extrai dados relevantes do webhook de carrinho abandonado
   * para formato padronizado
   */
  parseAbandonedCartWebhook(payload: any): {
    checkoutId: number
    storeId: number
    customerName: string | null
    customerEmail: string | null
    customerPhone: string | null
    checkoutUrl: string
    total: number
    currency: string
    products: any[]
  } {
    return {
      checkoutId: payload.id,
      storeId: payload.store_id,
      customerName: payload.contact_name || payload.customer?.name || null,
      customerEmail: payload.contact_email || payload.customer?.email || null,
      customerPhone: payload.contact_phone || payload.customer?.phone || null,
      checkoutUrl: payload.checkout_url || payload.recovery_url || '',
      total: parseFloat(payload.total) || 0,
      currency: payload.currency || 'BRL',
      products: (payload.products || []).map((p: any) => ({
        id: p.product_id,
        variantId: p.variant_id,
        name: p.name,
        price: parseFloat(p.price) || 0,
        quantity: p.quantity || 1,
        image: p.image?.url || null,
      })),
    }
  }

  /**
   * Extrai dados relevantes do webhook de pedido criado
   */
  parseOrderWebhook(payload: any): {
    orderId: number
    orderNumber: number
    storeId: number
    customerName: string | null
    customerEmail: string | null
    customerPhone: string | null
    total: number
    status: string
  } {
    return {
      orderId: payload.id,
      orderNumber: payload.number,
      storeId: payload.store_id,
      customerName: payload.customer?.name || null,
      customerEmail: payload.customer?.email || payload.contact_email || null,
      customerPhone: payload.customer?.phone || payload.contact_phone || null,
      total: parseFloat(payload.total) || 0,
      status: payload.status || 'unknown',
    }
  }
}

// Exportar como singleton
export default new NuvemshopService()
