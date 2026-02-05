export interface Testimonial {
  name: string
  role: string
  business: string
  content: string
  avatar?: string
}

export const testimonials: Testimonial[] = [
  {
    name: 'Maria Silva',
    role: 'Proprietária',
    business: 'Loja de Cosméticos',
    content:
      'Recuperamos R$ 4.200 no primeiro mês. O Cartback se paga em uma única venda recuperada.',
  },
  {
    name: 'João Pedro',
    role: 'Gerente',
    business: 'Moda Masculina',
    content:
      'Setup ridiculamente fácil. Conectei minha Nuvemshop e já estava funcionando.',
  },
  {
    name: 'Ana Luiza',
    role: 'Fundadora',
    business: 'Pet Shop Online',
    content:
      'Meus clientes respondem super bem às mensagens. É muito mais pessoal que email.',
  },
]

export const integrations = [
  {
    name: 'Nuvemshop',
    logo: '/logos/nuvemshop.svg',
    available: true,
  },
  {
    name: 'Yampi',
    logo: '/logos/yampi.svg',
    available: true,
  },
  {
    name: 'Shopify',
    logo: '/logos/shopify.svg',
    available: true,
  },
  {
    name: 'WooCommerce',
    logo: '/logos/woocommerce.svg',
    available: true,
  },
  {
    name: 'API/Webhook',
    logo: '/logos/api.svg',
    available: false,
    comingSoon: true,
  },
]
