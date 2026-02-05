# Cartback Landing Page

Landing page de alta conversão para o Cartback - SaaS de recuperação de carrinho abandonado via WhatsApp.

## Estrutura

```
landingpage/
├── index.tsx                    # Página principal que monta todas as seções
├── components/
│   ├── Header.tsx              # Header fixo com menu
│   ├── Hero.tsx                # Seção hero com CTA principal
│   ├── SocialProofBar.tsx      # Barra de logos de integrações
│   ├── ProblemSection.tsx      # Seção mostrando o problema
│   ├── HowItWorks.tsx          # Como funciona (3 passos)
│   ├── Features.tsx            # Grid de funcionalidades
│   ├── Testimonials.tsx        # Depoimentos e métricas
│   ├── Integrations.tsx        # Plataformas suportadas
│   ├── Pricing.tsx             # Tabela de preços
│   ├── FAQ.tsx                 # Perguntas frequentes
│   ├── FinalCTA.tsx            # CTA final antes do footer
│   └── Footer.tsx              # Footer com links
└── data/
    ├── features.ts             # Dados das funcionalidades
    ├── pricing.ts              # Dados dos planos
    ├── faq.ts                  # Perguntas frequentes
    └── testimonials.ts         # Depoimentos e integrações
```

## Funcionalidades

### Design
- ✅ Tema claro/escuro automático
- ✅ Totalmente responsivo (mobile-first)
- ✅ Animações suaves
- ✅ Glassmorphism e gradientes
- ✅ Cores do WhatsApp (#25D366)

### Seções
- ✅ Hero com CTAs principais
- ✅ Social proof (logos de integrações)
- ✅ Problema (70% de abandono)
- ✅ Solução (3 passos simples)
- ✅ Features (6 cards)
- ✅ Testimonials (3 depoimentos + métricas)
- ✅ Integrações (5 plataformas)
- ✅ Pricing (3 planos com toggle mensal/anual)
- ✅ FAQ (7 perguntas com accordion)
- ✅ CTA final com garantias
- ✅ Footer completo

### Conversão
- ✅ CTAs claros e destacados
- ✅ Badge "7 dias grátis"
- ✅ Social proof em múltiplos pontos
- ✅ Quebra de objeções no FAQ
- ✅ Garantias visíveis
- ✅ Scroll suave entre seções

## Rotas

A landing page está configurada para:

- **`/`** - Landing page (quando não autenticado)
- **`/`** - Redireciona para `/dashboard` (quando autenticado)
- **`/login`** - Página de login
- **`/register`** - Página de cadastro
- **`/dashboard/*`** - App autenticado

## Personalização

### Editar Conteúdo

Para editar o conteúdo da landing page, modifique os arquivos em `/data`:

**Features** (`data/features.ts`)
```typescript
export const features: Feature[] = [
  {
    icon: 'WhatsApp',
    title: 'WhatsApp Oficial',
    description: 'Envie pelo número da sua loja...',
  },
  // ...
]
```

**Pricing** (`data/pricing.ts`)
```typescript
export const plans: Plan[] = [
  {
    name: 'Starter',
    price: { monthly: 59, yearly: 49 },
    features: ['500 mensagens/mês', ...],
  },
  // ...
]
```

**FAQ** (`data/faq.ts`)
```typescript
export const faqItems: FAQItem[] = [
  {
    question: 'Preciso ter conhecimento técnico?',
    answer: 'Não! Nossa integração é...',
  },
  // ...
]
```

**Testimonials** (`data/testimonials.ts`)
```typescript
export const testimonials: Testimonial[] = [
  {
    name: 'Maria Silva',
    role: 'Proprietária',
    business: 'Loja de Cosméticos',
    content: 'Recuperamos R$ 4.200...',
  },
  // ...
]
```

### Editar Cores

As cores já estão configuradas no tema global (`src/theme.ts`):
- Primary: `#25D366` (Verde WhatsApp)
- Primary Dark: `#128C7E`
- Secondary: `#FF6B35` (Laranja accent)

### Adicionar Logos de Integrações

Adicione os logos em `/public/logos/` e atualize em `data/testimonials.ts`:

```typescript
export const integrations = [
  {
    name: 'Nuvemshop',
    logo: '/logos/nuvemshop.svg',
    available: true,
  },
  // ...
]
```

### Adicionar Screenshot do Dashboard

Substitua o placeholder no `Hero.tsx` por uma imagem real:

```tsx
<Box
  component="img"
  src="/screenshots/dashboard.png"
  alt="Dashboard Cartback"
  sx={{
    width: '100%',
    borderRadius: 4,
    // ...
  }}
/>
```

## SEO

Para otimizar o SEO, adicione em `index.html`:

```html
<!-- Title e Meta Tags -->
<title>Cartback - Recupere Carrinhos Abandonados via WhatsApp</title>
<meta name="description" content="Recupere até 30% dos carrinhos abandonados automaticamente via WhatsApp. Integração em 5 minutos. Teste grátis!" />

<!-- Open Graph -->
<meta property="og:title" content="Cartback - Recupere Carrinhos Abandonados via WhatsApp" />
<meta property="og:description" content="Transforme carrinhos abandonados em vendas fechadas." />
<meta property="og:image" content="/og-image.png" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
```

## Performance

A landing page já está otimizada para:
- ✅ Lazy loading de seções
- ✅ Componentes leves
- ✅ Sem dependências externas pesadas
- ✅ CSS otimizado com MUI

## Próximos Passos

1. **Adicionar Analytics**
   - Google Analytics 4
   - Google Tag Manager
   - Pixel do Facebook

2. **Adicionar Imagens Reais**
   - Screenshots do dashboard
   - Logos das integrações
   - Fotos dos depoimentos

3. **A/B Testing**
   - Testar diferentes headlines
   - Testar diferentes CTAs
   - Testar ordem das seções

4. **Integrações**
   - Chat widget (Intercom/Crisp)
   - Exit intent popup
   - Form validation melhorado

## Desenvolvimento

Para rodar localmente:

```bash
cd apps/web
npm run dev
```

Acesse: `http://localhost:5173`

## Produção

Build para produção:

```bash
npm run build
npm run preview
```

---

**Desenvolvido com:** React + Vite + Material-UI
**Tema:** Cartback Green (#25D366)
**Responsivo:** ✅ Mobile, Tablet, Desktop
