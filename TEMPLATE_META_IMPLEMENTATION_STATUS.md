# Status da Implementação - Templates Meta WhatsApp API

## ✅ O QUE JÁ ESTÁ PRONTO

### Backend (100% Completo)

1. **Validator** (`apps/api/app/validators/message_template.ts`)
   - Aceita modo simples (Evolution) e modo Meta
   - Validação de header, body, footer, buttons
   - Suporte a todos os tipos de header (TEXT, IMAGE, VIDEO, DOCUMENT)

2. **Controller** (`apps/api/app/controllers/message_templates_controller.ts`)
   - Detecta `metaMode=true` no request
   - Constrói components Meta automaticamente
   - Gera examples para variáveis
   - Salva metaComponents no banco

3. **Template Sync Service** (`apps/api/app/services/template_sync_service.ts`)
   - Usa metaComponents se disponível
   - Fallback para conversão simples
   - Mantém compatibilidade com Evolution API

### Frontend (80% Completo)

1. **TemplateFormDialog** (`apps/web/src/components/templates/TemplateFormDialog.tsx`)
   - ✅ Modo duplo: Simples (Evolution) / Completo (Meta)
   - ✅ Campos de header: NONE, TEXT, IMAGE, VIDEO, DOCUMENT
   - ✅ Body com contador de variáveis {{1}}, {{2}}...
   - ✅ Footer (máx 60 caracteres)
   - ✅ Botões: QUICK_REPLY (3), URL (2), PHONE_NUMBER (1)
   - ✅ Validação e exemplos automáticos
   - ✅ Interface com tabs

2. **API Service** (`apps/web/src/services/api.ts`)
   - ✅ templatesApi.create() atualizado para aceitar `any`
   - ✅ whatsappOfficialApi.getCredentials() já existe para verificar se tem API Oficial ativa

## 🔄 O QUE FALTA (20%)

### Integração do Formulário na Página

**Arquivo:** `apps/web/src/pages/Templates.tsx`

**O que precisa ser feito:**

1. **Importar o novo componente:**
```tsx
import TemplateFormDialog from '../components/templates/TemplateFormDialog'
```

2. **Adicionar estado para verificar API Oficial:**
```tsx
const [hasOfficialApi, setHasOfficialApi] = useState(false)

useEffect(() => {
  loadOfficialApiStatus()
}, [])

const loadOfficialApiStatus = async () => {
  try {
    const res = await whatsappOfficialApi.getCredentials()
    setHasOfficialApi(res.data.data.configured && res.data.data.credential?.isActive === true)
  } catch {
    setHasOfficialApi(false)
  }
}
```

3. **Substituir o Dialog antigo por TemplateFormDialog:**
```tsx
<TemplateFormDialog
  open={dialogOpen}
  onClose={handleCloseDialog}
  onSave={handleSave}
  template={currentTemplate}
  loading={saveLoading}
  hasOfficialApi={hasOfficialApi}
/>
```

4. **Atualizar handleSave para enviar metaMode:**
```tsx
const handleSave = async (data: any, isMetaMode: boolean) => {
  const payload = isMetaMode
    ? { ...data, metaMode: true }
    : {
        name: data.name,
        content: data.content,
        delayMinutes: data.delayMinutes,
        isActive: data.isActive,
      }

  if (currentTemplate) {
    await templatesApi.update(currentTemplate.id, payload)
  } else {
    await templatesApi.create(payload)
  }

  await loadTemplates()
}
```

5. **Remover código do formulário antigo:**
   - Remover o Dialog atual (linhas ~450-550)
   - Remover estado formData antigo
   - Manter apenas TemplateFormDialog

## 🧪 COMO TESTAR

### 1. Rodar as migrations (SE AINDA NÃO RODOU):
```sql
-- Execute no MySQL Railway
ALTER TABLE message_templates
ADD COLUMN meta_template_id VARCHAR(255) NULL AFTER sort_order,
ADD COLUMN meta_template_name VARCHAR(255) NULL AFTER meta_template_id,
ADD COLUMN meta_status ENUM('pending', 'approved', 'rejected', 'not_synced') DEFAULT 'not_synced' AFTER meta_template_name,
ADD COLUMN meta_language VARCHAR(10) DEFAULT 'pt_BR' AFTER meta_status,
ADD COLUMN meta_category ENUM('MARKETING', 'UTILITY') DEFAULT 'MARKETING' AFTER meta_language,
ADD COLUMN meta_components JSON NULL AFTER meta_category,
ADD COLUMN meta_rejection_reason TEXT NULL AFTER meta_components,
ADD COLUMN synced_at TIMESTAMP NULL AFTER meta_rejection_reason;

ALTER TABLE whatsapp_official_credentials
ADD COLUMN token_expires_at DATETIME NULL AFTER access_token;
```

### 2. Deploy do backend:
```bash
git push origin develop
```

### 3. Testar criação de template:

**Modo Simples (Evolution API):**
```json
POST /api/templates
{
  "name": "Teste Evolution",
  "content": "Oi {{nome}}! Seus produtos: {{produtos}}. Total: {{total}}",
  "delayMinutes": 60,
  "isActive": true
}
```

**Modo Meta Completo:**
```json
POST /api/templates
{
  "name": "Teste Meta Completo",
  "metaMode": true,
  "metaLanguage": "pt_BR",
  "metaCategory": "MARKETING",
  "headerType": "TEXT",
  "headerText": "Oferta Especial!",
  "bodyText": "Oi {{1}}! Vi que você deixou itens no carrinho 🛒\n\n{{2}}\n\nTotal: {{3}}\n\nFinalize aqui: {{4}}",
  "footerText": "Válido até 20/02/2026",
  "buttons": [
    { "type": "QUICK_REPLY", "text": "Finalizar Compra" },
    { "type": "URL", "text": "Ver Carrinho", "url": "https://loja.com/cart" }
  ],
  "delayMinutes": 60,
  "isActive": true
}
```

## 📚 ESTRUTURA DE COMPONENTS META

### Header (opcional):
- **TEXT**: `{ type: 'HEADER', format: 'TEXT', text: 'Texto', example: { header_text: ['Exemplo'] } }`
- **IMAGE**: `{ type: 'HEADER', format: 'IMAGE', example: { header_handle: ['https://...'] } }`
- **VIDEO**: `{ type: 'HEADER', format: 'VIDEO', example: { header_handle: ['https://...'] } }`
- **DOCUMENT**: `{ type: 'HEADER', format: 'DOCUMENT', example: { header_handle: ['https://...'] } }`

### Body (obrigatório):
```json
{
  "type": "BODY",
  "text": "Oi {{1}}! Texto com variáveis {{2}}, {{3}}...",
  "example": {
    "body_text": [["João", "Produto X", "R$ 100,00"]]
  }
}
```

### Footer (opcional):
```json
{
  "type": "FOOTER",
  "text": "Texto fixo sem variáveis (máx 60 chars)"
}
```

### Buttons (opcional):
```json
{
  "type": "BUTTONS",
  "buttons": [
    { "type": "QUICK_REPLY", "text": "Sim" },
    { "type": "URL", "text": "Abrir Site", "url": "https://..." },
    { "type": "PHONE_NUMBER", "text": "Ligar", "phone_number": "+5511999999999" }
  ]
}
```

## ✨ BENEFÍCIOS

1. **Compatibilidade Dual:**
   - Evolution API: usa formato simples (`content`)
   - Meta API: usa formato completo (`metaComponents`)

2. **Auto-sync Inteligente:**
   - Templates simples são convertidos automaticamente
   - Templates Meta usam components salvos
   - Sem perda de dados

3. **UX Melhorado:**
   - Usuários sem API Oficial: veem apenas modo simples
   - Usuários com API Oficial: podem escolher entre simples/completo
   - Preview de variáveis em tempo real

## 🐛 TROUBLESHOOTING

### Erro "Invalid parameter" ao criar template Meta:
- **Causa:** Meta rejeita templates com structure inválida
- **Solução:** Verificar que body_text example é array de array: `[["ex1", "ex2"]]`

### Template não sincroniza com Meta:
- **Causa:** Token expirado ou metaComponents inválido
- **Solução:** Verificar token_expires_at e logs do servidor

### Formulário não aparece em modo Meta:
- **Causa:** hasOfficialApi = false
- **Solução:** Verificar se credential.isActive = true no banco
