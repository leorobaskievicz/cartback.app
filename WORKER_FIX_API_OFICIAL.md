# Fix: Workers não processando mensagens da API Oficial

## 🐛 PROBLEMA IDENTIFICADO

### 1. Worker não estava rodando
- O processo `bin/workers.ts` não estava ativo
- Jobs ficam na fila do Redis mas nunca são processados
- **Resultado:** Carrinhos aparecem no dashboard mas nenhuma mensagem é enviada

### 2. Job exigia templates aprovados
- `process_abandoned_cart.ts:126` exigia `meta_status = 'approved'`
- Templates recém-criados ficam em `status = 'pending'` (aguardando aprovação do Meta)
- **Resultado:** Mesmo com worker rodando, jobs não eram criados

### 3. Logs não eram criados
- Como jobs não eram criados, nenhum log aparecia na modal

---

## ✅ CORREÇÕES APLICADAS

### 1. Permitir templates não aprovados (`process_abandoned_cart.ts`)

**Antes (linha 122-128):**
```typescript
const approvedTemplates = await MessageTemplate.query()
  .where('meta_status', 'approved')  // ❌ Muito restritivo!
  .whereNotNull('meta_template_id')
  .orderBy('delay_minutes', 'asc')
```

**Depois (linha 123-127):**
```typescript
const templates = await MessageTemplate.query()
  .where('tenant_id', tenantId)
  .where('trigger_type', 'abandoned_cart')
  .where('is_active', true)  // ✅ Aceita qualquer status!
  .orderBy('delay_minutes', 'asc')
```

**Mudanças:**
- Removida restrição de `meta_status = 'approved'`
- Agora aceita templates em qualquer status: `not_synced`, `pending`, `approved`, `rejected`
- Determina o tipo de envio baseado no status (linha 148-149):
  ```typescript
  const isApproved = template.metaStatus === 'approved' && template.metaTemplateId
  const messageType = isApproved ? 'template' : 'text'
  ```

### 2. Suportar envio como texto (`send_whatsapp_official_message.ts`)

**Antes (linha 58-67):**
```typescript
if (!template || template.metaStatus !== 'approved' || !template.metaTemplateId) {
  officialLog.status = 'failed'
  officialLog.errorMessage = 'Template não encontrado ou não aprovado na Meta'
  await officialLog.save()
  return  // ❌ Falha se não estiver approved!
}
```

**Depois (linha 58-75):**
```typescript
const template = await MessageTemplate.find(templateId)
if (!template) {
  officialLog.status = 'failed'
  officialLog.errorMessage = 'Template não encontrado'
  await officialLog.save()
  return
}

// Verificar se template está aprovado ou será enviado como texto
const isApproved = template.metaStatus === 'approved' && template.metaTemplateId
const sendAsText = !isApproved

if (sendAsText) {
  console.log(
    `[OfficialMsg] Template ${templateId} não aprovado (status: ${template.metaStatus}), enviando como mensagem de texto`
  )
}
```

**Lógica de envio (linha 128-172):**
```typescript
if (sendAsText) {
  // Enviar como mensagem de texto
  let textMessage = template.content || template.bodyText || ''

  // Substituir variáveis Evolution {{nome}}, {{produtos}}
  textMessage = textMessage
    .replace(/\{\{nome\}\}/g, bodyParams[0])
    .replace(/\{\{produtos\}\}/g, bodyParams[1])
    .replace(/\{\{link\}\}/g, bodyParams[2])
    .replace(/\{\{total\}\}/g, bodyParams[3])

  // Substituir variáveis Meta {{1}}, {{2}}, {{3}}, {{4}}
  textMessage = textMessage
    .replace(/\{\{1\}\}/g, bodyParams[0])
    .replace(/\{\{2\}\}/g, bodyParams[1])
    .replace(/\{\{3\}\}/g, bodyParams[2])
    .replace(/\{\{4\}\}/g, bodyParams[3])

  result = await whatsappOfficialService.sendTextMessage(
    credentials,
    cart.customerPhone,
    textMessage
  )
} else {
  // Enviar como template Meta aprovado
  result = await whatsappOfficialService.sendTemplateMessage(credentials, {
    to: cart.customerPhone,
    templateName: template.metaTemplateName!,
    languageCode: template.metaLanguage,
    components: [...]
  })
}
```

---

## 🚀 COMO USAR

### 1. Iniciar Docker (se ainda não estiver rodando)
```bash
# Iniciar Docker Desktop ou
docker-compose up -d
```

### 2. Iniciar o Worker
```bash
cd apps/api
node --import tsx bin/workers.ts
```

### 3. Verificar Workers rodando
```bash
# Deve mostrar: "✅ Workers initialized and running"
```

### 4. Testar criação de carrinho
```bash
# Criar um carrinho via webhook
# O worker processará automaticamente e agendará mensagens
```

---

## 📊 FLUXO COMPLETO

### Cenário 1: Template NÃO aprovado (pending/not_synced)

```
1. Carrinho criado via webhook
   ↓
2. Job 'process-abandoned-cart' detecta template ativo (qualquer status)
   ↓
3. Cria WhatsappOfficialLog com messageType='text'
   ↓
4. Agenda job 'send-whatsapp-official-message' com delay
   ↓
5. Worker executa após delay
   ↓
6. Detecta template não aprovado → sendAsText = true
   ↓
7. Substitui variáveis no content
   ↓
8. Envia via whatsappOfficialService.sendTextMessage()
   ↓
9. ✅ Mensagem enviada como texto
```

### Cenário 2: Template aprovado (approved)

```
1. Carrinho criado via webhook
   ↓
2. Job 'process-abandoned-cart' detecta template approved
   ↓
3. Cria WhatsappOfficialLog com messageType='template'
   ↓
4. Agenda job 'send-whatsapp-official-message' com delay
   ↓
5. Worker executa após delay
   ↓
6. Detecta template aprovado → sendAsText = false
   ↓
7. Monta components com parâmetros
   ↓
8. Envia via whatsappOfficialService.sendTemplateMessage()
   ↓
9. ✅ Mensagem enviada via template Meta
```

---

## 🔍 VERIFICAR LOGS

### Ver jobs na fila
```bash
# No Redis CLI ou Bull Board
# Ver jobs aguardando: waiting, delayed, active, completed, failed
```

### Logs do worker
```bash
# Terminal onde rodou bin/workers.ts
[ProcessCart] Processando carrinho xyz do tenant 1
[ProcessCart] Encontrados 2 template(s) para tenant 1: [...]
[ProcessCart] Mensagem oficial 123 agendada para +60min (text: Template 1, meta_status: pending, job: official-msg-1-1)
[ProcessCart] ✅ Carrinho 1 processado via API Oficial

# Após delay de 60min
[OfficialMsg] Processando envio da mensagem oficial 123
[OfficialMsg] Template 1 não aprovado (status: pending), enviando como mensagem de texto
[OfficialMsg] Enviando como TEXTO (template "Template 1" não aprovado) para 5541999999999
[OfficialMsg] ✅ Mensagem oficial 123 enviada com sucesso
```

### Ver no banco
```sql
-- Ver logs criados
SELECT id, template_name, message_type, status, created_at
FROM whatsapp_official_logs
WHERE tenant_id = 1
ORDER BY created_at DESC;

-- Ver templates
SELECT id, name, meta_status, is_active
FROM message_templates
WHERE tenant_id = 1 AND trigger_type = 'abandoned_cart';
```

---

## ⚠️ IMPORTANTE

### 1. Worker deve estar sempre rodando
- **Desenvolvimento:** `node --import tsx bin/workers.ts`
- **Produção (Railway):** Já configurado via `railway.workers.toml` e `Dockerfile.workers`

### 2. Diferença entre envio como Template vs Texto

| Aspecto | Template Meta | Texto |
|---------|--------------|-------|
| **Requisito** | Template aprovado pela Meta | Qualquer template ativo |
| **Formato** | Estruturado (header, body, footer, buttons) | Texto simples |
| **Variáveis** | Substituídas via `components.parameters` | Substituídas antes do envio |
| **Aprovação Meta** | Necessária (pode levar 24h) | Não necessária |
| **Limitações** | Não pode editar após aprovado | Pode editar a qualquer momento |

### 3. Quando usar cada modo

**Use Template Meta:**
- Templates finalizados e aprovados
- Mensagens com botões interativos
- Melhor formatação e preview no WhatsApp

**Use Texto (fallback):**
- Templates recém-criados (aguardando aprovação)
- Templates em teste
- Quando precisa de flexibilidade para editar

---

## 🐛 TROUBLESHOOTING

### Worker não inicia
```bash
# Verificar Redis
docker ps | grep redis

# Verificar logs de erro
node --import tsx bin/workers.ts
# Procure por erros de conexão Redis
```

### Jobs não são processados
```bash
# Verificar se worker está ativo
ps aux | grep workers.ts

# Ver fila no Redis
redis-cli
> KEYS bull:*
> LLEN bull:send-whatsapp-official-message:waiting
```

### Mensagens não são enviadas
```bash
# Ver logs do worker (terminal)
# Procure por:
[OfficialMsg] ❌ Erro ao enviar mensagem X: [mensagem de erro]

# Verificar credenciais API Oficial
SELECT * FROM whatsapp_official_credentials WHERE tenant_id = 1;
# Checar: is_active = 1, status = 'active', token_expires_at > NOW()
```

### Template sempre envia como texto
```bash
# Verificar status do template
SELECT id, name, meta_status, meta_template_id
FROM message_templates
WHERE id = X;

# Para enviar como template Meta:
# - meta_status = 'approved'
# - meta_template_id IS NOT NULL
```

---

**Data da correção:** 2026-02-23
**Arquivos modificados:**
- `apps/api/app/jobs/process_abandoned_cart.ts`
- `apps/api/app/jobs/send_whatsapp_official_message.ts`
