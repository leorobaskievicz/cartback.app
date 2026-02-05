# 🚀 Railway Deploy - Quick Start

## TL;DR - Versão Rápida

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login no Railway
railway login

# 3. Criar projeto e linkar
railway init
railway link

# 4. Criar services
# No dashboard do Railway, crie 5 services:
# - MySQL Database
# - Redis
# - cartback-api (root: apps/api)
# - cartback-workers (root: apps/api)
# - cartback-web (root: apps/web)

# 5. Configurar variáveis (copiar de .env.railway.example)
# Ver RAILWAY-DEPLOY.md para lista completa

# 6. Deploy
git push origin main
# Railway vai fazer deploy automaticamente!

# 7. Rodar migrations
railway run -s cartback-api node ace migration:run --force
```

---

## 📋 Checklist Mínimo

### 1️⃣ Antes de Começar

- [ ] Código commitado no Git (GitHub/GitLab)
- [ ] Conta no Railway criada
- [ ] Railway CLI instalado

### 2️⃣ Services Criados

- [ ] MySQL Database
- [ ] Redis
- [ ] cartback-api
- [ ] cartback-workers
- [ ] cartback-web

### 3️⃣ Configurações

**cartback-api**
- [ ] Root Directory: `apps/api`
- [ ] Watch Paths: `apps/api/**`
- [ ] Variáveis de ambiente configuradas (ver `.env.railway.example`)
- [ ] `ENABLE_WORKERS=false`

**cartback-workers**
- [ ] Root Directory: `apps/api`
- [ ] Watch Paths: `apps/api/**`
- [ ] Start Command: `cd build && npm ci --omit=dev && node bin/workers.js`
- [ ] Variáveis de ambiente configuradas (mesmas da API)
- [ ] `ENABLE_WORKERS=true`

**cartback-web**
- [ ] Root Directory: `apps/web`
- [ ] Watch Paths: `apps/web/**`
- [ ] `VITE_API_URL` configurado

### 4️⃣ Pós-Deploy

- [ ] Migrations rodadas
- [ ] Health checks funcionando:
  - `https://sua-api.up.railway.app/health`
  - `https://sua-web.up.railway.app`
- [ ] Logs sem erros
- [ ] Teste: cadastro → login → dashboard
- [ ] Teste: webhook (Nuvemshop ou Custom)

---

## 🔑 Variáveis de Ambiente Mínimas

### cartback-api & cartback-workers

```bash
# Essenciais
NODE_ENV=production
PORT=3333
HOST=0.0.0.0
APP_KEY=<gerar-com-node-ace-generate-key>

# Database (Railway)
DB_HOST=${{MySQL.MYSQL_HOST}}
DB_PORT=${{MySQL.MYSQL_PORT}}
DB_USER=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
DB_DATABASE=${{MySQL.MYSQL_DATABASE}}

# Redis (Railway)
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}

# Workers (diferente em cada service!)
ENABLE_WORKERS=false  # true no cartback-workers

# CORS
CORS_ORIGIN=https://seu-dominio.com
```

### cartback-web

```bash
NODE_ENV=production
VITE_API_URL=https://sua-api.up.railway.app
```

---

## 🛠️ Comandos Úteis

```bash
# Ver logs em tempo real
railway logs -s cartback-api
railway logs -s cartback-workers
railway logs -s cartback-web

# Rodar comandos na API
railway run -s cartback-api node ace migration:run --force
railway run -s cartback-api node ace db:seed

# Ver variáveis de ambiente
railway variables -s cartback-api

# Restart de um service
railway restart -s cartback-api

# Deploy manual (forçar)
railway up -s cartback-api
```

---

## 🔗 Links Importantes

- **Documentação completa**: [RAILWAY-DEPLOY.md](./RAILWAY-DEPLOY.md)
- **Railway Docs**: https://docs.railway.app
- **Railway Dashboard**: https://railway.app/dashboard

---

## 🆘 Problemas Comuns

### "Module not found" na API

```bash
# Rebuild
railway restart -s cartback-api
```

### Workers não processam

Verifique:
```bash
railway logs -s cartback-workers
```

Certifique-se que `ENABLE_WORKERS=true` está setado.

### CORS error no frontend

Adicione o domínio do frontend em `CORS_ORIGIN` na API:
```bash
CORS_ORIGIN=https://seu-frontend.up.railway.app,https://seu-dominio.com
```

### Database connection failed

Certifique-se que está usando as variáveis de referência:
```bash
DB_HOST=${{MySQL.MYSQL_HOST}}
# NÃO use valores hardcoded!
```

---

**Pronto! Seu Cartback está no ar 🎉**
