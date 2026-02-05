# Database Schema - CartBack

## Estrutura Multi-Tenant de Recuperação de Carrinho

### Migrations Criadas

1. **3_create_tenants_table.ts** - Tabela de tenants (lojas)
2. **4_add_tenant_to_users.ts** - Adiciona tenant_id e role aos users
3. **5_create_store_integrations_table.ts** - Integrações com plataformas
4. **6_create_whatsapp_instances_table.ts** - Instâncias WhatsApp (Evolution API)
5. **7_create_message_templates_table.ts** - Templates de mensagem
6. **8_create_abandoned_carts_table.ts** - Carrinhos abandonados
7. **9_create_message_logs_table.ts** - Histórico de envios
8. **10_create_subscriptions_table.ts** - Controle de assinaturas

### Models Criados

- `Tenant` - Tenants com relacionamentos
- `User` - Usuários multi-tenant com roles
- `StoreIntegration` - Integrações de loja
- `WhatsappInstance` - Instâncias WhatsApp
- `MessageTemplate` - Templates de mensagem
- `AbandonedCart` - Carrinhos abandonados
- `MessageLog` - Logs de mensagens
- `Subscription` - Assinaturas

### Relacionamentos

```
Tenant (1) → (N) Users
Tenant (1) → (N) StoreIntegrations
Tenant (1) → (N) WhatsappInstances
Tenant (1) → (N) MessageTemplates
Tenant (1) → (N) AbandonedCarts
Tenant (1) → (N) MessageLogs
Tenant (1) → (1) Subscription

StoreIntegration (1) → (N) AbandonedCarts
AbandonedCart (1) → (N) MessageLogs
MessageTemplate (1) → (N) MessageLogs
WhatsappInstance (1) → (N) MessageLogs
```

### Índices Criados

Todos os campos `tenant_id` estão indexados para queries eficientes.

Índices adicionais:
- `tenants.uuid` - Para URLs públicas
- `abandoned_carts.external_cart_id` - Busca por ID externo
- `abandoned_carts.customer_phone` - Busca por telefone
- `abandoned_carts.status` - Filtro por status
- `message_logs.status` - Filtro por status de envio
- Índices compostos para queries filtradas por tenant

## Como Executar

### 1. Iniciar Docker (MySQL + Redis)

```bash
cd cartback
docker compose up -d
```

### 2. Rodar Migrations

```bash
cd apps/api
node ace migration:run
```

### 3. Rodar Seed (Dados Iniciais)

```bash
node ace db:seed
```

Isso criará:
- ✅ 1 Tenant de demonstração (Loja Demo)
- ✅ 1 User owner (admin@cartback.com / password123)
- ✅ 3 Message Templates padrão (30min, 24h, 48h)

### 4. Reverter Migrations (se necessário)

```bash
node ace migration:rollback
```

## Dados de Teste

Após rodar o seed:

- **Email**: admin@cartback.com
- **Senha**: password123
- **Tenant**: Loja Demo

## Enums

### User.role
- `owner` - Proprietário do tenant
- `admin` - Administrador
- `viewer` - Visualizador (read-only)

### Tenant.plan
- `trial` - Período de teste
- `starter` - Plano inicial
- `pro` - Plano profissional
- `business` - Plano empresarial

### StoreIntegration.platform
- `nuvemshop`
- `yampi`
- `shopify`
- `woocommerce`
- `webhook` - Integração genérica via webhook

### WhatsappInstance.status
- `disconnected` - Desconectado
- `connecting` - Conectando
- `connected` - Conectado

### MessageTemplate.triggerType
- `abandoned_cart` - Carrinho abandonado
- `tracking_update` - Atualização de rastreio

### AbandonedCart.status
- `pending` - Pendente
- `processing` - Em processamento
- `recovered` - Recuperado
- `expired` - Expirado
- `cancelled` - Cancelado

### MessageLog.status
- `queued` - Na fila
- `sent` - Enviado
- `delivered` - Entregue
- `read` - Lido
- `failed` - Falhou

### Subscription.status
- `active` - Ativa
- `past_due` - Atrasada
- `cancelled` - Cancelada

### Subscription.paymentGateway
- `asaas`
- `stripe`

## Placeholders de Mensagem

Templates suportam os seguintes placeholders:

- `{{nome}}` - Nome do cliente
- `{{produtos}}` - Lista de produtos
- `{{link}}` - Link para recuperar carrinho
- `{{total}}` - Valor total do carrinho

## Notas de Segurança

- `access_token` e `refresh_token` devem ser encriptados antes de salvar
- `webhook_secret` deve ser gerado de forma segura
- Implementar rate limiting nas APIs de webhook
- Validar tenant_id em todas as queries para evitar vazamento de dados
