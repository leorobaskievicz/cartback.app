# Sistema de Filas e Jobs - CartBack

Documentação completa do sistema de filas com **BullMQ** e **Redis** para processar carrinhos abandonados e enviar mensagens WhatsApp.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Filas e Jobs](#filas-e-jobs)
- [Fluxo Completo](#fluxo-completo)
- [Estrutura de Arquivos](#estrutura-de-arquivos)
- [Configuração](#configuração)
- [Uso](#uso)
- [Monitoramento](#monitoramento)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O sistema de filas é responsável por:

1. **Processar carrinhos abandonados** recebidos via webhook
2. **Agendar mensagens WhatsApp** baseadas em templates
3. **Enviar mensagens** no horário correto
4. **Verificar recuperação** de carrinhos
5. **Gerenciar limites** de mensagens por plano

### Tecnologias

- **BullMQ**: Sistema de filas robusto baseado em Redis
- **IORedis**: Cliente Redis de alta performance
- **Redis**: Armazenamento em memória para filas
- **AdonisJS Provider**: Integração com ciclo de vida da aplicação

---

## 🏗️ Arquitetura

```
┌─────────────────┐
│  Webhook        │
│  (Nuvemshop)    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│  Queue: process-abandoned-cart                  │
│  • Valida tenant e WhatsApp                     │
│  • Cria carrinho no banco                       │
│  • Busca templates ativos                       │
│  • Agenda mensagens                             │
└────────┬────────────────────────────────────────┘
         │
         ├──────────────────────────────────┐
         ▼                                  ▼
┌────────────────────────┐      ┌──────────────────────┐
│ Queue: send-message    │      │ Queue: check-cart    │
│ • Delay: 5min          │      │ • Delay: 12h         │
│ • Substitui {{vars}}   │      │ • Verifica status    │
│ • Envia via Evolution  │      │ • Re-agenda ou expira│
│ • Atualiza contador    │      │                      │
└────────────────────────┘      └──────────────────────┘
         │
         ▼
┌────────────────────────┐
│ Queue: send-message    │
│ • Delay: 1h            │
│ • Próxima mensagem     │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│ Queue: send-message    │
│ • Delay: 24h           │
│ • Última mensagem      │
└────────────────────────┘
```

---

## 📦 Filas e Jobs

### 1. `process-abandoned-cart`

**Quando é disparado:** Quando webhook recebe carrinho abandonado

**Responsabilidades:**
- Valida se tenant tem WhatsApp conectado
- Verifica limite de mensagens do plano
- Cria registro `AbandonedCart` no banco
- Busca templates ativos ordenados por `delay_minutes`
- Cria `MessageLog` para cada template (status: `queued`)
- Agenda jobs `send-whatsapp-message` com delay correto
- Agenda job `check-cart-recovered` para verificação posterior

**Payload:**
```typescript
{
  tenantId: number
  storeIntegrationId: number
  externalCartId: string
  externalCustomerId?: string
  customerName?: string
  customerEmail?: string
  customerPhone: string      // Obrigatório
  cartUrl?: string
  totalValue?: number
  items: Array<{
    id: string
    name: string
    quantity: number
    price: number
    image?: string
  }>
}
```

**Casos de Saída:**
- ✅ Sucesso: Mensagens agendadas
- ⚠️  Sem WhatsApp: Ignora carrinho
- ⚠️  Limite atingido: Ignora carrinho
- ⚠️  Carrinho duplicado: Ignora
- ⚠️  Sem templates: Cria carrinho mas não agenda mensagens

---

### 2. `send-whatsapp-message`

**Quando é disparado:** No horário agendado (delay do template)

**Responsabilidades:**
- Verifica se carrinho ainda está `pending`
- Verifica se WhatsApp está conectado
- Verifica limite de mensagens novamente
- Substitui placeholders no template
- Envia mensagem via Evolution API
- Atualiza `MessageLog` (status: `sent` ou `failed`)
- Incrementa contador `messagesUsed` na subscription

**Payload:**
```typescript
{
  messageLogId: number
  cartId: number
  templateId: number
  whatsappInstanceId: number
}
```

**Placeholders Suportados:**
- `{{nome}}`: Nome do cliente ou "Cliente"
- `{{produtos}}`: Lista formatada de produtos
- `{{link}}`: URL do checkout
- `{{total}}`: Valor total formatado (R$ 199,90)

**Casos de Saída:**
- ✅ Sucesso: Mensagem enviada
- ❌ Carrinho recuperado: Status `cancelled`
- ❌ WhatsApp desconectado: Retry automático (3x)
- ❌ Limite atingido: Status `failed`
- ❌ Erro de envio: Retry automático (3x)

**Retry Policy:**
- Tentativas: 3
- Backoff: Exponencial (5s, 25s, 125s)

---

### 3. `check-cart-recovered`

**Quando é disparado:** 12h após a última mensagem

**Responsabilidades:**
- Verifica status do carrinho
- Se ainda `pending` e não expirou: re-agenda +12h
- Se expirou: marca como `expired`
- *(Futuro)* Consulta API da loja para verificar compra

**Payload:**
```typescript
{
  cartId: number
  tenantId: number
}
```

**Casos de Saída:**
- ✅ Carrinho recuperado: Nada a fazer
- ✅ Carrinho cancelado: Nada a fazer
- ⏱️  Ainda pending: Re-agenda verificação
- ⏱️  Expirado: Marca status `expired`

---

## 🔄 Fluxo Completo

### Exemplo: 3 Templates configurados

```
Templates do Tenant:
1. "Ei {{nome}}, você esqueceu {{produtos}}!" - delay: 5min
2. "Última chance! {{produtos}} por {{total}}" - delay: 60min
3. "Cupom especial 10% OFF: {{link}}"        - delay: 1440min (24h)
```

### Timeline

```
T+0min    │ Webhook recebe carrinho
          │ → Job: process-abandoned-cart
          │   → Cria AbandonedCart (ID: 123)
          │   → Agenda 3 mensagens:
          │     - send-whatsapp-message (delay: 5min)
          │     - send-whatsapp-message (delay: 60min)
          │     - send-whatsapp-message (delay: 1440min)
          │   → Agenda check-cart-recovered (delay: 1452min)

T+5min    │ → Job: send-whatsapp-message #1
          │   → Envia: "Ei João, você esqueceu Camiseta Preta!"
          │   → MessageLog #1: status = 'sent'
          │   → messagesUsed: 0 → 1

T+60min   │ → Job: send-whatsapp-message #2
          │   → Envia: "Última chance! Camiseta Preta por R$ 99,90"
          │   → MessageLog #2: status = 'sent'
          │   → messagesUsed: 1 → 2

T+1440min │ → Job: send-whatsapp-message #3
(24h)     │   → Envia: "Cupom especial 10% OFF: https://..."
          │   → MessageLog #3: status = 'sent'
          │   → messagesUsed: 2 → 3

T+1452min │ → Job: check-cart-recovered
(24h12m)  │   → Status ainda 'pending'
          │   → Re-agenda para +12h

T+2172min │ → Job: check-cart-recovered
(36h12m)  │   → Status ainda 'pending'
          │   → Re-agenda para +12h

...

T+10080min│ → Job: check-cart-recovered
(7 dias)  │   → expiresAt atingido
          │   → Status: 'pending' → 'expired'
```

---

## 📁 Estrutura de Arquivos

```
apps/api/
├── app/
│   ├── jobs/
│   │   ├── queue_service.ts              → Gerenciador central
│   │   ├── process_abandoned_cart.ts     → Job 1
│   │   ├── send_whatsapp_message.ts      → Job 2
│   │   └── check_cart_recovered.ts       → Job 3
│   │
│   ├── providers/
│   │   └── queue_provider.ts             → Provider AdonisJS
│   │
│   ├── controllers/
│   │   └── webhooks/
│   │       └── nuvemshop_webhook_controller.ts  → Dispara fila
│   │
│   └── models/
│       ├── abandoned_cart.ts
│       ├── message_log.ts
│       └── message_template.ts
│
└── adonisrc.ts                           → Registra provider
```

---

## ⚙️ Configuração

### 1. Dependências

```bash
cd apps/api
pnpm add bullmq ioredis
```

### 2. Variáveis de Ambiente

```bash
# .env
REDIS_URL=redis://localhost:6379
```

### 3. Registrar Provider

```typescript
// adonisrc.ts
providers: [
  // ...
  () => import('#providers/queue_provider')
]
```

### 4. Iniciar Redis

```bash
# Via Docker
docker compose up -d redis

# Ou local
redis-server
```

---

## 🚀 Uso

### Disparar Processamento Manual

```typescript
import queueService from '#jobs/queue_service'

// Adicionar carrinho à fila
await queueService.addJob('process-abandoned-cart', {
  tenantId: 1,
  storeIntegrationId: 5,
  externalCartId: 'cart_123456',
  customerName: 'João Silva',
  customerPhone: '11999999999',
  cartUrl: 'https://store.com/checkout/abc',
  totalValue: 199.90,
  items: [
    { id: '1', name: 'Camiseta', quantity: 1, price: 99.90 },
    { id: '2', name: 'Calça', quantity: 1, price: 100.00 },
  ],
})
```

### Cancelar Mensagens de um Carrinho

```typescript
import queueService from '#jobs/queue_service'
import AbandonedCart from '#models/abandoned_cart'

const cart = await AbandonedCart.find(123)
cart.status = 'recovered'
await cart.save()

// Remove jobs pendentes
await queueService.removeCartJobs(cart.id)
```

### Obter Estatísticas

```typescript
const stats = await queueService.getQueueStats('send-whatsapp-message')

console.log(stats)
// {
//   waiting: 15,
//   active: 2,
//   completed: 1843,
//   failed: 23,
//   delayed: 45,
//   total: 62
// }
```

---

## 📊 Monitoramento

### Bull Board (Recomendado)

Instale o Bull Board para monitorar filas visualmente:

```bash
pnpm add @bull-board/api @bull-board/express
```

### Logs

O sistema loga automaticamente:

```
✅ [process-abandoned-cart] Job 123 completed
✅ [send-whatsapp-message] Mensagem 456 enviada (external ID: msg_789)
❌ [send-whatsapp-message] Job 789 failed: WhatsApp not connected
```

### Eventos

Workers emitem eventos:

```typescript
// Em queue_service.ts
worker.on('completed', (job) => {
  console.log(`✅ [${name}] Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`❌ [${name}] Job ${job?.id} failed:`, err.message)
})
```

---

## 🔧 Troubleshooting

### Mensagens não estão sendo enviadas

**Possíveis causas:**

1. **Redis não está rodando**
   ```bash
   docker compose ps redis
   # Deve estar "Up"
   ```

2. **Workers não foram registrados**
   ```bash
   # Verifique logs ao iniciar app:
   ✅ Queue workers registered
   ```

3. **WhatsApp desconectado**
   ```sql
   SELECT status FROM whatsapp_instances WHERE tenant_id = 1;
   -- Deve ser 'connected'
   ```

4. **Limite de mensagens atingido**
   ```sql
   SELECT messages_used, messages_limit FROM subscriptions WHERE tenant_id = 1;
   ```

### Jobs ficam em "failed"

**Verifique:**

1. Logs do worker
2. Status do MessageLog
3. Conectividade com Evolution API
4. Formato do número de telefone

### Mensagens duplicadas

**Causa:** Webhook sendo chamado múltiplas vezes

**Solução:** O job `process-abandoned-cart` já verifica duplicatas:

```typescript
const existingCart = await AbandonedCart.query()
  .where('external_cart_id', externalCartId)
  .first()

if (existingCart) {
  console.log('Carrinho já existe, ignorando')
  return
}
```

### Carrinho não expira

**Verificar:**

1. Job `check-cart-recovered` está rodando?
2. Campo `expires_at` está preenchido?
3. Re-agendamento está funcionando?

```sql
SELECT id, status, expires_at FROM abandoned_carts WHERE id = 123;
```

---

## 📝 Próximas Melhorias

- [ ] **Integração com API da loja** para verificar compra real
- [ ] **Webhook de status de mensagem** (delivered, read)
- [ ] **Painel de monitoramento** com Bull Board
- [ ] **Retry inteligente** baseado em horário comercial
- [ ] **A/B testing** de templates
- [ ] **Analytics** de conversão por template

---

## 🤝 Contribuindo

Para adicionar novos jobs:

1. Criar arquivo em `app/jobs/`
2. Exportar função `async (job: Job<PayloadType>) => Promise<void>`
3. Registrar worker em `providers/queue_provider.ts`
4. Documentar neste arquivo

---

## 📚 Referências

- [BullMQ Documentation](https://docs.bullmq.io/)
- [IORedis Documentation](https://github.com/redis/ioredis)
- [AdonisJS Providers](https://docs.adonisjs.com/guides/fundamentals/service-providers)
- [Evolution API](https://doc.evolution-api.com)
