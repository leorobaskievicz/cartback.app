export const PLANS = {
  trial: {
    name: 'Trial',
    price: 0,
    messagesLimit: 100,
    templatesLimit: 3,
    trialDays: 7,
  },
  starter: {
    name: 'Starter',
    price: 5900, // centavos
    messagesLimit: 500,
    templatesLimit: 5,
  },
  pro: {
    name: 'Pro',
    price: 9900,
    messagesLimit: 2000,
    templatesLimit: 10,
  },
  business: {
    name: 'Business',
    price: 19900,
    messagesLimit: 10000,
    templatesLimit: -1, // ilimitado
  },
} as const

export type PlanType = keyof typeof PLANS

export function getPlanLimits(plan: PlanType) {
  return PLANS[plan]
}

export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
