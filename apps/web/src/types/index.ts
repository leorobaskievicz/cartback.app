export interface User {
  id: number
  name: string
  email: string
  tenantId: number
  role: 'owner' | 'admin' | 'viewer'
}

export interface Tenant {
  id: number
  uuid: string
  name: string
  email: string | null
  phone: string | null
  cpfCnpj: string | null
  plan: 'trial' | 'starter' | 'pro' | 'business'
  isActive: boolean
  trialEndsAt: string | null
}

export interface StoreIntegration {
  id: number
  platform: 'nuvemshop' | 'yampi' | 'shopify' | 'woocommerce' | 'webhook'
  storeName: string
  storeUrl: string
  isActive: boolean
  connectedAt: string
}

export interface WhatsAppInstance {
  id: number
  instanceName: string
  phoneNumber: string | null
  status: 'disconnected' | 'connecting' | 'connected'
  connectedAt: string | null
}

export interface HealthAlert {
  type: 'rate_limit' | 'quality_low' | 'warmup_exceeded' | 'response_rate_low' | 'too_many_failures'
  severity: 'warning' | 'critical'
  message: string
  timestamp: string
}

export interface WhatsAppHealthMetrics {
  health: {
    score: number
    qualityRating: 'high' | 'medium' | 'low' | 'flagged'
    isHealthy: boolean
    isWarmingUp: boolean
    daysSinceConnection: number
  }
  tier: {
    current: 'unverified' | 'tier1' | 'tier2' | 'tier3' | 'tier4'
    dailyLimit: number
    usageToday: number
    usagePercent: number
    nearLimit: boolean
  }
  metrics: {
    lastMinute: number
    lastHour: number
    last24h: number
    last7days: number
  }
  quality: {
    deliveryRate: number
    responseRate: number
    failureRate: number
    messagesDelivered: number
    messagesRead: number
    messagesFailed: number
    userResponses: number
    blocksReported: number
  }
  alerts: HealthAlert[]
  config: {
    minDelayBetweenMessages: number
    allowedHours: string
    warmupMaxDailyMessages: number
    minResponseRate: number
  }
  lastUpdate: string | null
}

export interface MessageTemplate {
  id: number
  name: string
  triggerType: 'abandoned_cart' | 'order_confirmation'
  delayMinutes: number
  content: string
  isActive: boolean
  sortOrder: number
}

export interface AbandonedCart {
  id: number
  externalCartId: string
  customerName: string | null
  customerEmail: string | null
  customerPhone: string
  totalValue: number
  currency: string
  status: 'pending' | 'recovered' | 'completed' | 'cancelled' | 'expired'
  items: CartItem[]
  cartUrl: string | null
  createdAt: string
  expiresAt: string | null
  recoveredAt: string | null
}

export interface CartItem {
  id: string
  name: string
  quantity: number
  price: number
  image?: string | null
}

export interface MessageLog {
  id: number
  phoneNumber: string
  content: string
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'cancelled'
  sentAt: string | null
  deliveredAt: string | null
  readAt: string | null
  errorMessage: string | null
  template: {
    id: number
    name: string
  }
}

export interface DashboardStats {
  totalCarts: number
  recoveredCarts: number
  recoveryRate: number
  totalRecovered: number
  messagesSent: number
  activeCarts: number
}

export interface ChartData {
  date: string
  carts: number
  recovered: number
  messages: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
  }
}

export interface Plan {
  id: string
  name: string
  price: number
  priceFormatted: string
  messagesLimit: number
  templatesLimit: number
  features: string[]
}

export interface Subscription {
  plan: string
  planName: string
  status: string
  price: number
  messagesUsed: number
  messagesLimit: number
  messagesRemaining: number
  usagePercentage: number
  templatesUsed: number
  templatesLimit: number
  currentPeriodEnd: string
  trialEndsAt: string | null
  isTrialExpired: boolean
  daysRemaining: number
  isPaid: boolean
}

export interface PaymentCheckout {
  subscription: {
    plan: string
    status: string
  }
  payment: {
    id: number
    amount: number
    status: string
    paymentMethod: string
    dueDate: string
    invoiceUrl: string | null
    pixQrCode: string | null
    pixCopyPaste: string | null
    boletoUrl: string | null
  }
}

export interface PaymentHistory {
  id: number
  amount: number
  status: string
  paymentMethod: string
  paidAt: string | null
  dueDate: string
  createdAt: string
}
