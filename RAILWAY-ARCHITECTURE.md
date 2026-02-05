# 🏗️ Arquitetura Cartback no Railway

## 📐 Diagrama de Services

```
┌─────────────────────────────────────────────────────────────────┐
│                      RAILWAY PROJECT: Cartback                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   MySQL Database     │  ◄──┐
│  (Managed Service)   │     │
└──────────────────────┘     │
                             │
┌──────────────────────┐     │
│   Redis              │  ◄──┤
│  (Managed Service)   │     │
└──────────────────────┘     │
                             │
                             │
┌──────────────────────┐     │
│   cartback-api       │ ────┤
│  (apps/api)          │     │
│                      │     │
│  - AdonisJS          │     │
│  - Port: 3333        │     │
│  - Health: /health   │     │
│  - ENABLE_WORKERS:   │     │
│    false             │     │
└──────────────────────┘     │
         ▲                   │
         │ CORS              │
         │                   │
┌──────────────────────┐     │
│   cartback-workers   │ ────┘
│  (apps/api)          │
│                      │
│  - Bull Queues       │
│  - ENABLE_WORKERS:   │
│    true              │
│  - Processa:         │
│    • Abandoned carts │
│    • WhatsApp msgs   │
│    • Webhooks        │
└──────────────────────┘


┌──────────────────────┐
│   cartback-web       │
│  (apps/web)          │
│                      │
│  - React + Vite      │
│  - Landing Page      │
│  - Dashboard         │
└──────────────────────┘
         │
         │ API Calls
         ▼
┌──────────────────────┐
│   cartback-api       │
└──────────────────────┘
```

---

## 🔄 Fluxo de Dados

### 1. Cadastro de Usuário
```
┌─────────┐    POST /api/auth/register    ┌──────────┐
│   Web   │ ─────────────────────────────► │   API    │
└─────────┘                                └──────────┘
                                                 │
                                                 ▼
                                           ┌──────────┐
                                           │  MySQL   │
                                           └──────────┘
```

### 2. Carrinho Abandonado (Webhook)
```
┌─────────────┐   POST /webhooks/nuvemshop   ┌──────────┐
│ Nuvemshop   │ ───────────────────────────► │   API    │
└─────────────┘                              └──────────┘
                                                   │
                                                   │ Enfileira job
                                                   ▼
                                             ┌──────────┐
                                             │  Redis   │
                                             └──────────┘
                                                   │
                                                   │ Consome job
                                                   ▼
                                             ┌──────────┐
                                             │ Workers  │
                                             └──────────┘
                                                   │
                                                   │ Envia msg
                                                   ▼
                                             ┌──────────┐
                                             │ WhatsApp │
                                             └──────────┘
```

### 3. Dashboard
```
┌─────────┐    GET /api/dashboard/stats   ┌──────────┐
│   Web   │ ──────────────────────────────► │   API    │
└─────────┘                                 └──────────┘
                                                  │
                                                  │ Query
                                                  ▼
                                            ┌──────────┐
                                            │  MySQL   │
                                            └──────────┘
```

---

## 🌐 Domínios

### Desenvolvimento (Railway Domains)
```
cartback-api.up.railway.app      → API
cartback-workers.up.railway.app  → Workers (não precisa de domínio público)
cartback-web.up.railway.app      → Frontend
```

### Produção (Custom Domains)
```
api.cartback.com.br              → API
cartback.com.br                  → Frontend
www.cartback.com.br              → Frontend (redirect)
```

---

## 📊 Recursos Estimados

### cartback-api
- **CPU**: Baixo (~0.1-0.5 vCPU)
- **RAM**: ~256-512 MB
- **Network**: Médio (webhooks + API calls)
- **Custo**: ~$5-10/mês

### cartback-workers
- **CPU**: Médio (~0.5-1 vCPU) - picos ao processar
- **RAM**: ~256-512 MB
- **Network**: Médio (Evolution API)
- **Custo**: ~$5-10/mês

### cartback-web
- **CPU**: Baixíssimo (~0.05 vCPU)
- **RAM**: ~128-256 MB
- **Network**: Baixo (static files)
- **Custo**: ~$5/mês

### MySQL
- **Storage**: ~1-5 GB inicial
- **RAM**: 256 MB
- **Custo**: ~$5-10/mês

### Redis
- **RAM**: 256 MB
- **Custo**: ~$5/mês

**Total estimado**: **$25-40/mês**

---

## 🔐 Segurança

### API
- ✅ CORS configurado (apenas frontend)
- ✅ Helmet.js para security headers
- ✅ Rate limiting (shield middleware)
- ✅ Auth com JWT/sessions
- ✅ HTTPS (Railway automático)

### Workers
- ✅ Não exposto publicamente
- ✅ Acesso apenas interno ao Redis/MySQL
- ✅ Validação de webhooks

### Web
- ✅ HTTPS (Railway automático)
- ✅ CSP headers
- ✅ SameSite cookies

---

## 📈 Escalabilidade

### Vertical (Railway)
```bash
# Aumentar recursos de um service
Settings → Resources → Adjust CPU/RAM
```

### Horizontal (Múltiplas Instâncias)
```bash
# Criar múltiplos workers
cartback-workers-1
cartback-workers-2
cartback-workers-3
```

Railway automaticamente balanceia load entre instâncias do mesmo service.

---

## 🔍 Monitoramento

### Logs
```bash
# Tempo real
railway logs -s cartback-api
railway logs -s cartback-workers

# Filtrar por nível
railway logs -s cartback-api | grep ERROR
```

### Métricas (Railway Dashboard)
- CPU usage
- Memory usage
- Network traffic
- Request count
- Response time

### Alertas
Configure no Railway:
- **Settings** → **Notifications**
- Slack, Discord, Email

---

## 🚨 Troubleshooting

### API não responde
1. Verificar logs: `railway logs -s cartback-api`
2. Verificar health: `curl https://sua-api.up.railway.app/health`
3. Verificar variáveis de ambiente
4. Restart: `railway restart -s cartback-api`

### Workers não processam
1. Verificar logs: `railway logs -s cartback-workers`
2. Verificar se `ENABLE_WORKERS=true`
3. Verificar conexão com Redis
4. Verificar filas no Redis:
   ```bash
   railway run -s cartback-api node -e "const Redis = require('ioredis'); const redis = new Redis(process.env.REDIS_URL); redis.keys('bull:*').then(console.log)"
   ```

### Banco de dados cheio
1. Ver uso: Railway Dashboard → MySQL → Metrics
2. Limpar dados antigos:
   ```bash
   railway run -s cartback-api node ace cleanup:old-carts --days=90
   ```

### CORS error
1. Verificar `CORS_ORIGIN` na API
2. Adicionar domínio do frontend (sem barra final)
3. Restart API

---

## 📞 Suporte

- **Railway Status**: https://status.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Docs**: https://docs.railway.app

---

**Última atualização**: 2026-02-04
