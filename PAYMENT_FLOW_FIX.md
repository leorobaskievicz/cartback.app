# 🔒 Correção do Fluxo de Pagamento - Ativação Segura de Planos

## 🐛 Problema Identificado

O sistema estava **ativando o plano imediatamente** ao criar a subscription no Asaas, mesmo para PIX/Boleto que ainda não foram pagos.

**Comportamento anterior (ERRADO):**
```
1. Usuário escolhe plano Pro via Boleto
2. Sistema cria subscription no Asaas ✓
3. Sistema muda plano de "trial" para "pro" ✗ (PROBLEMA!)
4. Status fica "pending" mas plano já mudou ✗
5. Usuário cancela no painel Asaas
6. CartBack ainda mostra plano Pro ativo ✗✗
```

---

## ✅ Solução Implementada

### 1. Novo Campo no Banco: `target_plan`

Adicionada coluna na tabela `payment_histories`:

```sql
ALTER TABLE payment_histories
ADD COLUMN target_plan VARCHAR(20) NULL AFTER subscription_id;
```

Este campo **armazena qual plano foi escolhido** para ativar quando o pagamento for confirmado.

---

### 2. Lógica Corrigida no `plan_service.ts`

#### A) Criação de Subscription (PIX/Boleto)

```typescript
if (billingType === 'CREDIT_CARD') {
  // Cartão: ativa imediatamente
  subscription.plan = plan
  subscription.status = 'active'
  subscription.messagesLimit = planLimits.messagesLimit
  subscription.currentPeriodStart = DateTime.now()
  subscription.currentPeriodEnd = DateTime.now().plus({ months: 1 })
  subscription.trialEndsAt = null
} else {
  // PIX/Boleto: mantém plano atual e status pending
  subscription.status = 'pending'
  // NÃO muda o plano ainda!
}
```

#### B) Registro no PaymentHistory

```typescript
const paymentHistory = await PaymentHistory.create({
  // ...
  targetPlan: plan, // ← Armazena o plano escolhido
  status: billingType === 'CREDIT_CARD' ? 'confirmed' : 'pending',
  // ...
})
```

#### C) Webhook de Confirmação

```typescript
async handlePaymentConfirmed(externalPaymentId: string) {
  const paymentHistory = await PaymentHistory.query()
    .where('externalPaymentId', externalPaymentId)
    .first()

  if (!paymentHistory) return

  // Atualiza status do payment
  paymentHistory.status = 'confirmed'
  paymentHistory.paidAt = DateTime.now()
  await paymentHistory.save()

  // Ativa subscription e aplica o plano escolhido
  const subscription = await Subscription.find(paymentHistory.subscriptionId)
  if (subscription && subscription.status !== 'active') {
    subscription.status = 'active'

    // Ativa o plano que estava pendente
    if (paymentHistory.targetPlan) {
      const planLimits = getPlanLimits(paymentHistory.targetPlan as PlanType)
      subscription.plan = paymentHistory.targetPlan as PlanType
      subscription.messagesLimit = planLimits.messagesLimit
      subscription.messagesUsed = 0
      subscription.currentPeriodStart = DateTime.now()
      subscription.currentPeriodEnd = DateTime.now().plus({ months: 1 })
      subscription.trialEndsAt = null
    }

    await subscription.save()
  }
}
```

---

## 📊 Fluxo Correto Agora

### Cenário 1: Cartão de Crédito ✅

```
1. Usuário escolhe plano Pro via Cartão
2. Sistema tokeniza cartão
3. Asaas processa pagamento
4. ✅ Se aprovado:
   - Plan = 'pro'
   - Status = 'active'
   - Ativação IMEDIATA
5. ✅ PaymentHistory.targetPlan = 'pro'
6. ✅ PaymentHistory.status = 'confirmed'
```

**Resultado:** Plano ativo instantaneamente! 🎉

---

### Cenário 2: PIX/Boleto (Aguardando Pagamento) ✅

```
1. Usuário escolhe plano Pro via Boleto
2. Asaas gera boleto
3. ✅ Subscription mantém:
   - Plan = 'trial' (não muda!)
   - Status = 'pending'
4. ✅ PaymentHistory criado com:
   - targetPlan = 'pro' (para ativar depois)
   - status = 'pending'
5. ✅ Usuário vê:
   - Plano atual: Trial
   - Status: Aguardando pagamento
```

**Resultado:** Plano não muda até pagar! ✅

---

### Cenário 3: Pagamento Confirmado (Webhook) ✅

```
1. Asaas confirma pagamento do boleto
2. Webhook chega: PAYMENT_CONFIRMED
3. ✅ Sistema busca PaymentHistory pelo externalPaymentId
4. ✅ Pega o targetPlan = 'pro'
5. ✅ Ativa subscription:
   - Plan = 'pro'
   - Status = 'active'
   - Messages = 2000
   - Período resetado
6. ✅ Usuário vê plano Pro ativo
```

**Resultado:** Plano ativado após confirmação! 🎊

---

### Cenário 4: Pagamento Cancelado ✅

```
1. Usuário cria boleto mas não paga
2. Cancela no painel Asaas
3. ✅ CartBack mantém:
   - Plan = 'trial'
   - Status = 'pending'
4. ✅ PaymentHistory.targetPlan = 'pro' (registrado mas não ativo)
5. ✅ Trial continua normalmente
```

**Resultado:** Não perde o trial se cancelar! ✅

---

## 🧪 Como Testar

### 1. Limpar Dados Antigos (Opcional)

Se já tinha testado antes e ficou com dados inconsistentes:

```sql
-- Via docker
docker exec cartback-mysql mysql -u cartback -pcartback cartback -e "
  UPDATE subscriptions SET plan = 'trial', status = 'trial' WHERE tenant_id = 1;
  DELETE FROM payment_histories WHERE tenant_id = 1;
"
```

### 2. Teste 1: Cartão (Ativação Imediata)

1. **Ir em Planos** → Escolher **Pro**
2. **Selecionar Cartão**
3. Preencher dados de teste:
   - Número: `5162306219378829`
   - CVV: `318`
4. **Confirmar**

**Resultado esperado:**
- ✅ Plano muda para "Pro" IMEDIATAMENTE
- ✅ Status = "active"
- ✅ Mensagens: 2000

### 3. Teste 2: Boleto (Aguarda Pagamento)

1. **Ir em Planos** → Escolher **Pro**
2. **Selecionar Boleto**
3. **Confirmar**

**Resultado esperado:**
- ✅ Plano continua "Trial"
- ✅ Status = "pending"
- ✅ Mensagens: 100 (do trial)
- ✅ Boleto gerado

**Verificar no banco:**
```sql
SELECT plan, status FROM subscriptions WHERE tenant_id = 1;
-- plan = 'trial', status = 'pending' ✓

SELECT target_plan, status FROM payment_histories WHERE tenant_id = 1 ORDER BY id DESC LIMIT 1;
-- target_plan = 'pro', status = 'pending' ✓
```

### 4. Teste 3: Simular Confirmação de Pagamento

```bash
# Pegar o externalPaymentId do payment_history
curl -X POST http://localhost:3333/api/webhooks/asaas \
  -H "asaas-access-token: cartback_webhook_secret_token_2024" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PAYMENT_CONFIRMED",
    "payment": {
      "id": "PAY_ID_DO_BANCO"
    }
  }'
```

**Resultado esperado após webhook:**
- ✅ Plano muda para "Pro"
- ✅ Status = "active"
- ✅ Mensagens = 2000
- ✅ Período resetado

---

## 📝 Arquivos Modificados

### Backend

1. **`database/migrations/15_add_target_plan_to_payment_histories.ts`** (NOVO)
   - Adiciona coluna `target_plan`

2. **`app/models/payment_history.ts`**
   - Adiciona propriedade `targetPlan`

3. **`app/services/plan_service.ts`**
   - Modificado `startPaidSubscription()`: Não muda plano se PIX/Boleto
   - Modificado `handlePaymentConfirmed()`: Ativa plano do `targetPlan`
   - Salva `targetPlan` no PaymentHistory

---

## ✅ Checklist de Validação

- [x] Migration rodada (coluna `target_plan` criada)
- [x] Model atualizado com novo campo
- [x] Lógica de criação não muda plano para PIX/Boleto
- [x] Lógica de criação muda plano para Cartão
- [x] targetPlan salvo no PaymentHistory
- [x] Webhook ativa plano quando confirma pagamento
- [x] Trial mantido se pagamento não for confirmado

---

## 🎯 Vantagens da Nova Abordagem

### ✅ Segurança
- Plano só é alterado **após confirmação** do pagamento
- Impossível usar plano pago sem pagar

### ✅ Transparência
- Usuário vê exatamente o que tem acesso
- Status "pending" indica aguardando pagamento

### ✅ Rastreabilidade
- Campo `targetPlan` registra intenção de compra
- Fácil auditar e debugar problemas

### ✅ Experiência do Usuário
- Trial não é perdido se cancelar pagamento
- Pode testar múltiplos planos sem risco

---

## 🚀 Próximos Passos (Futuro)

### Melhorias Possíveis:

1. **Expiração de Pagamentos Pendentes**
   - Job para cancelar pagamentos não pagos após 7 dias
   - Limpar subscriptions pendentes antigas

2. **Notificações**
   - Email quando pagamento for confirmado
   - Lembrete se boleto não for pago

3. **Dashboard de Pagamentos**
   - Mostrar pagamentos pendentes
   - Link para pagar boleto

4. **Retry de Pagamentos Falhos**
   - Permitir gerar novo boleto
   - Retry automático de cartão recusado

---

## 📚 Referências

- **Asaas Webhooks**: https://docs.asaas.com/docs/webhooks
- **Fluxo de Pagamento Seguro**: https://stripe.com/docs/payments/payment-intents

---

**✅ Correção Aplicada com Sucesso!**

Agora o sistema garante que o plano só é ativado após confirmação do pagamento, mantendo a segurança e transparência do processo.
