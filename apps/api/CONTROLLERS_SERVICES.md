# Controllers, Services e Routes - CartBack API

Estrutura completa da API REST criada para o sistema de recuperação de carrinho abandonado.

---

## 📁 Estrutura de Pastas

```
apps/api/
├── app/
│   ├── controllers/
│   │   ├── auth_controller.ts ✅
│   │   ├── tenants_controller.ts ✅
│   │   ├── store_integrations_controller.ts ✅
│   │   ├── whatsapp_controller.ts ✅
│   │   ├── message_templates_controller.ts ✅
│   │   ├── abandoned_carts_controller.ts ✅
│   │   ├── dashboard_controller.ts ✅
│   │   └── webhooks/
│   │       └── nuvemshop_webhook_controller.ts ✅
│   │
│   ├── services/
│   │   ├── nuvemshop_service.ts ✅ (placeholder)
│   │   └── evolution_api_service.ts ✅ (placeholder)
│   │
│   ├── middleware/
│   │   ├── auth_middleware.ts ✅
│   │   └── tenant_middleware.ts ✅
│   │
│   └── validators/
│       ├── auth.ts ✅
│       ├── tenant.ts ✅
│       ├── store_integration.ts ✅
│       ├── message_template.ts ✅
│       └── whatsapp.ts ✅
│
└── start/
    ├── routes.ts ✅
    ├── kernel.ts ✅
    └── env.ts ✅
```

---

## 🎯 Controllers

### AuthController
**Rotas:**
- `POST /api/auth/register` - Registra tenant + user owner
- `POST /api/auth/login` - Login com JWT
- `POST /api/auth/logout` - Revoga token
- `GET /api/auth/me` - Dados do user + tenant

**Funcionalidades:**
- Criação de tenant e user em transação
- Trial de 14 dias automático
- Tokens JWT com expiração de 30 dias
- Validação de tenant ativo no login

### TenantsController
**Rotas:**
- `PUT /api/tenant` - Atualiza dados do tenant

**Funcionalidades:**
- Atualização de nome, email e telefone
- Validação com Vine

### StoreIntegrationsController
**Rotas:**
- `GET /api/integrations` - Lista integrações
- `POST /api/integrations/nuvemshop/connect` - Inicia OAuth
- `GET /api/integrations/nuvemshop/callback` - Callback OAuth
- `DELETE /api/integrations/:id` - Desconecta

**Funcionalidades:**
- OAuth flow com Nuvemshop
- Armazenamento de tokens
- Criação automática de webhook
- Isolamento por tenant

### WhatsappController
**Rotas:**
- `GET /api/whatsapp` - Status da instância
- `POST /api/whatsapp/connect` - Gera QR code
- `GET /api/whatsapp/qrcode` - Retorna QR atual
- `POST /api/whatsapp/disconnect` - Desconecta
- `POST /api/whatsapp/webhook` - Callback Evolution API

**Funcionalidades:**
- Criação de instância na Evolution API
- Geração de QR code
- Webhooks de status de conexão
- Uma instância por tenant

### MessageTemplatesController
**Rotas:**
- `GET /api/templates` - Lista templates
- `POST /api/templates` - Cria template
- `PUT /api/templates/:id` - Atualiza
- `DELETE /api/templates/:id` - Remove
- `PUT /api/templates/reorder` - Reordena

**Funcionalidades:**
- Templates com placeholders ({{nome}}, {{produtos}}, etc)
- Delay configurável em minutos
- Sort order automático
- Validação de conteúdo

### AbandonedCartsController
**Rotas:**
- `GET /api/carts` - Lista carrinhos (paginado)
- `GET /api/carts/:id` - Detalhe + logs
- `PUT /api/carts/:id/cancel` - Cancela recuperação

**Funcionalidades:**
- Paginação
- Filtros por status e search
- Relacionamento com mensagens enviadas
- Isolamento por tenant

### DashboardController
**Rotas:**
- `GET /api/dashboard/stats` - Métricas gerais
- `GET /api/dashboard/chart` - Dados para gráfico

**Funcionalidades:**
- Métricas: total, recuperados, taxa, valor
- Dados dos últimos 30 dias
- Agrupamento por dia

### NuvemshopWebhookController
**Rotas:**
- `POST /api/webhooks/nuvemshop/:tenantUuid` - Webhook público

**Funcionalidades:**
- Recebe eventos de carrinho abandonado
- Valida tenant por UUID
- Cria/atualiza carrinho
- Prepara para fila de mensagens

---

## 🔧 Services

### NuvemshopService
**Métodos:**
- `getAuthUrl(tenantId)` - URL OAuth
- `exchangeCode(code)` - Troca code por tokens
- `getStoreInfo(accessToken)` - Dados da loja
- `createWebhook(accessToken, storeId, url)` - Cria webhook
- `deleteWebhook(accessToken, storeId, webhookId)` - Remove webhook
- `refreshAccessToken(refreshToken)` - Refresh token

**Status:** ⚠️ Implementação placeholder (TODO)

### EvolutionApiService
**Métodos:**
- `createInstance(instanceName)` - Cria instância WhatsApp
- `getQrCode(instanceName)` - Busca QR code
- `getStatus(instanceName)` - Status da conexão
- `sendMessage(instanceName, phone, message)` - Envia mensagem
- `deleteInstance(instanceName)` - Remove instância
- `setWebhook(instanceName, webhookUrl)` - Configura webhook

**Status:** ⚠️ Implementação placeholder (TODO)

---

## 🛡️ Middleware

### AuthMiddleware
- Valida JWT token
- Carrega usuário no contexto

### TenantMiddleware
- Extrai `tenant_id` do user autenticado
- Carrega tenant completo
- Valida se tenant está ativo
- Injeta `tenant` no contexto HTTP
- **Uso:** Todas as rotas autenticadas

---

## ✅ Validators (Vine)

### auth.ts
- `registerValidator` - name, email, password, phone, tenantName
- `loginValidator` - email, password
- `refreshTokenValidator` - refreshToken

### tenant.ts
- `updateTenantValidator` - name, email, phone (opcionais)

### store_integration.ts
- `createStoreIntegrationValidator` - platform, storeName, storeUrl

### message_template.ts
- `createMessageTemplateValidator` - name, delayMinutes, content
- `updateMessageTemplateValidator` - campos opcionais
- `reorderTemplatesValidator` - array de { id, sortOrder }

### whatsapp.ts
- `connectWhatsappValidator` - instanceName

---

## 🌐 Rotas

### Públicas
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/webhooks/nuvemshop/:tenantUuid
```

### Autenticadas (JWT + Tenant)
```
# Auth
POST   /api/auth/logout
GET    /api/auth/me

# Tenant
PUT    /api/tenant

# Integrations
GET    /api/integrations
POST   /api/integrations/nuvemshop/connect
GET    /api/integrations/nuvemshop/callback
DELETE /api/integrations/:id

# WhatsApp
GET    /api/whatsapp
POST   /api/whatsapp/connect
GET    /api/whatsapp/qrcode
POST   /api/whatsapp/disconnect
POST   /api/whatsapp/webhook

# Templates
GET    /api/templates
POST   /api/templates
PUT    /api/templates/reorder
PUT    /api/templates/:id
DELETE /api/templates/:id

# Carts
GET    /api/carts
GET    /api/carts/:id
PUT    /api/carts/:id/cancel

# Dashboard
GET    /api/dashboard/stats
GET    /api/dashboard/chart
```

---

## 🔐 Padrão de Resposta

### Sucesso
```json
{
  "success": true,
  "data": { ... }
}
```

### Erro
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": []
  }
}
```

---

## 🌍 Variáveis de Ambiente

```bash
# Nuvemshop Integration
NUVEMSHOP_APP_ID=
NUVEMSHOP_APP_SECRET=
NUVEMSHOP_REDIRECT_URI=http://localhost:3333/api/integrations/nuvemshop/callback

# Evolution API (WhatsApp)
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=
```

---

## 📝 Próximos Passos

1. **Implementar Services:**
   - Completar `NuvemshopService` com chamadas reais à API
   - Completar `EvolutionApiService` com chamadas reais à API

2. **Jobs/Queues:**
   - Criar job para processar carrinhos abandonados
   - Criar job para enviar mensagens agendadas
   - Configurar Bull com Redis

3. **Testes:**
   - Testes unitários dos controllers
   - Testes de integração da API
   - Testes dos services

4. **Melhorias:**
   - Rate limiting
   - Logging estruturado
   - Monitoramento de erros
   - Documentação OpenAPI/Swagger

---

## 📚 Documentação

- **API_REFERENCE.md** - Referência completa da API com exemplos
- **DATABASE.md** - Schema do banco de dados
- Este arquivo - Estrutura de controllers e services

---

## ✨ Recursos Implementados

✅ Autenticação JWT com refresh token
✅ Multi-tenancy com isolamento de dados
✅ Validação de dados com Vine
✅ Middleware de tenant automático
✅ CRUD completo de templates
✅ Dashboard com métricas
✅ Paginação e filtros
✅ Webhook handler
✅ Estrutura de services preparada
✅ Padrão de resposta consistente
✅ Tratamento de erros

---

**Status:** ✅ Estrutura completa criada e pronta para uso!

Os services estão com implementação placeholder (TODO) conforme solicitado.
