import axios from 'axios'
import type {
  ApiResponse,
  User,
  Tenant,
  DashboardStats,
  ChartData,
  StoreIntegration,
  WhatsAppInstance,
  WhatsAppHealthMetrics,
  MessageTemplate,
  AbandonedCart,
  PaginatedResponse,
  Plan,
  Subscription,
  PaymentCheckout,
  PaymentHistory,
  WhatsAppOfficialCredential,
  WhatsAppOfficialTemplate,
  WhatsAppOfficialLog,
  WhatsAppOfficialLogStats,
  TemplateComponent,
} from '../types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Auth API
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ token: string; user: User; tenant: Tenant }>>('/auth/login', data),

  register: (data: { name: string; email: string; password: string; phone?: string; tenantName: string }) =>
    api.post<ApiResponse<{ token: string; user: User; tenant: Tenant }>>('/auth/register', data),

  me: () => api.get<ApiResponse<{ user: User; tenant: Tenant }>>('/auth/me'),

  logout: () => api.post('/auth/logout'),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post<ApiResponse<{ message: string }>>('/auth/change-password', data),
}

// Dashboard API
export const dashboardApi = {
  stats: () => api.get<ApiResponse<DashboardStats>>('/dashboard/stats'),
  chart: () => api.get<ApiResponse<ChartData[]>>('/dashboard/chart'),
}

// Integrations API
export const integrationsApi = {
  list: () => api.get<ApiResponse<StoreIntegration[]>>('/integrations'),
  connectNuvemshop: () => api.post<ApiResponse<{ authUrl: string; platform: string }>>('/integrations/nuvemshop/connect'),
  disconnect: (id: number) => api.delete<ApiResponse<{ message: string }>>(`/integrations/${id}`),

  // Custom Webhook
  createCustomWebhook: (data: { name: string; platformUrl?: string }) =>
    api.post<ApiResponse<{
      integration: {
        id: number
        name: string
        platform: string
        webhookUrl: string
        apiKey: string
        createdAt: string
      }
      message: string
    }>>('/integrations/custom/create', data),

  getCustomWebhook: (id: number) =>
    api.get<ApiResponse<{
      id: number
      name: string
      platform: string
      platformUrl: string | null
      webhookUrl: string
      isActive: boolean
      connectedAt: string
      createdAt: string
    }>>(`/integrations/custom/${id}`),

  regenerateCustomWebhookKey: (id: number) =>
    api.post<ApiResponse<{
      apiKey: string
      message: string
    }>>(`/integrations/custom/${id}/regenerate-key`),

  getWebhookDocs: () =>
    api.get<ApiResponse<any>>('/webhooks/custom/docs'),
}

// WhatsApp API
export const whatsappApi = {
  status: () =>
    api.get<
      ApiResponse<{
        connected: boolean
        instance: WhatsAppInstance | null
      }>
    >('/whatsapp'),

  connect: (data: { instanceName: string }) =>
    api.post<
      ApiResponse<{
        qrCode: string
        instanceName: string
        expiresIn: number
      }>
    >('/whatsapp/connect', data),

  qrcode: () =>
    api.get<
      ApiResponse<{
        qrCode: string
        status: string
        expiresIn: number
      }>
    >('/whatsapp/qrcode'),

  disconnect: () => api.post<ApiResponse<{ message: string }>>('/whatsapp/disconnect'),

  health: () => api.get<ApiResponse<WhatsAppHealthMetrics>>('/whatsapp/health'),
}

// Templates API
export const templatesApi = {
  list: () => api.get<ApiResponse<MessageTemplate[]>>('/templates'),

  create: (data: {
    name: string
    triggerType: 'abandoned_cart' | 'order_confirmation'
    delayMinutes: number
    content: string
    isActive: boolean
  }) => api.post<ApiResponse<MessageTemplate>>('/templates', data),

  update: (
    id: number,
    data: {
      name?: string
      delayMinutes?: number
      content?: string
      isActive?: boolean
    }
  ) => api.put<ApiResponse<MessageTemplate>>(`/templates/${id}`, data),

  reorder: (templates: { id: number; sortOrder: number }[]) =>
    api.put<ApiResponse<{ message: string }>>('/templates/reorder', { templates }),

  delete: (id: number) => api.delete<ApiResponse<{ message: string }>>(`/templates/${id}`),

  test: (id: number, phoneNumber: string) =>
    api.post<ApiResponse<{ message: string; phoneNumber: string; templateName: string }>>(
      `/templates/${id}/test`,
      { phoneNumber }
    ),
}

// Carts API
export const cartsApi = {
  list: (params?: { page?: number; status?: string; perPage?: number }) =>
    api.get<ApiResponse<PaginatedResponse<AbandonedCart>>>('/carts', { params }),

  get: (id: number) =>
    api.get<
      ApiResponse<{
        cart: AbandonedCart
        messages: any[]
      }>
    >(`/carts/${id}`),

  cancel: (id: number) => api.put<ApiResponse<{ message: string }>>(`/carts/${id}/cancel`),
}

// Tenant API
export const tenantApi = {
  get: () => api.get<ApiResponse<Tenant>>('/tenant'),

  update: (data: { name?: string; email?: string; phone?: string; cpfCnpj?: string }) =>
    api.put<ApiResponse<Tenant>>('/tenant', data),
}

// Plans API
export const plansApi = {
  list: () => api.get<ApiResponse<Plan[]>>('/plans'),

  getSubscription: () => api.get<ApiResponse<Subscription>>('/subscription'),

  getUsage: () =>
    api.get<
      ApiResponse<{
        messages: { used: number; limit: number; remaining: number; percentage: number }
        templates: { used: number; limit: number }
      }>
    >('/subscription/usage'),

  checkout: (
    plan: string,
    billingType: string,
    creditCardData?: {
      creditCard: {
        holderName: string
        number: string
        expiryMonth: string
        expiryYear: string
        ccv: string
      }
      holderInfo: {
        name: string
        email: string
        cpfCnpj: string
        postalCode: string
        addressNumber: string
        addressComplement?: string
        phone: string
      }
    }
  ) =>
    api.post<ApiResponse<PaymentCheckout>>('/subscription/checkout', {
      plan,
      billingType,
      ...creditCardData,
    }),

  changePlan: (plan: string) => api.post<ApiResponse<Subscription>>('/subscription/change', { plan }),

  cancel: () => api.post<ApiResponse<{ message: string }>>('/subscription/cancel'),

  getPayments: () => api.get<ApiResponse<PaymentHistory[]>>('/subscription/payments'),
}

// WhatsApp Official API
export const whatsappOfficialApi = {
  // Credenciais
  getCredentials: () =>
    api.get<ApiResponse<{ configured: boolean; credential: WhatsAppOfficialCredential | null }>>(
      '/whatsapp-official/credentials'
    ),

  saveCredentials: (data: {
    phoneNumberId: string
    wabaId: string
    accessToken: string
    webhookVerifyToken: string
  }) =>
    api.post<ApiResponse<WhatsAppOfficialCredential & { message: string }>>(
      '/whatsapp-official/credentials',
      data
    ),

  deleteCredentials: () =>
    api.delete<ApiResponse<{ message: string }>>('/whatsapp-official/credentials'),

  verifyCredentials: () =>
    api.post<ApiResponse<{ valid: boolean; phoneNumber?: string; displayName?: string; error?: string }>>(
      '/whatsapp-official/credentials/verify'
    ),

  // Templates
  listTemplates: () =>
    api.get<ApiResponse<WhatsAppOfficialTemplate[]>>('/whatsapp-official/templates'),

  getTemplate: (id: number) =>
    api.get<ApiResponse<WhatsAppOfficialTemplate>>(`/whatsapp-official/templates/${id}`),

  createTemplate: (data: {
    name: string
    displayName?: string
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
    language: string
    components: TemplateComponent[]
  }) =>
    api.post<ApiResponse<WhatsAppOfficialTemplate & { message: string }>>(
      '/whatsapp-official/templates',
      data
    ),

  deleteTemplate: (id: number) =>
    api.delete<ApiResponse<{ message: string }>>(`/whatsapp-official/templates/${id}`),

  syncTemplates: () =>
    api.post<ApiResponse<{ synced: number; created: number; updated: number; message: string }>>(
      '/whatsapp-official/templates/sync'
    ),

  // Logs
  listLogs: (params?: { page?: number; perPage?: number; status?: string; templateName?: string; phone?: string }) =>
    api.get<ApiResponse<PaginatedResponse<WhatsAppOfficialLog>>>('/whatsapp-official/logs', {
      params,
    }),

  getLog: (id: number) =>
    api.get<ApiResponse<WhatsAppOfficialLog>>(`/whatsapp-official/logs/${id}`),

  getLogStats: () =>
    api.get<ApiResponse<WhatsAppOfficialLogStats>>('/whatsapp-official/logs/stats'),
}
