import axios, { AxiosInstance, AxiosError } from 'axios'
import type { TemplateComponent } from '#models/whatsapp_official_template'

const META_API_VERSION = 'v21.0'
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`

export interface MetaCredentials {
  phoneNumberId: string
  wabaId: string
  accessToken: string
}

export interface SendTemplateParams {
  to: string
  templateName: string
  languageCode?: string
  components?: TemplateMessageComponent[]
}

export interface TemplateMessageComponent {
  type: 'header' | 'body' | 'button'
  parameters: TemplateParameter[]
  sub_type?: 'quick_reply' | 'url'
  index?: number
}

export interface TemplateParameter {
  type: 'text' | 'image' | 'document' | 'video' | 'currency' | 'date_time'
  text?: string
  image?: { link: string }
  document?: { link: string; filename?: string }
  video?: { link: string }
  currency?: { fallback_value: string; code: string; amount_1000: number }
  date_time?: { fallback_value: string }
}

export interface MetaSendMessageResponse {
  messaging_product: string
  contacts: Array<{ input: string; wa_id: string }>
  messages: Array<{ id: string; message_status?: string }>
}

export interface MetaTemplate {
  id: string
  name: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'DISABLED'
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
  language: string
  components: TemplateComponent[]
  rejected_reason?: string
}

export interface MetaTemplateListResponse {
  data: MetaTemplate[]
  paging?: {
    cursors: { before: string; after: string }
    next?: string
  }
}

export interface CreateTemplatePayload {
  name: string
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
  language: string
  components: TemplateComponent[]
}

/**
 * Service para integração com Meta WhatsApp Business API (API Oficial)
 * Documentação: https://developers.facebook.com/docs/whatsapp/cloud-api
 * Cada método recebe as credenciais do tenant diretamente (multi-tenant)
 */
export class WhatsappOfficialService {
  private buildClient(accessToken: string): AxiosInstance {
    const client = axios.create({
      baseURL: META_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: 30000,
    })

    client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const data = error.response?.data as any
        console.error('Meta WhatsApp API Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          errorCode: data?.error?.code,
          errorMessage: data?.error?.message,
          errorSubcode: data?.error?.error_subcode,
        })
        throw error
      }
    )

    return client
  }

  /**
   * Envia mensagem de texto simples
   */
  async sendTextMessage(
    credentials: MetaCredentials,
    to: string,
    message: string
  ): Promise<MetaSendMessageResponse> {
    const client = this.buildClient(credentials.accessToken)
    const phone = this.formatPhone(to)

    const response = await client.post<MetaSendMessageResponse>(
      `/${credentials.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'text',
        text: { preview_url: false, body: message },
      }
    )
    return response.data
  }

  /**
   * Envia mensagem via template aprovado pela Meta
   */
  async sendTemplateMessage(
    credentials: MetaCredentials,
    params: SendTemplateParams
  ): Promise<MetaSendMessageResponse> {
    const client = this.buildClient(credentials.accessToken)
    const phone = this.formatPhone(params.to)

    const payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone,
      type: 'template',
      template: {
        name: params.templateName,
        language: { code: params.languageCode || 'pt_BR' },
      },
    }

    if (params.components && params.components.length > 0) {
      payload.template.components = params.components
    }

    const response = await client.post<MetaSendMessageResponse>(
      `/${credentials.phoneNumberId}/messages`,
      payload
    )
    return response.data
  }

  /**
   * Envia mensagem de imagem
   */
  async sendImageMessage(
    credentials: MetaCredentials,
    to: string,
    imageUrl: string,
    caption?: string
  ): Promise<MetaSendMessageResponse> {
    const client = this.buildClient(credentials.accessToken)
    const phone = this.formatPhone(to)

    const response = await client.post<MetaSendMessageResponse>(
      `/${credentials.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'image',
        image: { link: imageUrl, caption },
      }
    )
    return response.data
  }

  /**
   * Marca uma mensagem como lida
   */
  async markAsRead(
    credentials: MetaCredentials,
    messageId: string
  ): Promise<void> {
    const client = this.buildClient(credentials.accessToken)
    await client.post(`/${credentials.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    })
  }

  // ===========================
  // GESTÃO DE TEMPLATES
  // ===========================

  /**
   * Cria um novo template na Meta
   */
  async createTemplate(
    credentials: MetaCredentials,
    payload: CreateTemplatePayload
  ): Promise<{ id: string; status: string }> {
    const client = this.buildClient(credentials.accessToken)
    const response = await client.post<{ id: string; status: string }>(
      `/${credentials.wabaId}/message_templates`,
      payload
    )
    return response.data
  }

  /**
   * Lista todos os templates do WABA
   */
  async listTemplates(
    credentials: MetaCredentials,
    filters?: { status?: string; limit?: number }
  ): Promise<MetaTemplateListResponse> {
    const client = this.buildClient(credentials.accessToken)

    const params: any = {
      limit: filters?.limit || 20,
    }

    if (filters?.status) {
      params.status = filters.status
    }

    const response = await client.get<MetaTemplateListResponse>(
      `/${credentials.wabaId}/message_templates`,
      { params }
    )
    return response.data
  }

  /**
   * Busca um template específico pelo ID
   */
  async getTemplate(
    credentials: MetaCredentials,
    templateId: string
  ): Promise<MetaTemplate> {
    const client = this.buildClient(credentials.accessToken)
    const response = await client.get<MetaTemplate>(`/${templateId}`, {
      params: {
        fields: 'id,name,status,category,language,components,rejected_reason',
      },
    })
    return response.data
  }

  /**
   * Atualiza os componentes de um template existente
   */
  async updateTemplate(
    credentials: MetaCredentials,
    templateId: string,
    components: TemplateComponent[]
  ): Promise<{ success: boolean }> {
    const client = this.buildClient(credentials.accessToken)
    const response = await client.post<{ success: boolean }>(`/${templateId}`, {
      components,
    })
    return response.data
  }

  /**
   * Deleta um template pelo nome
   */
  async deleteTemplate(
    credentials: MetaCredentials,
    templateName: string
  ): Promise<void> {
    const client = this.buildClient(credentials.accessToken)
    await client.delete(`/${credentials.wabaId}/message_templates`, {
      params: { name: templateName },
    })
  }

  /**
   * Verifica as credenciais consultando informações do número
   */
  async verifyCredentials(
    credentials: MetaCredentials
  ): Promise<{ valid: boolean; phoneNumber?: string; displayName?: string; error?: string }> {
    try {
      const client = this.buildClient(credentials.accessToken)
      const response = await client.get<{
        id: string
        display_phone_number: string
        verified_name: string
        quality_rating: string
      }>(`/${credentials.phoneNumberId}`, {
        params: { fields: 'id,display_phone_number,verified_name,quality_rating' },
      })

      return {
        valid: true,
        phoneNumber: response.data.display_phone_number,
        displayName: response.data.verified_name,
      }
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Credenciais inválidas'
      return { valid: false, error: message }
    }
  }

  /**
   * Formata número de telefone para o padrão WhatsApp (sem + ou espaços)
   */
  private formatPhone(phone: string): string {
    let cleaned = phone.replace(/\D/g, '')
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned
    }
    return cleaned
  }
}

// Exportar como singleton
export default new WhatsappOfficialService()
