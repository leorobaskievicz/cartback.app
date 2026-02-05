import axios, { AxiosInstance } from 'axios'
import env from '#start/env'

export interface AsaasCustomer {
  id: string
  name: string
  email: string
  cpfCnpj: string
  phone?: string
}

export interface AsaasSubscription {
  id: string
  customer: string
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO'
  value: number
  nextDueDate: string
  status: string
  cycle: 'MONTHLY'
}

export interface AsaasPayment {
  id: string
  customer: string
  subscription?: string
  value: number
  status: string
  billingType: string
  invoiceUrl: string
  dueDate: string
  pixQrCodeId?: string
  pixCopiaECola?: string
}

export interface CreditCardData {
  holderName: string // Nome impresso no cartão
  number: string // Número do cartão (sem espaços)
  expiryMonth: string // Mês de validade (MM)
  expiryYear: string // Ano de validade (YYYY)
  ccv: string // Código de segurança
}

export interface CreditCardToken {
  creditCardNumber: string
  creditCardBrand: string
  creditCardToken: string
}

export interface CreditCardHolderInfo {
  name: string
  email: string
  cpfCnpj: string
  postalCode: string
  addressNumber: string
  addressComplement?: string
  phone: string
}

class AsaasService {
  private client: AxiosInstance
  private baseUrl: string

  constructor() {
    const environment = env.get('ASAAS_ENVIRONMENT')
    this.baseUrl =
      environment === 'production'
        ? 'https://api.asaas.com/v3'
        : 'https://sandbox.asaas.com/api/v3'

    // Add $ prefix to API key (stored without $ in .env to avoid shell variable expansion)
    const keyFromEnv = env.get('ASAAS_API_KEY')
    const apiKey = '$' + keyFromEnv
    console.log('🔑 Asaas API Key loaded:', apiKey.substring(0, 20) + '...')
    console.log('🌐 Asaas Environment:', environment)
    console.log('🔗 Asaas Base URL:', this.baseUrl)

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        access_token: apiKey,
      },
    })
  }

  // ========== CUSTOMERS ==========

  async createCustomer(data: {
    name: string
    email: string
    cpfCnpj: string
    phone?: string
    externalReference?: string // tenantId
  }): Promise<AsaasCustomer> {
    const response = await this.client.post('/customers', data)
    return response.data
  }

  async getCustomer(customerId: string): Promise<AsaasCustomer> {
    const response = await this.client.get(`/customers/${customerId}`)
    return response.data
  }

  async findCustomerByEmail(email: string): Promise<AsaasCustomer | null> {
    const response = await this.client.get('/customers', { params: { email } })
    return response.data.data?.[0] || null
  }

  async updateCustomer(
    customerId: string,
    data: Partial<AsaasCustomer>
  ): Promise<AsaasCustomer> {
    const response = await this.client.put(`/customers/${customerId}`, data)
    return response.data
  }

  // ========== SUBSCRIPTIONS ==========

  async createSubscription(data: {
    customer: string // customer ID
    billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO'
    value: number // em reais (não centavos)
    nextDueDate: string // YYYY-MM-DD
    cycle: 'MONTHLY'
    description: string
    externalReference?: string // subscriptionId interno
  }): Promise<AsaasSubscription> {
    const response = await this.client.post('/subscriptions', data)
    return response.data
  }

  async getSubscription(subscriptionId: string): Promise<AsaasSubscription> {
    const response = await this.client.get(`/subscriptions/${subscriptionId}`)
    return response.data
  }

  async updateSubscription(
    subscriptionId: string,
    data: {
      value?: number
      billingType?: 'PIX' | 'CREDIT_CARD' | 'BOLETO'
    }
  ): Promise<AsaasSubscription> {
    const response = await this.client.put(`/subscriptions/${subscriptionId}`, data)
    return response.data
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.client.delete(`/subscriptions/${subscriptionId}`)
  }

  // ========== PAYMENTS ==========

  async getPayment(paymentId: string): Promise<AsaasPayment> {
    const response = await this.client.get(`/payments/${paymentId}`)
    return response.data
  }

  async getPaymentPixQrCode(
    paymentId: string
  ): Promise<{ encodedImage: string; payload: string }> {
    const response = await this.client.get(`/payments/${paymentId}/pixQrCode`)
    return response.data
  }

  async listSubscriptionPayments(subscriptionId: string): Promise<AsaasPayment[]> {
    const response = await this.client.get('/payments', {
      params: { subscription: subscriptionId },
    })
    return response.data.data
  }

  // ========== CREDIT CARD ==========

  /**
   * Tokeniza um cartão de crédito
   * Retorna um token seguro que pode ser usado para criar cobranças
   */
  async tokenizeCreditCard(
    customer: string,
    creditCard: CreditCardData,
    holderInfo: CreditCardHolderInfo
  ): Promise<CreditCardToken> {
    const response = await this.client.post('/creditCard/tokenize', {
      customer,
      creditCard: {
        holderName: creditCard.holderName,
        number: creditCard.number,
        expiryMonth: creditCard.expiryMonth,
        expiryYear: creditCard.expiryYear,
        ccv: creditCard.ccv,
      },
      creditCardHolderInfo: holderInfo,
    })
    return response.data
  }

  /**
   * Cria uma subscription com pagamento por cartão de crédito
   */
  async createSubscriptionWithCreditCard(data: {
    customer: string
    value: number
    nextDueDate: string
    description: string
    creditCardToken: string
    creditCardHolderInfo: CreditCardHolderInfo
    externalReference?: string
  }): Promise<AsaasSubscription> {
    const response = await this.client.post('/subscriptions', {
      customer: data.customer,
      billingType: 'CREDIT_CARD',
      value: data.value,
      nextDueDate: data.nextDueDate,
      cycle: 'MONTHLY',
      description: data.description,
      externalReference: data.externalReference,
      creditCard: {
        creditCardToken: data.creditCardToken,
      },
      creditCardHolderInfo: data.creditCardHolderInfo,
    })
    return response.data
  }

  // ========== WEBHOOKS ==========

  validateWebhookSignature(token: string): boolean {
    return token === env.get('ASAAS_WEBHOOK_TOKEN')
  }
}

export default new AsaasService()
