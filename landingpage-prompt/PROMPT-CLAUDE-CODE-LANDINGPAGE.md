Meu projeto está em: /Users/leonardo/Sites/cartback
Estrutura: monorepo com apps/web
Framework: React + Vite (ou Next.js)
UI: MUI v5
Tema: já configurado em apps/web/src/theme/index.ts

Coloque os assets (favicon, og-image) que já tenho em /public

# Cartback Landing Page - Prompt para Claude Code

## Contexto do Projeto

Sou o Leonardo, fundador do **Cartback** (cartback.app) - um SaaS de recuperação de carrinho abandonado via WhatsApp para e-commerces brasileiros.

**Stack do projeto:**

- React + MUI (Material UI)
- Suporte a tema claro/escuro
- Localização: criar em `/app/landingpage`

**Objetivo:** Criar uma landing page de alta conversão que transforme visitantes em trials/clientes.

---

## Proposta de Valor Principal (USP)

> "Recupere até 30% dos carrinhos abandonados automaticamente via WhatsApp - a plataforma que seus clientes já usam."

**Diferenciais competitivos:**

1. WhatsApp (95% dos brasileiros usam)
2. Setup em 5 minutos
3. Integração nativa com principais plataformas BR
4. ROI comprovado (cada R$1 investido = R$15-30 de retorno)
5. Sem necessidade de conhecimento técnico

---

## Estrutura da Landing Page

A página deve seguir esta estrutura otimizada para conversão:

```
┌─────────────────────────────────────────────────────────┐
│  HEADER (fixo, transparente → sólido ao scroll)         │
│  Logo | Home | Recursos | Preços | FAQ | [CTA: Começar] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. HERO SECTION                                         │
│     - Headline impactante                                │
│     - Subheadline com benefício                          │
│     - CTA primário + CTA secundário                      │
│     - Mockup/Screenshot do produto                       │
│     - Badge "Teste grátis por 7 dias"                    │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  2. SOCIAL PROOF BAR                                     │
│     - Logos de integrações (Nuvemshop, Yampi, etc)       │
│     - Ou: "Mais de X carrinhos recuperados"              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  3. PROBLEMA / DOR                                       │
│     - Estatística chocante sobre abandono de carrinho    │
│     - Empatia com a dor do lojista                       │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  4. SOLUÇÃO / COMO FUNCIONA                              │
│     - 3 passos simples                                   │
│     - Animação/ilustração de cada passo                  │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  5. FEATURES / BENEFÍCIOS                                │
│     - Cards com ícones                                   │
│     - Foco em BENEFÍCIOS, não features técnicas          │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  6. PROVA SOCIAL / RESULTADOS                            │
│     - Métricas reais (ou projetadas realistas)           │
│     - Depoimentos (pode ser placeholder)                 │
│     - Casos de uso                                       │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  7. INTEGRAÇÕES                                          │
│     - Logos das plataformas suportadas                   │
│     - "Conecta em 1 clique"                              │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  8. PREÇOS                                               │
│     - 3 planos lado a lado                               │
│     - Plano recomendado destacado                        │
│     - Toggle mensal/anual                                │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  9. FAQ                                                  │
│     - Accordion com perguntas frequentes                 │
│     - Quebrar objeções                                   │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  10. CTA FINAL                                           │
│      - Headline de urgência                              │
│      - Botão grande                                      │
│      - Garantia / Sem risco                              │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  FOOTER                                                  │
│  Logo | Links | Redes Sociais | CNPJ/Termos              │
└─────────────────────────────────────────────────────────┘
```

---

## Copy Sugerida (Português BR)

### 1. HERO SECTION

**Headline Principal:**

```
Pare de perder vendas.
Recupere carrinhos abandonados pelo WhatsApp.
```

**Alternativas para A/B test:**

- "Seus clientes abandonam o carrinho. Nós trazemos eles de volta."
- "Transforme carrinhos esquecidos em vendas fechadas"
- "Recupere até 30% das vendas perdidas - automaticamente"

**Subheadline:**

```
Envie mensagens automáticas pelo WhatsApp quando seus clientes
abandonam o carrinho. Setup em 5 minutos, sem código.
```

**CTA Primário:** "Começar Teste Grátis" ou "Testar 7 Dias Grátis"
**CTA Secundário:** "Ver demonstração" ou "Como funciona?"

**Badge:** "✓ 7 dias grátis • Sem cartão de crédito"

---

### 2. SOCIAL PROOF BAR

```
"Integra com as principais plataformas"
[Logo Nuvemshop] [Logo Yampi] [Logo Shopify] [Logo WooCommerce]
```

Ou métricas:

```
+R$ 2.5M recuperados  |  +15.000 mensagens enviadas  |  +500 lojas
```

_(Usar números realistas ou placeholders para editar depois)_

---

### 3. SEÇÃO PROBLEMA

**Headline:** "70% dos carrinhos são abandonados"

**Texto:**

```
A cada 10 clientes que adicionam produtos ao carrinho,
7 nunca finalizam a compra.

Isso significa milhares de reais deixados na mesa todos os meses.

E o pior? A maioria desses clientes QUER comprar -
eles só precisam de um lembrete no momento certo.
```

**Estatísticas visuais:**

- 70% taxa média de abandono
- R$ 3.500 perdidos por mês (loja média)
- 48h janela ideal para recuperação

---

### 4. COMO FUNCIONA

**Headline:** "Recupere vendas em 3 passos"

**Passo 1: Conecte sua loja**

```
Integre com Nuvemshop, Yampi, Shopify ou WooCommerce
em menos de 5 minutos. Zero código necessário.
```

**Passo 2: Configure suas mensagens**

```
Use nossos templates prontos ou personalize
as mensagens com o tom da sua marca.
```

**Passo 3: Recupere no automático**

```
Quando um cliente abandona o carrinho, enviamos
uma mensagem personalizada pelo WhatsApp dele.
```

**Resultado:** "Você recebe a notificação da venda recuperada 💰"

---

### 5. FEATURES / BENEFÍCIOS

**Cards (6 items, 2x3 grid):**

1. **WhatsApp Oficial**
   "Envie pelo número da sua loja, com verificado ✓"

2. **Templates Prontos**
   "Mensagens testadas e otimizadas para converter"

3. **Timing Inteligente**
   "Enviamos no momento certo para maximizar conversões"

4. **Personalização**
   "Nome do cliente, produtos e link direto pro checkout"

5. **Dashboard Completo**
   "Acompanhe recuperações, taxa de conversão e ROI"

6. **Suporte Humano**
   "Time brasileiro pronto pra te ajudar via WhatsApp"

---

### 6. RESULTADOS / PROVA SOCIAL

**Headline:** "Resultados que falam por si"

**Métricas grandes:**

```
+30%        R$ 15        < 5min
Taxa de     Retorno      Tempo de
Recuperação por R$1      Setup
```

**Depoimentos (placeholders editáveis):**

```
"Recuperamos R$ 4.200 no primeiro mês. O Cartback se paga
em uma única venda recuperada."
— Maria S., Loja de Cosméticos

"Setup ridiculamente fácil. Conectei minha Nuvemshop
e já estava funcionando."
— João P., Moda Masculina

"Meus clientes respondem super bem às mensagens.
É muito mais pessoal que email."
— Ana L., Pet Shop Online
```

---

### 7. INTEGRAÇÕES

**Headline:** "Conecta com sua plataforma favorita"

**Logos:**

- Nuvemshop ✓
- Yampi ✓
- Shopify ✓
- WooCommerce ✓
- API/Webhook (em breve)

**Texto:** "Integração em 1 clique. Sem código. Sem dor de cabeça."

---

### 8. PREÇOS

**Headline:** "Planos que cabem no seu bolso"
**Subheadline:** "Comece grátis. Cancele quando quiser."

**Toggle:** Mensal | Anual (economize 20%)

|           | STARTER   | PRO ⭐    | BUSINESS    |
| --------- | --------- | --------- | ----------- |
| Preço     | R$ 59/mês | R$ 99/mês | R$ 199/mês  |
| Mensagens | 500/mês   | 2.000/mês | 10.000/mês  |
| Lojas     | 1         | 3         | Ilimitadas  |
| Templates | 3         | 10        | Ilimitados  |
| Suporte   | Email     | WhatsApp  | Prioritário |
|           | [Começar] | [Começar] | [Começar]   |

**Nota:** "Todas os planos incluem 7 dias grátis"

---

### 9. FAQ

**Perguntas sugeridas:**

1. **Preciso ter conhecimento técnico?**
   "Não! Nossa integração é feita em poucos cliques. Se você consegue copiar e colar, consegue usar o Cartback."

2. **Funciona com qualquer loja?**
   "Atualmente integramos com Nuvemshop, Yampi, Shopify e WooCommerce. Em breve teremos API para outras plataformas."

3. **As mensagens são enviadas do meu número?**
   "Sim! Você conecta seu WhatsApp Business e as mensagens saem com o nome e número da sua loja."

4. **Quanto tempo leva para ver resultados?**
   "A maioria dos clientes vê a primeira recuperação nas primeiras 24-48 horas."

5. **Posso cancelar a qualquer momento?**
   "Sim, sem multa e sem burocracia. Você pode cancelar direto no painel."

6. **O que acontece se eu passar do limite de mensagens?**
   "Você pode fazer upgrade a qualquer momento ou comprar pacotes avulsos."

7. **É seguro? Meus dados estão protegidos?**
   "Sim! Usamos criptografia e seguimos as melhores práticas de segurança. Seus dados nunca são compartilhados."

---

### 10. CTA FINAL

**Headline:** "Pronto para recuperar suas vendas?"

**Subheadline:**

```
Comece seu teste grátis agora.
Sem cartão de crédito. Sem compromisso.
```

**CTA:** "Começar Teste Grátis →"

**Garantia:** "✓ 7 dias grátis • ✓ Cancele quando quiser • ✓ Suporte incluso"

---

## Especificações Técnicas

### Design System

Usar o tema Cartback já configurado:

```javascript
const colors = {
  primary: "#25D366", // Verde WhatsApp
  primaryDark: "#128C7E", // Verde escuro
  text: {
    light: "#1A1A2E",
    dark: "#FFFFFF",
  },
  background: {
    light: "#FFFFFF",
    dark: "#0D0D14",
  },
  gradient: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
};
```

### Componentes Requeridos

1. **Header**
   - Fixo no topo
   - Transparente → sólido ao scroll (backdrop-blur)
   - Logo adaptável ao tema
   - Menu responsivo (hamburger no mobile)
   - CTA sempre visível

2. **Hero**
   - Full viewport height (100vh) ou quase
   - Background sutil (gradiente ou padrão)
   - Mockup do produto (pode ser placeholder)
   - Animação de entrada suave

3. **Cards de Features**
   - Ícones consistentes (Lucide ou MUI Icons)
   - Hover effects sutis
   - Grid responsivo (3 colunas → 2 → 1)

4. **Pricing Table**
   - Toggle mensal/anual funcional
   - Plano recomendado destacado (borda, badge)
   - Efeito hover nos cards
   - CTAs individuais

5. **FAQ Accordion**
   - Expansível com animação suave
   - Apenas um aberto por vez
   - Ícone +/- ou chevron

6. **Footer**
   - Links organizados em colunas
   - Redes sociais
   - Copyright e termos

### Animações (sutis, performáticas)

```javascript
// Usar Framer Motion ou CSS animations
const animations = {
  fadeInUp: {
    /* elementos entrando de baixo */
  },
  stagger: {
    /* elementos em sequência */
  },
  parallax: {
    /* efeito parallax suave no hero */
  },
  countUp: {
    /* números animados nas métricas */
  },
};
```

### SEO

```html
<title>Cartback - Recupere Carrinhos Abandonados via WhatsApp</title>
<meta
  name="description"
  content="Recupere até 30% dos carrinhos abandonados automaticamente via WhatsApp. Integração em 5 minutos com Nuvemshop, Yampi, Shopify e WooCommerce. Teste grátis!"
/>
<meta name="keywords" content="carrinho abandonado, recuperação de vendas, whatsapp marketing, e-commerce, nuvemshop, shopify" />

<!-- Open Graph -->
<meta property="og:title" content="Cartback - Recupere Carrinhos Abandonados via WhatsApp" />
<meta property="og:description" content="Transforme carrinhos abandonados em vendas fechadas. Teste grátis por 7 dias." />
<meta property="og:image" content="/og-image.png" />
<meta property="og:url" content="https://cartback.app" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
```

### Performance

- Lazy loading para imagens abaixo do fold
- Otimizar imagens (WebP com fallback)
- Minimizar JavaScript no carregamento inicial
- Critical CSS inline
- Preload de fontes

### Responsividade

- Mobile-first approach
- Breakpoints: 640px, 768px, 1024px, 1280px
- Touch-friendly (botões mínimo 44x44px)
- Textos legíveis sem zoom

### Acessibilidade

- Contraste adequado (WCAG AA)
- Labels em todos os inputs
- Focus states visíveis
- Alt text em imagens
- Navegação por teclado

---

## Estrutura de Arquivos Sugerida

```
/app/landingpage/
├── page.tsx                    # Página principal
├── layout.tsx                  # Layout (se necessário)
├── components/
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── SocialProofBar.tsx
│   ├── ProblemSection.tsx
│   ├── HowItWorks.tsx
│   ├── Features.tsx
│   ├── Testimonials.tsx
│   ├── Integrations.tsx
│   ├── Pricing.tsx
│   ├── FAQ.tsx
│   ├── FinalCTA.tsx
│   └── Footer.tsx
├── data/
│   ├── features.ts            # Dados das features
│   ├── pricing.ts             # Dados dos planos
│   ├── faq.ts                 # Perguntas do FAQ
│   └── testimonials.ts        # Depoimentos
└── assets/
    └── mockups/               # Imagens do produto
```

---

## Checklist de Conversão

- [ ] Headline clara em < 3 segundos
- [ ] CTA visível sem scroll (above the fold)
- [ ] Proposta de valor única óbvia
- [ ] Social proof próximo ao CTA
- [ ] Sem links externos que distraiam
- [ ] Formulário de cadastro simples (email apenas)
- [ ] Garantia/redução de risco visível
- [ ] Mobile perfeito (60%+ do tráfego)
- [ ] Página carrega em < 3 segundos
- [ ] CTAs com cor contrastante
- [ ] Preços transparentes
- [ ] FAQ que quebra objeções

---

## Integrações Futuras (Considerar no Design)

- [ ] Pixel do Facebook/Meta
- [ ] Google Analytics 4
- [ ] Google Tag Manager
- [ ] Hotjar/Clarity para heatmaps
- [ ] Chat widget (Intercom/Crisp)
- [ ] Exit intent popup (opcional)

---

## Notas Importantes

1. **Uma única ação:** Todo CTA deve levar para cadastro/trial
2. **Mobile é prioridade:** Testar extensivamente
3. **Velocidade mata:** Cada segundo a mais = -7% conversão
4. **Tema dark/light:** Manter consistência com o app principal
5. **Copy > Design:** Mensagem clara é mais importante que visual bonito
6. **Escaneabilidade:** Use headers, bullets, espaço em branco

---

## Como Começar

1. Primeiro, explore a estrutura existente do projeto
2. Verifique como o tema está configurado
3. Crie a estrutura de pastas
4. Comece pelo Hero (mais importante)
5. Adicione seções incrementalmente
6. Teste responsividade a cada seção
7. Otimize performance no final

Priorize funcionalidade sobre perfeição visual. Uma landing page no ar imperfeita converte mais que uma perfeita que nunca foi publicada.

---

_Prompt criado seguindo melhores práticas de SaaS landing pages de alta conversão (Unbounce, KlientBoost, 2025)_
