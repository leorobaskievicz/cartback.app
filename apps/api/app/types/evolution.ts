/**
 * Tipos e interfaces para a Evolution API
 * Documentação: https://doc.evolution-api.com
 */

/**
 * Informações de uma instância WhatsApp
 */
export interface EvolutionInstance {
  id: string
  name: string
  instanceName?: string // Alias para compatibilidade
  connectionStatus: 'open' | 'close' | 'connecting'
  ownerJid?: string | null
  profileName?: string | null
  profilePicUrl?: string | null
  integration: string
  number?: string | null
  token: string
  clientName: string
  qrcode?: {
    base64?: string
    code?: string
  }
}

/**
 * Resposta ao criar uma instância
 */
export interface CreateInstanceResponse {
  instance: {
    instanceName: string
    status: string
  }
  hash: {
    apikey: string
  }
  qrcode?: {
    base64: string
    code: string
  }
  webhook?: {
    webhook: string
    events: string[]
  }
}

/**
 * QR Code para conexão WhatsApp
 */
export interface QrCodeResponse {
  base64: string
  code: string
  pairingCode?: string
}

/**
 * Estado da conexão
 */
export interface ConnectionState {
  instance: string
  state: 'open' | 'close' | 'connecting'
}

/**
 * Detalhes do estado da conexão
 */
export interface ConnectionStateDetailed {
  instance: string
  state: 'open' | 'close' | 'connecting'
  statusReason?: number
}

/**
 * Informações da sessão
 */
export interface SessionInfo {
  wid: string
  name: string
  phone: string
  platform: string
}

/**
 * Chave de mensagem
 */
export interface MessageKey {
  remoteJid: string
  fromMe: boolean
  id: string
}

/**
 * Resposta ao enviar mensagem
 */
export interface SendMessageResponse {
  key: MessageKey
  message: {
    conversation?: string
    extendedTextMessage?: {
      text: string
    }
  }
  messageTimestamp: string | number
  status?: string
}

/**
 * Opções para enviar mensagem de texto
 */
export interface SendTextOptions {
  number: string
  text: string
  delay?: number
  linkPreview?: boolean
}

/**
 * Opções para enviar mídia
 */
export interface SendMediaOptions {
  number: string
  mediatype: 'image' | 'video' | 'audio' | 'document'
  media: string // URL ou base64
  caption?: string
  fileName?: string
  delay?: number
}

/**
 * Configuração de webhook
 */
export interface WebhookConfig {
  enabled: boolean
  url: string
  webhookByEvents?: boolean
  events?: string[]
}

/**
 * Eventos disponíveis para webhook
 */
export type WebhookEvent =
  | 'CONNECTION_UPDATE'
  | 'MESSAGES_UPSERT'
  | 'MESSAGES_UPDATE'
  | 'MESSAGES_DELETE'
  | 'SEND_MESSAGE'
  | 'CONTACTS_SET'
  | 'CONTACTS_UPSERT'
  | 'CONTACTS_UPDATE'
  | 'PRESENCE_UPDATE'
  | 'CHATS_SET'
  | 'CHATS_UPSERT'
  | 'CHATS_UPDATE'
  | 'CHATS_DELETE'
  | 'GROUPS_UPSERT'
  | 'GROUP_UPDATE'
  | 'GROUP_PARTICIPANTS_UPDATE'
  | 'NEW_JWT_TOKEN'
  | 'TYPEBOT_START'
  | 'TYPEBOT_CHANGE_STATUS'
  | 'CHAMA_AI_ACTION'
  | 'CALL'
  | 'QRCODE_UPDATED'
  | 'LABELS_EDIT'
  | 'LABELS_ASSOCIATION'

/**
 * Payload do webhook de conexão
 */
export interface ConnectionUpdateWebhook {
  instance: string
  data: {
    state: 'open' | 'close' | 'connecting'
    statusReason?: number
  }
  destination: string
  date_time: string
  sender: string
  server_url: string
  apikey: string
}

/**
 * Payload do webhook de QR Code
 */
export interface QrCodeUpdateWebhook {
  instance: string
  data: {
    qrcode: {
      base64: string
      code: string
    }
  }
  destination: string
  date_time: string
  sender: string
  server_url: string
  apikey: string
}

/**
 * Payload do webhook de mensagem
 */
export interface MessageUpsertWebhook {
  instance: string
  data: {
    key: MessageKey
    message: any
    messageType: string
    messageTimestamp: number
    owner: string
    source: string
  }
  destination: string
  date_time: string
  sender: string
  server_url: string
  apikey: string
}

/**
 * Opções de criação de instância
 */
export interface CreateInstanceOptions {
  instanceName: string
  qrcode?: boolean
  integration?: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS'
  webhookUrl?: string
  webhookEvents?: WebhookEvent[]
  webhookByEvents?: boolean
  rejectCall?: boolean
  msgCall?: string
  groupsIgnore?: boolean
  alwaysOnline?: boolean
  readMessages?: boolean
  readStatus?: boolean
  syncFullHistory?: boolean
}

/**
 * Informações do contato
 */
export interface ContactInfo {
  id: string
  name?: string
  notify?: string
  verifiedName?: string
  imgUrl?: string
  status?: string
}

/**
 * Status da presença
 */
export type PresenceStatus =
  | 'unavailable'
  | 'available'
  | 'composing'
  | 'recording'
  | 'paused'

/**
 * Informações de presença
 */
export interface PresenceInfo {
  id: string
  presences: {
    [key: string]: {
      lastKnownPresence: PresenceStatus
      lastSeen?: number
    }
  }
}
