export interface FAQItem {
  question: string
  answer: string
}

export const faqItems: FAQItem[] = [
  {
    question: 'Preciso ter conhecimento técnico?',
    answer:
      'Não! Nossa integração é feita em poucos cliques. Se você consegue copiar e colar, consegue usar o Cartback.',
  },
  {
    question: 'Funciona com qualquer loja?',
    answer:
      'Atualmente integramos com Nuvemshop, Yampi, Shopify e WooCommerce. Em breve teremos API para outras plataformas.',
  },
  {
    question: 'As mensagens são enviadas do meu número?',
    answer:
      'Sim! Você conecta seu WhatsApp Business e as mensagens saem com o nome e número da sua loja.',
  },
  {
    question: 'Quanto tempo leva para ver resultados?',
    answer:
      'A maioria dos clientes vê a primeira recuperação nas primeiras 24-48 horas.',
  },
  {
    question: 'Posso cancelar a qualquer momento?',
    answer:
      'Sim, sem multa e sem burocracia. Você pode cancelar direto no painel.',
  },
  {
    question: 'O que acontece se eu passar do limite de mensagens?',
    answer:
      'Você pode fazer upgrade a qualquer momento ou comprar pacotes avulsos.',
  },
  {
    question: 'É seguro? Meus dados estão protegidos?',
    answer:
      'Sim! Usamos criptografia e seguimos as melhores práticas de segurança. Seus dados nunca são compartilhados.',
  },
]
