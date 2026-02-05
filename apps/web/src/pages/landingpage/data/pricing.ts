export interface Plan {
  name: string
  slug: string
  price: {
    monthly: number
    yearly: number
  }
  features: string[]
  recommended?: boolean
  buttonText: string
}

export const plans: Plan[] = [
  {
    name: 'Starter',
    slug: 'starter',
    price: {
      monthly: 59,
      yearly: 49,
    },
    features: [
      '500 mensagens/mês',
      '1 loja conectada',
      '3 templates',
      'Suporte por email',
      'Dashboard básico',
    ],
    buttonText: 'Começar',
  },
  {
    name: 'Pro',
    slug: 'pro',
    price: {
      monthly: 99,
      yearly: 79,
    },
    features: [
      '2.000 mensagens/mês',
      'Até 3 lojas',
      '10 templates',
      'Suporte via WhatsApp',
      'Dashboard completo',
      'Relatórios avançados',
    ],
    recommended: true,
    buttonText: 'Começar',
  },
  {
    name: 'Business',
    slug: 'business',
    price: {
      monthly: 199,
      yearly: 159,
    },
    features: [
      '10.000 mensagens/mês',
      'Lojas ilimitadas',
      'Templates ilimitados',
      'Suporte prioritário',
      'Dashboard completo',
      'API personalizada',
      'Gerente de conta',
    ],
    buttonText: 'Começar',
  },
]
