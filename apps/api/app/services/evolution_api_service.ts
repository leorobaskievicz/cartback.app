import axios, { AxiosInstance, AxiosError } from 'axios'
import env from '#start/env'
import type {
  EvolutionInstance,
  CreateInstanceResponse,
  CreateInstanceOptions,
  QrCodeResponse,
  ConnectionState,
  ConnectionStateDetailed,
  SendMessageResponse,
  SendTextOptions,
  SendMediaOptions,
  WebhookConfig,
  WebhookEvent,
  ContactInfo,
  PresenceInfo,
} from '#types/evolution'

/**
 * Service para integração com Evolution API (WhatsApp)
 * Documentação: https://doc.evolution-api.com
 */
class EvolutionApiService {
  private client: AxiosInstance
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = env.get('EVOLUTION_API_URL')
    this.apiKey = env.get('EVOLUTION_API_KEY')

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        apikey: this.apiKey,
      },
      timeout: 30000, // 30 segundos
    })

    // Interceptor para logs de erro
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const errorData = error.response?.data as any

        // Log completo do erro para debug
        console.error('🔴 Evolution API Error:', {
          url: error.config?.url,
          method: error.config?.method,
          requestData: error.config?.data,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: JSON.stringify(error.response?.data, null, 2),
          headers: error.response?.headers,
        })

        // Extrair mensagem de erro mais detalhada possível
        let detailedMessage = error.message

        if (errorData) {
          // Tentar múltiplas estruturas de erro possíveis
          if (typeof errorData === 'string') {
            detailedMessage = errorData
          } else if (errorData.message) {
            detailedMessage = errorData.message
          } else if (errorData.error?.message) {
            detailedMessage = errorData.error.message
          } else if (errorData.error) {
            detailedMessage = typeof errorData.error === 'string'
              ? errorData.error
              : JSON.stringify(errorData.error)
          } else if (errorData.response?.message) {
            detailedMessage = errorData.response.message
          } else {
            // Se nenhuma estrutura conhecida, serializar o objeto completo
            detailedMessage = JSON.stringify(errorData)
          }
        }

        // Adicionar contexto do status code
        const statusContext = error.response?.status === 400
          ? ' [BAD_REQUEST - Verifique formato do número ou conteúdo da mensagem]'
          : error.response?.status === 401
          ? ' [UNAUTHORIZED - Credenciais inválidas]'
          : error.response?.status === 404
          ? ' [NOT_FOUND - Instância não encontrada]'
          : error.response?.status === 429
          ? ' [RATE_LIMIT - Muitas requisições]'
          : ''

        const fullMessage = `${detailedMessage}${statusContext}`

        // Criar erro aprimorado com todas as informações
        const enhancedError = new Error(fullMessage)
        ;(enhancedError as any).response = error.response
        ;(enhancedError as any).status = error.response?.status
        ;(enhancedError as any).responseData = errorData
        ;(enhancedError as any).originalError = error

        throw enhancedError
      }
    )
  }

  /**
   * Cria uma nova instância do WhatsApp
   */
  async createInstance(
    instanceName: string,
    options?: Partial<CreateInstanceOptions>
  ): Promise<CreateInstanceResponse> {
    const payload: CreateInstanceOptions = {
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      ...options,
    }

    const response = await this.client.post<CreateInstanceResponse>('/instance/create', payload)
    return response.data
  }

  /**
   * Busca o QR Code para conexão
   * Retorna null se a instância não existir ou já estiver conectada
   */
  async getQrCode(instanceName: string): Promise<QrCodeResponse | null> {
    try {
      const response = await this.client.get<QrCodeResponse>(
        `/instance/connect/${instanceName}`
      )
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 400) {
        return null
      }
      throw error
    }
  }

  /**
   * Verifica o status da conexão da instância
   */
  async getConnectionState(instanceName: string): Promise<ConnectionState> {
    const response = await this.client.get<ConnectionState>(
      `/instance/connectionState/${instanceName}`
    )
    return response.data
  }

  /**
   * Busca informações detalhadas de uma instância específica
   */
  async fetchInstance(instanceName: string): Promise<EvolutionInstance | null> {
    try {
      const response = await this.client.get<EvolutionInstance[]>('/instance/fetchInstances', {
        params: { instanceName },
      })

      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data.find((i) => i.name === instanceName || i.instanceName === instanceName) || null
      }

      return null
    } catch (error) {
      return null
    }
  }

  /**
   * Lista todas as instâncias
   */
  async fetchAllInstances(): Promise<EvolutionInstance[]> {
    const response = await this.client.get<EvolutionInstance[]>('/instance/fetchInstances')
    return response.data
  }

  /**
   * Envia mensagem de texto simples
   */
  async sendText(
    instanceName: string,
    phone: string,
    message: string,
    options?: Partial<SendTextOptions>
  ): Promise<SendMessageResponse> {
    const formattedPhone = this.formatPhone(phone)

    const payload: SendTextOptions = {
      number: formattedPhone,
      text: message,
      delay: 0,
      linkPreview: true,
      ...options,
    }

    const response = await this.client.post<SendMessageResponse>(
      `/message/sendText/${instanceName}`,
      payload
    )
    return response.data
  }

  /**
   * Envia mensagem com link destacado
   */
  async sendTextWithLink(
    instanceName: string,
    phone: string,
    message: string,
    linkUrl: string,
    linkTitle: string = 'Acessar'
  ): Promise<SendMessageResponse> {
    const formattedMessage = `${message}\n\n🔗 *${linkTitle}*\n${linkUrl}`

    return this.sendText(instanceName, phone, formattedMessage, {
      linkPreview: true,
    })
  }

  /**
   * Envia mídia (imagem, vídeo, áudio, documento)
   */
  async sendMedia(
    instanceName: string,
    phone: string,
    options: SendMediaOptions
  ): Promise<SendMessageResponse> {
    const formattedPhone = this.formatPhone(phone)

    const payload = {
      ...options,
      number: formattedPhone,
    }

    const response = await this.client.post<SendMessageResponse>(
      `/message/sendMedia/${instanceName}`,
      payload
    )
    return response.data
  }

  /**
   * Verifica se um número está registrado no WhatsApp
   */
  async checkNumberExists(instanceName: string, phone: string): Promise<boolean> {
    try {
      const formattedPhone = this.formatPhone(phone)

      const response = await this.client.get(`/chat/whatsappNumbers/${instanceName}`, {
        params: { numbers: [formattedPhone] },
      })

      return response.data?.[0]?.exists === true
    } catch (error) {
      return false
    }
  }

  /**
   * Busca informações de um contato
   */
  async getContactInfo(instanceName: string, phone: string): Promise<ContactInfo | null> {
    try {
      const formattedPhone = this.formatPhone(phone)

      const response = await this.client.get<ContactInfo>(
        `/chat/findContact/${instanceName}`,
        {
          params: { number: formattedPhone },
        }
      )
      return response.data
    } catch (error) {
      return null
    }
  }

  /**
   * Busca presença (online/offline) de um contato
   */
  async getPresence(instanceName: string, phone: string): Promise<PresenceInfo | null> {
    try {
      const formattedPhone = this.formatPhone(phone)

      const response = await this.client.get<PresenceInfo>(
        `/chat/presence/${instanceName}`,
        {
          params: { number: formattedPhone },
        }
      )
      return response.data
    } catch (error) {
      return null
    }
  }

  /**
   * Desconecta a instância (logout)
   */
  async logout(instanceName: string): Promise<void> {
    await this.client.delete(`/instance/logout/${instanceName}`)
  }

  /**
   * Deleta a instância completamente
   */
  async deleteInstance(instanceName: string): Promise<void> {
    await this.client.delete(`/instance/delete/${instanceName}`)
  }

  /**
   * Reinicia a instância
   */
  async restartInstance(instanceName: string): Promise<void> {
    await this.client.put(`/instance/restart/${instanceName}`)
  }

  /**
   * Configura webhook para receber eventos
   */
  async setWebhook(
    instanceName: string,
    webhookUrl: string,
    events?: WebhookEvent[]
  ): Promise<void> {
    const payload: WebhookConfig = {
      enabled: true,
      url: webhookUrl,
      webhookByEvents: true,
      events: events || [
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED',
        // 'MESSAGES_UPSERT', // Desabilitado: não precisamos notificação de mensagens recebidas
        // 'MESSAGES_UPDATE', // Desabilitado: não precisamos status de mensagens
        'SEND_MESSAGE',
      ],
    }

    await this.client.post(`/webhook/set/${instanceName}`, payload)
  }

  /**
   * Busca configuração do webhook
   */
  async getWebhook(instanceName: string): Promise<WebhookConfig | null> {
    try {
      const response = await this.client.get<WebhookConfig>(
        `/webhook/find/${instanceName}`
      )
      return response.data
    } catch (error) {
      return null
    }
  }

  /**
   * Formata número de telefone para o padrão WhatsApp
   * Remove caracteres especiais e garante código do país
   *
   * Exemplos:
   * - (11) 99999-9999 → 5511999999999
   * - 11999999999 → 5511999999999
   * - +5511999999999 → 5511999999999
   * - 5511999999999 → 5511999999999
   */
  private formatPhone(phone: string): string {
    // Remove tudo que não é número
    let cleaned = phone.replace(/\D/g, '')

    // Se não começar com 55 (código do Brasil), adiciona
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned
    }

    return cleaned
  }

  /**
   * Testa a conexão com a Evolution API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/')
      return response.status === 200
    } catch (error) {
      return false
    }
  }

  /**
   * Busca informações do servidor Evolution API
   */
  async getServerInfo(): Promise<any> {
    const response = await this.client.get('/')
    return response.data
  }
}

// Exportar como singleton
export default new EvolutionApiService()
