# Fix: Logs não aparecem na modal de detalhes do carrinho

## 🐛 PROBLEMA

Quando um carrinho é criado via webhook, **os logs programados não aparecem** na modal de "Histórico de Mensagens", mesmo que estejam criados no banco com status `'queued'`.

### Causa Raiz

O controller `abandoned_carts_controller.ts` (método `show`) estava buscando **apenas** logs da Evolution API (`MessageLog`), mas **não estava buscando** logs da API Oficial (`WhatsappOfficialLog`).

```typescript
// ❌ Antes - Buscava SOMENTE Evolution API
const messageLogs = await MessageLog.query()
  .where('abandoned_cart_id', cart.id)
  .preload('messageTemplate')
  .orderBy('created_at', 'asc')
```

Quando a API Oficial está configurada, o job `process_abandoned_cart` cria registros em `whatsapp_official_logs` (linha 144-154), mas o endpoint não estava retornando esses logs para o frontend.

---

## ✅ CORREÇÕES APLICADAS

### 1. Backend: Buscar AMBOS os tipos de logs

**Arquivo:** `apps/api/app/controllers/abandoned_carts_controller.ts`

**Mudanças:**

1. Adicionados imports:
```typescript
import WhatsappOfficialLog from '#models/whatsapp_official_log'
import MessageTemplate from '#models/message_template'
```

2. Buscar logs da Evolution API:
```typescript
const messageLogs = await MessageLog.query()
  .where('abandoned_cart_id', cart.id)
  .preload('messageTemplate')
  .orderBy('created_at', 'asc')
```

3. Buscar logs da API Oficial:
```typescript
const officialLogs = await WhatsappOfficialLog.query()
  .where('abandoned_cart_id', cart.id)
  .orderBy('created_at', 'asc')
```

4. Buscar templates dos logs oficiais:
```typescript
const officialTemplateIds = officialLogs
  .map((log) => log.officialTemplateId)
  .filter((id) => id !== null)
const officialTemplates = await MessageTemplate.query().whereIn('id', officialTemplateIds)
const templateMap = new Map(officialTemplates.map((t) => [t.id, t]))
```

5. Mesclar ambos os arrays:
```typescript
const allMessages = [
  ...messageLogs.map((log) => ({
    id: `msg-${log.id}`,
    type: 'evolution' as const,
    templateName: log.messageTemplate.name,
    delayMinutes: log.messageTemplate.delayMinutes,
    content: log.content,
    status: log.status,
    sentAt: log.sentAt,
    deliveredAt: log.deliveredAt,
    readAt: log.readAt,
    errorMessage: log.errorMessage,
    createdAt: log.createdAt,
  })),
  ...officialLogs.map((log) => {
    const template = log.officialTemplateId ? templateMap.get(log.officialTemplateId) : null
    return {
      id: `official-${log.id}`,
      type: 'official' as const,
      templateName: log.templateName,
      delayMinutes: template?.delayMinutes || null,
      messageType: log.messageType,
      languageCode: log.languageCode,
      status: log.status,
      sentAt: log.sentAt,
      metaMessageId: log.metaMessageId,
      errorMessage: log.errorMessage,
      createdAt: log.createdAt,
    }
  }),
]
```

6. Ordenar por `createdAt`:
```typescript
allMessages.sort((a, b) => {
  const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
  const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
  return dateA - dateB
})
```

7. Retornar array mesclado:
```typescript
return response.ok({
  success: true,
  data: {
    cart: { ... },
    messages: allMessages,  // ✅ Agora contém logs de ambas as APIs
  },
})
```

---

### 2. Frontend: Exibir logs da API Oficial

**Arquivo:** `apps/web/src/pages/Carts.tsx`

**Mudanças:**

1. Adicionado suporte ao status `'queued'`:
```typescript
const getStatusInfo = () => {
  switch (message.status) {
    case 'queued':
      return { label: 'Na fila', color: 'info' as const, icon: <Send fontSize="small" /> }
    case 'sent':
      return { label: 'Enviada', color: 'success' as const, icon: <Send fontSize="small" /> }
    // ... outros status
  }
}
```

2. Detectar tipo de API e tipo de mensagem:
```typescript
const apiType = message.type === 'official' ? 'API Oficial' : 'Evolution API'
const messageTypeLabel = message.messageType === 'template' ? 'Template Meta' : message.messageType === 'text' ? 'Texto' : ''
```

3. Mostrar informações da API Oficial:
```typescript
{message.type === 'official' && (
  <Typography variant="caption" color="primary" display="block">
    {apiType} {messageTypeLabel && `• ${messageTypeLabel}`}
  </Typography>
)}
```

4. Ajustar exibição de data agendada para logs `queued`:
```typescript
{scheduledAt && message.status === 'queued' && (
  <Typography variant="caption" color="text.secondary" display="block">
    Agendado para: {scheduledAt.format('DD/MM/YYYY HH:mm')}
  </Typography>
)}
```

---

## 🎯 RESULTADO

Agora, quando um carrinho é criado:

### Cenário 1: API Oficial Configurada

1. Webhook recebe carrinho
2. Job `process-abandoned-cart` cria registros em `whatsapp_official_logs` com status `'queued'`
3. Endpoint `GET /api/carts/:id` retorna ambos Evolution + Oficial
4. Frontend exibe na modal:
   ```
   📍 Template Recuperação 1h
   Status: Na fila
   API Oficial • Template Meta (ou Texto)
   Agendado para: 23/02/2026 15:30
   ```

### Cenário 2: Somente Evolution API

1. Webhook recebe carrinho
2. Job `process-abandoned-cart` cria registros em `message_logs` com status `'queued'`
3. Endpoint retorna logs normalmente
4. Frontend exibe na modal:
   ```
   📍 Template Recuperação 1h
   Status: Na fila
   Agendado para: 23/02/2026 15:30
   ```

---

## 📊 ESTRUTURA DO RESPONSE

### Antes (❌ Incompleto)
```json
{
  "success": true,
  "data": {
    "cart": { ... },
    "messages": [
      // SOMENTE logs da Evolution API
      {
        "id": 1,
        "templateName": "Recuperação 1h",
        "status": "queued",
        ...
      }
    ]
  }
}
```

### Depois (✅ Completo)
```json
{
  "success": true,
  "data": {
    "cart": { ... },
    "messages": [
      // Logs da Evolution API
      {
        "id": "msg-1",
        "type": "evolution",
        "templateName": "Recuperação 1h",
        "status": "queued",
        ...
      },
      // Logs da API Oficial
      {
        "id": "official-1",
        "type": "official",
        "templateName": "recuperacao_1h_1234567890",
        "messageType": "template",
        "status": "queued",
        ...
      }
    ]
  }
}
```

---

## 🔍 VERIFICAÇÃO

### Ver logs no banco
```sql
-- Logs da Evolution API
SELECT id, status, template_name, created_at
FROM message_logs
WHERE abandoned_cart_id = 123;

-- Logs da API Oficial
SELECT id, status, template_name, message_type, created_at
FROM whatsapp_official_logs
WHERE abandoned_cart_id = 123;
```

### Testar endpoint
```bash
# Deve retornar ambos os tipos de logs
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3333/api/carts/123
```

---

## ⚠️ IMPORTANTE

1. **Worker deve estar rodando**: Os logs são criados pelo job `process-abandoned-cart`, que só roda se o worker estiver ativo.

2. **Logs são criados imediatamente**: Mesmo que o worker não envie as mensagens (porque está parado), os logs com status `'queued'` são criados no momento que o carrinho é processado.

3. **API Oficial tem prioridade**: Se a API Oficial estiver configurada, todos os templates (aprovados ou não) são enviados via API Oficial. Se não estiver, usa Evolution API.

---

**Data da correção:** 2026-02-23

**Arquivos modificados:**
- `apps/api/app/controllers/abandoned_carts_controller.ts` (linhas 1-160)
- `apps/web/src/pages/Carts.tsx` (linhas 408-470)
