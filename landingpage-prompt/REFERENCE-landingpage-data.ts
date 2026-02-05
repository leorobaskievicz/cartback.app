/**
 * Cartback Landing Page - Dados Estruturados
 * 
 * Todos os textos e dados da landing page centralizados.
 * Facilita edição e testes A/B.
 */

// ===== HERO =====
export const heroData = {
  badge: '🚀 Novo: Integração com Shopify',
  headline: {
    line1: 'Pare de perder vendas.',
    line2: 'Recupere carrinhos abandonados pelo WhatsApp.',
  },
  subheadline: 'Envie mensagens automáticas pelo WhatsApp quando seus clientes abandonam o carrinho. Setup em 5 minutos, sem código.',
  cta: {
    primary: 'Começar Teste Grátis',
    secondary: 'Ver demonstração',
  },
  badges: [
    '7 dias grátis',
    'Sem cartão de crédito',
    'Cancele quando quiser',
  ],
};

// ===== SOCIAL PROOF / MÉTRICAS =====
export const metricsData = {
  recovered: { value: 'R$ 2.5M+', label: 'recuperados' },
  stores: { value: '500+', label: 'lojas ativas' },
  rate: { value: '30%', label: 'taxa média de recuperação' },
  messages: { value: '50k+', label: 'mensagens enviadas' },
};

// ===== PROBLEMA =====
export const problemData = {
  headline: '70% dos carrinhos são abandonados',
  stats: [
    { value: '70%', label: 'taxa média de abandono' },
    { value: 'R$ 3.500', label: 'perdidos por mês (loja média)' },
    { value: '48h', label: 'janela ideal para recuperação' },
  ],
  description: `A cada 10 clientes que adicionam produtos ao carrinho, 7 nunca finalizam a compra.

Isso significa milhares de reais deixados na mesa todos os meses.

E o pior? A maioria desses clientes QUER comprar - eles só precisam de um lembrete no momento certo.`,
};

// ===== COMO FUNCIONA =====
export const howItWorksData = {
  headline: 'Recupere vendas em 3 passos',
  steps: [
    {
      number: '01',
      title: 'Conecte sua loja',
      description: 'Integre com Nuvemshop, Yampi, Shopify ou WooCommerce em menos de 5 minutos. Zero código necessário.',
      icon: 'Link', // Lucide icon name
    },
    {
      number: '02',
      title: 'Configure suas mensagens',
      description: 'Use nossos templates prontos ou personalize as mensagens com o tom da sua marca.',
      icon: 'MessageSquare',
    },
    {
      number: '03',
      title: 'Recupere no automático',
      description: 'Quando um cliente abandona o carrinho, enviamos uma mensagem personalizada pelo WhatsApp dele.',
      icon: 'Zap',
    },
  ],
  result: 'Você recebe a notificação da venda recuperada 💰',
};

// ===== FEATURES =====
export const featuresData = {
  headline: 'Tudo que você precisa para recuperar vendas',
  subheadline: 'Funcionalidades pensadas para maximizar suas conversões',
  items: [
    {
      icon: 'BadgeCheck',
      title: 'WhatsApp Oficial',
      description: 'Envie pelo número da sua loja, com selo de verificado ✓',
    },
    {
      icon: 'FileText',
      title: 'Templates Prontos',
      description: 'Mensagens testadas e otimizadas para converter mais',
    },
    {
      icon: 'Clock',
      title: 'Timing Inteligente',
      description: 'Enviamos no momento certo para maximizar conversões',
    },
    {
      icon: 'User',
      title: 'Personalização',
      description: 'Nome do cliente, produtos e link direto pro checkout',
    },
    {
      icon: 'BarChart3',
      title: 'Dashboard Completo',
      description: 'Acompanhe recuperações, taxa de conversão e ROI',
    },
    {
      icon: 'HeadphonesIcon',
      title: 'Suporte Humano',
      description: 'Time brasileiro pronto pra te ajudar via WhatsApp',
    },
  ],
};

// ===== DEPOIMENTOS =====
export const testimonialsData = {
  headline: 'O que nossos clientes dizem',
  items: [
    {
      quote: 'Recuperamos R$ 4.200 no primeiro mês. O Cartback se paga em uma única venda recuperada.',
      author: 'Maria S.',
      role: 'Loja de Cosméticos',
      avatar: '/avatars/maria.jpg', // placeholder
      rating: 5,
    },
    {
      quote: 'Setup ridiculamente fácil. Conectei minha Nuvemshop e em 5 minutos já estava funcionando.',
      author: 'João P.',
      role: 'Moda Masculina',
      avatar: '/avatars/joao.jpg',
      rating: 5,
    },
    {
      quote: 'Meus clientes respondem super bem às mensagens. É muito mais pessoal que email.',
      author: 'Ana L.',
      role: 'Pet Shop Online',
      avatar: '/avatars/ana.jpg',
      rating: 5,
    },
    {
      quote: 'Aumentamos nossa taxa de recuperação de 5% para 28% em dois meses.',
      author: 'Carlos R.',
      role: 'Eletrônicos',
      avatar: '/avatars/carlos.jpg',
      rating: 5,
    },
  ],
};

// ===== INTEGRAÇÕES =====
export const integrationsData = {
  headline: 'Conecta com sua plataforma favorita',
  subheadline: 'Integração em 1 clique. Sem código. Sem dor de cabeça.',
  platforms: [
    { name: 'Nuvemshop', logo: '/logos/nuvemshop.svg', status: 'available' },
    { name: 'Yampi', logo: '/logos/yampi.svg', status: 'available' },
    { name: 'Shopify', logo: '/logos/shopify.svg', status: 'available' },
    { name: 'WooCommerce', logo: '/logos/woocommerce.svg', status: 'available' },
    { name: 'API/Webhook', logo: '/logos/api.svg', status: 'coming_soon' },
  ],
};

// ===== PREÇOS =====
export const pricingData = {
  headline: 'Planos que cabem no seu bolso',
  subheadline: 'Comece grátis por 7 dias. Sem cartão de crédito. Cancele quando quiser.',
  annualDiscount: 20, // percentual
  plans: [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Para lojas começando',
      priceMonthly: 59,
      priceAnnual: 47,
      features: [
        { text: '500 mensagens/mês', included: true },
        { text: '1 loja conectada', included: true },
        { text: '3 templates de mensagem', included: true },
        { text: 'Dashboard básico', included: true },
        { text: 'Suporte por email', included: true },
        { text: 'Relatórios avançados', included: false },
        { text: 'API de integração', included: false },
      ],
      cta: 'Começar Grátis',
      highlighted: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Mais popular',
      priceMonthly: 99,
      priceAnnual: 79,
      features: [
        { text: '2.000 mensagens/mês', included: true },
        { text: '3 lojas conectadas', included: true },
        { text: '10 templates de mensagem', included: true },
        { text: 'Dashboard completo', included: true },
        { text: 'Suporte via WhatsApp', included: true },
        { text: 'Relatórios avançados', included: true },
        { text: 'API de integração', included: false },
      ],
      cta: 'Começar Grátis',
      highlighted: true,
      badge: 'Mais Popular',
    },
    {
      id: 'business',
      name: 'Business',
      description: 'Para escalar',
      priceMonthly: 199,
      priceAnnual: 159,
      features: [
        { text: '10.000 mensagens/mês', included: true },
        { text: 'Lojas ilimitadas', included: true },
        { text: 'Templates ilimitados', included: true },
        { text: 'Dashboard completo', included: true },
        { text: 'Suporte prioritário', included: true },
        { text: 'Relatórios avançados', included: true },
        { text: 'API de integração', included: true },
      ],
      cta: 'Começar Grátis',
      highlighted: false,
    },
  ],
};

// ===== FAQ =====
export const faqData = {
  headline: 'Perguntas Frequentes',
  subheadline: 'Tudo que você precisa saber antes de começar',
  items: [
    {
      question: 'Preciso ter conhecimento técnico?',
      answer: 'Não! Nossa integração é feita em poucos cliques. Se você consegue copiar e colar, consegue usar o Cartback. Temos tutoriais em vídeo e suporte via WhatsApp para qualquer dúvida.',
    },
    {
      question: 'Funciona com qualquer loja?',
      answer: 'Atualmente integramos nativamente com Nuvemshop, Yampi, Shopify e WooCommerce. Em breve teremos API e webhooks para outras plataformas. Se sua plataforma não está na lista, entre em contato que podemos avaliar.',
    },
    {
      question: 'As mensagens são enviadas do meu número?',
      answer: 'Sim! Você conecta seu WhatsApp Business e as mensagens saem com o nome e número da sua loja. Seus clientes veem sua marca, não a nossa.',
    },
    {
      question: 'Quanto tempo leva para ver resultados?',
      answer: 'A maioria dos clientes vê a primeira recuperação nas primeiras 24-48 horas. O tempo exato depende do volume de carrinhos abandonados da sua loja.',
    },
    {
      question: 'Posso cancelar a qualquer momento?',
      answer: 'Sim, sem multa e sem burocracia. Você pode cancelar direto no painel em poucos cliques. Seu acesso continua até o fim do período pago.',
    },
    {
      question: 'O que acontece se eu passar do limite de mensagens?',
      answer: 'Você pode fazer upgrade de plano a qualquer momento ou comprar pacotes avulsos de mensagens. Nunca bloqueamos suas recuperações - você decide como quer continuar.',
    },
    {
      question: 'É seguro? Meus dados estão protegidos?',
      answer: 'Sim! Usamos criptografia de ponta a ponta e seguimos as melhores práticas de segurança (LGPD compliant). Seus dados e os de seus clientes nunca são compartilhados ou vendidos.',
    },
    {
      question: 'Vocês oferecem suporte?',
      answer: 'Sim! Temos suporte via email para todos os planos e suporte via WhatsApp para planos Pro e Business. Respondemos em até 4 horas em dias úteis.',
    },
    {
      question: 'Posso testar antes de pagar?',
      answer: 'Com certeza! Oferecemos 7 dias grátis em todos os planos, sem precisar cadastrar cartão de crédito. Você só paga se quiser continuar depois do período de teste.',
    },
    {
      question: 'Como funciona a cobrança?',
      answer: 'Aceitamos cartão de crédito, PIX e boleto. A cobrança é mensal ou anual (com 20% de desconto). Você pode trocar a forma de pagamento a qualquer momento.',
    },
  ],
};

// ===== CTA FINAL =====
export const finalCtaData = {
  headline: 'Pronto para recuperar suas vendas?',
  subheadline: 'Comece seu teste grátis agora. Sem cartão de crédito. Sem compromisso.',
  cta: 'Começar Teste Grátis',
  guarantees: [
    '7 dias grátis',
    'Cancele quando quiser',
    'Suporte incluso',
  ],
};

// ===== FOOTER =====
export const footerData = {
  company: {
    name: 'Cartback',
    description: 'Recuperação de carrinho abandonado via WhatsApp para e-commerces brasileiros.',
    cnpj: '00.000.000/0001-00', // placeholder
  },
  links: {
    product: [
      { label: 'Recursos', href: '#features' },
      { label: 'Preços', href: '#pricing' },
      { label: 'Integrações', href: '#integrations' },
      { label: 'FAQ', href: '#faq' },
    ],
    company: [
      { label: 'Sobre', href: '/sobre' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contato', href: '/contato' },
      { label: 'Trabalhe Conosco', href: '/carreiras' },
    ],
    legal: [
      { label: 'Termos de Uso', href: '/termos' },
      { label: 'Privacidade', href: '/privacidade' },
      { label: 'LGPD', href: '/lgpd' },
    ],
  },
  social: [
    { platform: 'instagram', url: 'https://instagram.com/cartbackapp' },
    { platform: 'linkedin', url: 'https://linkedin.com/company/cartback' },
    { platform: 'youtube', url: 'https://youtube.com/@cartback' },
  ],
};

// ===== SEO =====
export const seoData = {
  title: 'Cartback - Recupere Carrinhos Abandonados via WhatsApp',
  description: 'Recupere até 30% dos carrinhos abandonados automaticamente via WhatsApp. Integração em 5 minutos com Nuvemshop, Yampi, Shopify e WooCommerce. Teste grátis!',
  keywords: 'carrinho abandonado, recuperação de vendas, whatsapp marketing, e-commerce, nuvemshop, shopify, yampi, woocommerce',
  ogImage: '/og-image.png',
  url: 'https://cartback.app',
};
