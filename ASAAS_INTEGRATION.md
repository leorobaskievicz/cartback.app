# Integração Asaas - Sistema de Cobranças

## 📋 Status: ✅ IMPLEMENTADO

A integração com Asaas para cobranças recorrentes está **100% implementada e funcional**.

---

## 🎯 O Que Foi Implementado

### 1. ✅ AsaasService (`app/services/asaas_service.ts`)
Serviço completo para comunicação com a API do Asaas:

#### Gerenciamento de Customers
- `createCustomer()` - Criar cliente no Asaas
- `getCustomer()` - Buscar cliente por ID
- `findCustomerByEmail()` - Buscar cliente por email
- `updateCustomer()` - Atualizar dados do cliente

#### Gerenciamento de Subscriptions
- `createSubscription()` - Criar assinatura recorrente (PIX/Boleto)
- `createSubscriptionWithCreditCard()` - Criar assinatura com cartão
- `getSubscription()` - Buscar assinatura
- `updateSubscription()` - Atualizar valor/forma de pagamento
- `cancelSubscription()` - Cancelar assinatura

#### Pagamentos
- `getPayment()` - Buscar pagamento por ID
- `getPaymentPixQrCode()` - Obter QR Code PIX
- `listSubscriptionPayments()` - Listar pagamentos de uma assinatura

#### Cartão de Crédito
- `tokenizeCreditCard()` - Tokenizar cartão de forma segura
- Suporte a pagamento recorrente com cartão tokenizado

#### Webhooks
- `validateWebhookSignature()` - Validar token de webhook

---

### 2. ✅ PlanService (`app/services/plan_service.ts`)
Lógica de negócio completa para gerenciamento de planos:

#### Trial e Limites
- `createTrialSubscription()` - Criar trial de 7 dias
- `canSendMessage()` - Verificar se pode enviar mensagem
- `recordMessageSent()` - Registrar envio de mensagem
- `canCreateTemplate()` - Verificar limite de templates
- `getPlanStatus()` - Status completo do plano

#### Assinaturas Pagas
- `startPaidSubscription()` - Iniciar assinatura paga (PIX/Boleto/Cartão)
  - Cria customer no Asaas
  - Cria subscription recorrente
  - Tokeniza cartão se necessário
  - Busca QR Code PIX
  - Registra pagamento no histórico
  - Ativa imediatamente se cartão

#### Gerenciamento
- `changePlan()` - Upgrade/downgrade de plano
- `cancelSubscription()` - Cancelar assinatura
- `resetMonthlyUsage()` - Resetar contador mensal

#### Webhooks
- `handlePaymentConfirmed()` - Processar pagamento confirmado
- `handlePaymentOverdue()` - Processar pagamento vencido

---

### 3. ✅ PlansController (`app/controllers/plans_controller.ts`)
Endpoints REST completos:

#### Endpoints Públicos
- `GET /api/plans` - Lista planos disponíveis (sem autenticação)

#### Endpoints Autenticados
- `GET /api/subscription` - Status atual da assinatura
- `GET /api/subscription/usage` - Uso de mensagens e templates
- `POST /api/subscription/checkout` - Iniciar checkout (PIX/Boleto/Cartão)
- `POST /api/subscription/change` - Mudar de plano
- `POST /api/subscription/cancel` - Cancelar assinatura
- `GET /api/subscription/payments` - Histórico de pagamentos

---

### 4. ✅ AsaasWebhookController (`app/controllers/webhooks/asaas_webhook_controller.ts`)
Recebe e processa webhooks do Asaas:

#### Eventos Processados
- `PAYMENT_CONFIRMED` - Pagamento confirmado → Ativa subscription
- `PAYMENT_RECEIVED` - Pagamento recebido → Ativa subscription
- `PAYMENT_OVERDUE` - Pagamento vencido → Marca como past_due
- `PAYMENT_REFUNDED` - Pagamento reembolsado
- `PAYMENT_DELETED` - Pagamento deletado

#### Segurança
- Validação de token do webhook (`asaas-access-token` header)

---

### 5. ✅ Models

#### Subscription Model (`app/models/subscription.ts`)
```typescript
{
  id: number
  tenantId: number
  plan: 'trial' | 'starter' | 'pro' | 'business'
  status: 'active' | 'past_due' | 'cancelled' | 'trial' | 'pending'
  paymentGateway: 'asaas' | null
  externalSubscriptionId: string | null  // ID no Asaas
  externalCustomerId: string | null      // Customer ID no Asaas
  currentPeriodStart: DateTime
  currentPeriodEnd: DateTime
  messagesLimit: number
  messagesUsed: number
  trialEndsAt: DateTime | null
}
```

**Métodos úteis:**
- `canSendMessage()` - Verifica se pode enviar
- `incrementMessageCount()` - Incrementa contador
- `getRemainingMessages()` - Mensagens restantes
- `getUsagePercentage()` - Percentual de uso
- `isTrialExpired()` - Trial expirado?
- `isPaid()` - É assinatura paga?

#### PaymentHistory Model (`app/models/payment_history.ts`)
```typescript
{
  id: number
  tenantId: number
  subscriptionId: number
  externalPaymentId: string              // ID do pagamento no Asaas
  amount: number                         // centavos
  status: 'pending' | 'confirmed' | 'received' | 'overdue' | 'refunded' | 'cancelled'
  paymentMethod: 'pix' | 'credit_card' | 'boleto'
  paidAt: DateTime | null
  dueDate: DateTime
  invoiceUrl: string | null
  pixQrCode: string | null               // Base64 da imagem QR Code
  pixCopyPaste: string | null            // Código PIX copia e cola
  boletoUrl: string | null
}
```

---

### 6. ✅ Constantes de Planos (`app/constants/plans.ts`)

```typescript
PLANS = {
  trial: {
    name: 'Trial',
    price: 0,
    messagesLimit: 100,
    templatesLimit: 3,
    trialDays: 7,
  },
  starter: {
    name: 'Starter',
    price: 5900,        // R$ 59,00
    messagesLimit: 500,
    templatesLimit: 5,
  },
  pro: {
    name: 'Pro',
    price: 9900,        // R$ 99,00
    messagesLimit: 2000,
    templatesLimit: 10,
  },
  business: {
    name: 'Business',
    price: 19900,       // R$ 199,00
    messagesLimit: 10000,
    templatesLimit: -1, // ilimitado
  },
}
```

---

### 7. ✅ Validators (`app/validators/checkout.ts`)

#### Checkout com Cartão
```typescript
{
  plan: 'starter' | 'pro' | 'business',
  billingType: 'CREDIT_CARD',
  creditCard: {
    holderName: string,
    number: string,        // 13-19 dígitos
    expiryMonth: string,   // 01-12
    expiryYear: string,    // YYYY
    ccv: string,           // 3-4 dígitos
  },
  holderInfo: {
    name: string,
    email: string,
    cpfCnpj: string,       // 11 ou 14 dígitos
    postalCode: string,    // 8 dígitos
    addressNumber: string,
    addressComplement?: string,
    phone: string,         // 10-11 dígitos
  }
}
```

#### Checkout PIX/Boleto
```typescript
{
  plan: 'starter' | 'pro' | 'business',
  billingType: 'PIX' | 'BOLETO'
}
```

---

### 8. ✅ Migrations

- `10_create_subscriptions_table.ts` - Tabela de assinaturas
- `13_create_payment_histories_table.ts` - Histórico de pagamentos
- `14_update_subscriptions_for_trial.ts` - Adiciona trial

---

## 🔐 Configuração (.env)

```bash
# Asaas Payment Gateway
ASAAS_API_KEY=aact_hmlg_...         # Sandbox key (sem o $ prefixo)
ASAAS_ENVIRONMENT=sandbox           # sandbox | production
ASAAS_WEBHOOK_TOKEN=cartback_webhook_secret_token_2024
```

**⚠️ IMPORTANTE:**
- A API key no .env deve estar **SEM** o prefixo `$`
- O AsaasService adiciona o `$` automaticamente
- Ambiente sandbox para testes, production para produção

---

## 🚀 Fluxo de Checkout

### 1. Usuário Escolhe Plano
```http
POST /api/subscription/checkout
Authorization: Bearer {token}
Content-Type: application/json

{
  "plan": "starter",
  "billingType": "PIX"
}
```

### 2. Backend Processa

#### a) Verifica CPF/CNPJ do Tenant
- Se não tiver, retorna erro `MISSING_DOCUMENT`

#### b) Cria/Busca Customer no Asaas
- Usa tenant.name, tenant.email, tenant.cpfCnpj
- Salva `externalCustomerId` na subscription

#### c) Cria Subscription no Asaas
- **PIX/Boleto**: Status fica `pending` até confirmação
- **Cartão**: Status fica `active` imediatamente

#### d) Busca Primeiro Pagamento
- Lista pagamentos da subscription
- Pega o primeiro (gerado automaticamente pelo Asaas)

#### e) Busca QR Code PIX (se necessário)
- Chama `getPaymentPixQrCode()`
- Retorna imagem base64 + código copia-e-cola

#### f) Salva no PaymentHistory
- Registra no banco local
- Status: `pending` (PIX/Boleto) ou `confirmed` (Cartão)

### 3. Retorna para Frontend
```json
{
  "success": true,
  "data": {
    "subscription": {
      "plan": "starter",
      "status": "pending"
    },
    "payment": {
      "id": 1,
      "amount": 5900,
      "status": "pending",
      "paymentMethod": "pix",
      "dueDate": "2026-02-02T00:00:00.000-03:00",
      "invoiceUrl": "https://...",
      "pixQrCode": "data:image/png;base64,...",
      "pixCopyPaste": "00020126...",
      "boletoUrl": null
    }
  }
}
```

### 4. Frontend Exibe QR Code/Boleto
- Usuário faz o pagamento

### 5. Asaas Envia Webhook
```http
POST /api/webhooks/asaas
asaas-access-token: cartback_webhook_secret_token_2024

{
  "event": "PAYMENT_CONFIRMED",
  "payment": {
    "id": "pay_abc123..."
  }
}
```

### 6. Backend Processa Webhook
- Valida token
- Busca PaymentHistory por `externalPaymentId`
- Atualiza status para `confirmed`
- **Ativa a subscription** → `status = 'active'`

---

## 🔄 Ciclo de Cobrança Mensal

### 1. Asaas Gera Nova Cobrança Automaticamente
- Todo mês na data do `nextDueDate`
- Cria novo payment automaticamente

### 2. Asaas Envia Webhook
- `PAYMENT_CONFIRMED` se pagou
- `PAYMENT_OVERDUE` se venceu sem pagar

### 3. Backend Atualiza Status
- **Confirmado**: Mantém `active`, reseta contador de mensagens
- **Vencido**: Marca como `past_due`, bloqueia envio de mensagens

---

## 🎨 Como Testar

### 1. Verificar Configuração
```bash
# Ver se credenciais estão carregadas
curl http://localhost:3333/api/test/controller
# Logs devem mostrar:
# 🔑 Asaas API Key loaded: $aact_hmlg_00...
# 🌐 Asaas Environment: sandbox
# 🔗 Asaas Base URL: https://sandbox.asaas.com/api/v3
```

### 2. Listar Planos (público)
```bash
curl http://localhost:3333/api/plans
```

### 3. Ver Status da Subscription
```bash
curl http://localhost:3333/api/subscription \
  -H "Authorization: Bearer {TOKEN}"
```

### 4. Fazer Checkout com PIX
```bash
curl -X POST http://localhost:3333/api/subscription/checkout \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "starter",
    "billingType": "PIX"
  }'
```

### 5. Fazer Checkout com Cartão (Sandbox)
```bash
curl -X POST http://localhost:3333/api/subscription/checkout \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "starter",
    "billingType": "CREDIT_CARD",
    "creditCard": {
      "holderName": "LEONARDO DA SILVA",
      "number": "5162306219378829",
      "expiryMonth": "12",
      "expiryYear": "2028",
      "ccv": "318"
    },
    "holderInfo": {
      "name": "Leonardo da Silva",
      "email": "leonardo@example.com",
      "cpfCnpj": "12345678901",
      "postalCode": "80010000",
      "addressNumber": "123",
      "addressComplement": "Apto 101",
      "phone": "41999999999"
    }
  }'
```

**Cartões de Teste Asaas (Sandbox):**
- ✅ **Aprovado**: `5162306219378829` / CVV: `318`
- ❌ **Recusado**: `5105105105105100` / CVV: `123`

### 6. Simular Webhook (Pagamento Confirmado)
```bash
curl -X POST http://localhost:3333/api/webhooks/asaas \
  -H "asaas-access-token: cartback_webhook_secret_token_2024" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PAYMENT_CONFIRMED",
    "payment": {
      "id": "pay_abc123..."
    }
  }'
```

### 7. Ver Histórico de Pagamentos
```bash
curl http://localhost:3333/api/subscription/payments \
  -H "Authorization: Bearer {TOKEN}"
```

---

## 📊 Integração com Sistema de Mensagens

### Verificação Antes de Enviar
```typescript
// No job send_whatsapp_message.ts
const { allowed, reason } = await planService.canSendMessage(tenantId)

if (!allowed) {
  if (reason === 'trial_expired') {
    // Avisar que trial expirou
  } else if (reason === 'limit_reached') {
    // Avisar que atingiu limite
  } else if (reason === 'subscription_inactive') {
    // Avisar que subscription está inativa
  }
  return // Não envia
}

// Enviar mensagem...
await evolutionApi.sendMessage(...)

// Registrar uso
await planService.recordMessageSent(tenantId)
```

### Job de Reset Mensal
```typescript
// app/jobs/reset_monthly_usage.ts
// Roda todo dia para resetar subscriptions que passaram do período

const subscriptions = await Subscription.query()
  .where('status', 'active')
  .where('currentPeriodEnd', '<=', DateTime.now())

for (const subscription of subscriptions) {
  await planService.resetMonthlyUsage(subscription.id)
}
```

---

## 🔒 Segurança

### 1. Dados do Cartão
- ✅ Nunca armazenados no banco
- ✅ Tokenizados pelo Asaas antes de criar subscription
- ✅ Token é usado apenas uma vez
- ✅ Validação de formato no validator

### 2. Webhooks
- ✅ Token secreto validado (`ASAAS_WEBHOOK_TOKEN`)
- ✅ Header `asaas-access-token` obrigatório
- ✅ Endpoint público mas protegido por token

### 3. API Key
- ✅ Armazenada no .env (não commitar)
- ✅ Prefixo `$` adicionado automaticamente
- ✅ Ambiente sandbox separado de produção

---

## 📝 Checklist de Deploy

### Antes de Ir para Produção:

- [ ] **Obter credenciais de produção do Asaas**
  - Acessar https://www.asaas.com/
  - Criar conta ou fazer login
  - Gerar API Key de produção

- [ ] **Atualizar .env de produção**
  ```bash
  ASAAS_API_KEY={sua_key_producao_sem_$}
  ASAAS_ENVIRONMENT=production
  ASAAS_WEBHOOK_TOKEN={novo_token_seguro}
  ```

- [ ] **Configurar Webhook no Asaas**
  - Acessar painel Asaas → Configurações → Webhooks
  - Adicionar URL: `https://api.cartback.app/api/webhooks/asaas`
  - Token: O mesmo do `ASAAS_WEBHOOK_TOKEN`
  - Eventos: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`

- [ ] **Testar Checkout em Produção**
  - Fazer checkout com PIX
  - Fazer checkout com Boleto
  - Fazer checkout com Cartão
  - Verificar webhooks chegando

- [ ] **Configurar Job de Reset Mensal**
  - Criar cron job para rodar `reset_monthly_usage`
  - Rodar todo dia à meia-noite

- [ ] **Monitoramento**
  - Logs de erro de pagamento
  - Alertas de webhook falhando
  - Dashboard de conversão

---

## 🐛 Troubleshooting

### Erro: "Invalid API Key"
- Verificar se API key está correta no .env
- Verificar se está usando a key do ambiente correto (sandbox/production)
- Verificar se o `$` está sendo adicionado corretamente

### Erro: "Customer not found"
- Customer só é criado no primeiro checkout
- Verificar se `externalCustomerId` foi salvo na subscription

### Webhook não está chegando
- Verificar se URL está configurada no painel Asaas
- Verificar se token está correto
- Verificar logs do servidor
- Testar endpoint manualmente com curl

### Subscription fica "pending" mesmo após pagamento
- Verificar se webhook está configurado
- Verificar se webhook está chegando (logs)
- Simular webhook manualmente para testar

### Limite de mensagens não funciona
- Verificar se `messagesUsed` está sendo incrementado
- Verificar se job de reset mensal está rodando
- Verificar lógica em `canSendMessage()`

---

## 📚 Documentação Útil

- [Asaas API Docs](https://docs.asaas.com/)
- [Asaas Webhooks](https://docs.asaas.com/docs/webhooks)
- [Asaas Cartão de Crédito](https://docs.asaas.com/docs/cartao-de-credito)
- [Asaas PIX](https://docs.asaas.com/docs/pix)
- [Asaas Subscriptions](https://docs.asaas.com/docs/assinaturas)

---

## ✅ Conclusão

A integração com Asaas está **100% completa e funcional**, incluindo:

- ✅ Suporte a PIX, Boleto e Cartão de Crédito
- ✅ Assinaturas recorrentes mensais
- ✅ Trial de 7 dias
- ✅ Controle de limites de mensagens
- ✅ Webhooks para confirmação de pagamento
- ✅ Histórico de pagamentos
- ✅ Upgrade/downgrade de planos
- ✅ Cancelamento de assinatura
- ✅ Segurança com tokenização de cartão
- ✅ Ambiente sandbox para testes

**🎉 Pronto para usar!**
