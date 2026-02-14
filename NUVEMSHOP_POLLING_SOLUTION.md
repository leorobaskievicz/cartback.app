# 🔄 Nuvemshop: Solução via Polling API (Sem Script)

## 🎯 Visão Geral

Esta é a solução **SEM script JavaScript** para detectar carrinhos abandonados na Nuvemshop.

### Como Funciona

O CartBack **busca periodicamente** (a cada 30 minutos) os carrinhos abandonados via API REST da Nuvemshop:

```
1. Job roda a cada 30 minutos (cron: */30 * * * *)
2. Para cada integração Nuvemshop ativa:
   - Chama GET /v1/{store_id}/checkouts
   - Filtra carrinhos das últimas 24 horas
   - Pula carrinhos sem telefone
   - Adiciona na fila de processamento
3. Job "process-abandoned-cart" processa cada carrinho
4. Mensagens WhatsApp são agendadas conforme templates
```

---

## ✅ Vantagens (vs Script)

### 1. **Simplicidade**
- ✅ Não precisa criar script no Partner Portal
- ✅ Não precisa publicar script
- ✅ Não precisa associar script à loja
- ✅ **Só precisa conectar via OAuth** (botão "Conectar Nuvemshop")

### 2. **Confiabilidade**
- ✅ 100% de cobertura (não depende de JS do cliente)
- ✅ Funciona mesmo se cliente bloquear JavaScript
- ✅ Funciona mesmo se aba for fechada muito rápido
- ✅ Não afetado por Content Security Policy (CSP)

### 3. **Manutenção**
- ✅ Menos pontos de falha
- ✅ Menos dependências externas
- ✅ Mais fácil de debugar (tudo server-side)

---

## ⚠️ Desvantagens (vs Script)

### 1. **Latência**
- ❌ Detecção em **30-60 minutos** (vs 1-5 segundos do script)
- ❌ Cliente recebe primeira mensagem ~30 min após abandonar
- ❌ Menos "tempo real"

### 2. **Limitações da API Nuvemshop**
- ⚠️ Carrinhos são marcados como "abandoned" até **6 horas** após o abandono
- ⚠️ Rate limits: 2 requests/segundo (600/5min, 5000/hora)
- ⚠️ Polling frequente consome quota da API

---

## 🔧 Configuração

### ✅ O Que Já Está Configurado

1. **Job de polling**: `apps/api/app/jobs/poll_nuvemshop_abandoned_carts.ts`
2. **Worker registrado**: `apps/api/bin/workers.ts`
3. **Cron configurado**: `*/30 * * * *` (a cada 30 minutos)

### ✅ O Que Você Precisa Fazer

**Apenas 1 passo:**

1. **Conectar Nuvemshop** em https://cartback.app/integrations
   - Clique em "Conectar Nuvemshop"
   - Autorize o app
   - Pronto! ✅

**Não precisa:**
- ❌ Criar script no Partner Portal
- ❌ Publicar script
- ❌ Configurar NUVEMSHOP_SCRIPT_ID
- ❌ Associar script à loja

---

## 📊 Frequências de Polling Disponíveis

Você pode ajustar a frequência editando `apps/api/bin/workers.ts`:

```typescript
// Linha 44:
pattern: '*/30 * * * *', // ← Editar aqui
```

### Opções Recomendadas:

| Frequência | Cron | Quando Usar |
|------------|------|-------------|
| **A cada 15 min** | `*/15 * * * *` | Alto volume, quer rapidez |
| **A cada 30 min** | `*/30 * * * *` | **Recomendado** (equilíbrio) |
| **A cada 1 hora** | `0 * * * *` | Baixo volume, economizar API |
| **A cada 2 horas** | `0 */2 * * *` | Muito baixo volume |
| **2x por dia** | `0 6,18 * * *` | Apenas como backup do script |

### 🎯 Recomendação:

**30 minutos** é um bom equilíbrio:
- Detecta carrinhos em até 30-60 minutos
- Não sobrecarrega API da Nuvemshop
- Suficiente para recuperação efetiva
- Cliente ainda está "quente" (lembra da compra)

---

## 🧪 Como Testar

### Teste 1: Criar Carrinho Abandonado

1. **Acesse sua loja**: https://cartback.lojavirtualnuvem.com.br
2. **Adicione produtos** ao carrinho
3. **Vá para o checkout**
4. **Preencha:**
   - Nome: Teste Polling
   - Email: teste@cartback.com
   - **Telefone: 5541999999999** (seu número real!)
   - CEP: 80000-000
5. **Não finalize** a compra - apenas feche a aba

### Teste 2: Aguardar Polling

**Atenção:** A Nuvemshop demora até **6 horas** para marcar o checkout como "abandoned" na API.

Mas para testar mais rápido, você pode **forçar o job manualmente**:

```bash
# No Railway ou localmente
railway run --service cartback-workers node --import tsx bin/workers.ts
```

Ou via código (criar endpoint temporário):

```typescript
// Criar em routes.ts:
router.get('/api/test/poll-nuvemshop', async ({ response }) => {
  const queueService = await container.make('queue_service')
  await queueService.addJob('poll-nuvemshop-carts', {})
  return response.ok({ message: 'Polling job enqueued' })
})
```

### Teste 3: Verificar Logs

```bash
# Ver logs do polling
railway logs --service cartback-workers -f | grep "Poll Nuvemshop"
```

**Logs esperados:**

```
[Poll Nuvemshop] Iniciando busca de carrinhos abandonados...
[Poll Nuvemshop] Encontradas 1 integrações ativas
[Poll Nuvemshop] Buscando carrinhos da loja cartback (ID: 7277526)...
[Poll Nuvemshop] Loja cartback: 5 carrinhos encontrados
[Poll Nuvemshop] Carrinho 123456 adicionado à fila (cliente: Teste Polling)
[Poll Nuvemshop] ✅ Concluído: 5 carrinhos encontrados, 3 adicionados à fila
```

### Teste 4: Verificar no Painel

1. Aguarde até 60 minutos (30 min do polling + tempo da Nuvemshop)
2. Acesse https://cartback.app/carts
3. Seu carrinho deve aparecer lá!

---

## 🔍 Troubleshooting

### ❌ Polling não roda

**Verificar se workers estão rodando:**

```bash
railway logs --service cartback-workers -f
```

**Deve aparecer ao iniciar:**
```
✅ Workers initialized and running
🔄 Polling Nuvemshop: a cada 30 minutos via API REST
```

**Se não aparecer:**
- Verificar se service `cartback-workers` está deployado no Railway
- Verificar se não há erros de inicialização

---

### ❌ "Nenhuma integração ativa encontrada"

**Causa:** Nuvemshop não está conectada

**Solução:**
1. Ir em https://cartback.app/integrations
2. Conectar Nuvemshop
3. Aguardar próximo polling (30 min)

---

### ❌ "Loja cartback: 0 carrinhos encontrados"

**Possíveis causas:**

1. **Carrinhos ainda não foram marcados como "abandoned"**
   - Nuvemshop demora até 6 horas
   - Aguardar mais tempo

2. **Carrinhos são mais antigos que 24 horas**
   - Polling busca apenas últimas 24 horas
   - Editar linha 50 de `poll_nuvemshop_abandoned_carts.ts`:
     ```typescript
     const since = DateTime.now().minus({ hours: 48 }).toISO() // buscar 48h
     ```

3. **Access Token expirado**
   - Desconectar e reconectar Nuvemshop

---

### ❌ Erro 429 (Rate Limit)

**Causa:** Muitas requisições à API da Nuvemshop

**Solução:**
- Reduzir frequência do polling
- Mudar de `*/30 * * * *` para `0 * * * *` (1 hora)

---

## 📈 Otimizações Futuras

### 1. **Polling Incremental**

Ao invés de buscar sempre as últimas 24 horas, salvar o ID do último carrinho processado:

```typescript
// Buscar apenas carrinhos novos
const lastCheckoutId = await getLastProcessedCheckoutId(integration.id)

const abandonedCheckouts = await nuvemshopService.listAbandonedCheckouts(
  parseInt(integration.storeId),
  integration.accessToken,
  {
    since_id: lastCheckoutId, // Apenas carrinhos após este ID
  }
)
```

**Vantagem:** Menos dados transferidos, mais rápido, menos quota da API.

### 2. **Polling Adaptativo**

Ajustar frequência baseado no volume:

```typescript
// Se tem muitos carrinhos: aumenta frequência
// Se tem poucos: diminui frequência

const cartsLastHour = await getCartsCount(integration.id, 1)

if (cartsLastHour > 10) {
  pattern = '*/15 * * * *' // A cada 15 min
} else if (cartsLastHour > 2) {
  pattern = '*/30 * * * *' // A cada 30 min
} else {
  pattern = '0 * * * *' // A cada 1 hora
}
```

### 3. **Combinar Polling + Webhook de Pedido**

Usar polling para **detectar abandono** e webhook de `order/created` para **detectar recuperação**:

✅ Já implementado! O webhook de `order/created` já marca carrinhos como recuperados.

---

## ✅ Checklist de Deploy

- [x] Job de polling criado (`poll_nuvemshop_abandoned_carts.ts`)
- [x] Worker registrado (`workers.ts`)
- [x] Cron configurado (30 minutos)
- [x] Tratamento de duplicatas (via `externalCartId`)
- [x] Validação de telefone obrigatório
- [x] Webhook de `order/created` para recuperação
- [ ] Integração Nuvemshop conectada (você precisa fazer!)
- [ ] Workers rodando no Railway (`cartback-workers`)
- [ ] Teste com carrinho real

---

## 🎯 Resumo: Como Usar

### Setup (1 vez):

1. ✅ Conectar Nuvemshop em https://cartback.app/integrations
2. ✅ Aguardar 30 minutos
3. ✅ Verificar logs: `railway logs --service cartback-workers`

### Funcionamento (automático):

1. 🔄 Job roda a cada 30 minutos
2. 🔍 Busca carrinhos abandonados na Nuvemshop
3. 📦 Adiciona à fila de processamento
4. 📱 Mensagens WhatsApp são enviadas conforme templates

---

## 🆚 Decisão: Script vs Polling?

### Use **Script** se:
- ✅ Quer detecção **instantânea** (1-5 segundos)
- ✅ Tem tempo para configurar Partner Portal
- ✅ Não se importa com configuração complexa

### Use **Polling** (esta solução) se:
- ✅ Quer solução **simples** e confiável
- ✅ 30-60 minutos de latência é aceitável
- ✅ Quer evitar problemas com script JS
- ✅ **Recomendado para começar!** 👍

---

## 📚 Arquivos Relacionados

- **Job**: `apps/api/app/jobs/poll_nuvemshop_abandoned_carts.ts`
- **Worker**: `apps/api/bin/workers.ts` (linha 38-50)
- **Service**: `apps/api/app/services/nuvemshop_service.ts`
- **Controller**: `apps/api/app/controllers/store_integrations_controller.ts`

---

**Última atualização:** 14/02/2026
**Status:** ✅ Implementado e pronto para uso
