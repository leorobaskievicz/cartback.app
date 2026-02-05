# 🚂 Deploy Cartback no Railway

## 📋 Pré-requisitos

- Conta no Railway (https://railway.app)
- Repositório Git (GitHub, GitLab ou Bitbucket)
- CLI do Railway instalado (opcional, mas recomendado):
  ```bash
  npm install -g @railway/cli
  railway login
  ```

## 🏗️ Arquitetura no Railway

Você vai precisar criar **5 services** no Railway:

1. **MySQL Database** (banco de dados)
2. **Redis** (filas e cache)
3. **API** (apps/api - servidor AdonisJS)
4. **Workers** (apps/api - processar filas Bull)
5. **Web** (apps/web - frontend React/Vite)

---

## 🚀 Passo a Passo

### 1️⃣ Criar Projeto no Railway

1. Acesse https://railway.app
2. Clique em **New Project**
3. Escolha **Deploy from GitHub repo**
4. Selecione o repositório do Cartback
5. Railway vai criar um projeto vazio

---

### 2️⃣ Adicionar MySQL Database

1. No projeto, clique em **+ New**
2. Escolha **Database** → **Add MySQL**
3. Railway vai provisionar automaticamente
4. Anote as variáveis que aparecem:
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`

---

### 3️⃣ Adicionar Redis

1. Clique em **+ New**
2. Escolha **Database** → **Add Redis**
3. Railway vai provisionar automaticamente
4. Anote a variável `REDIS_URL`

---

### 4️⃣ Deploy da API (apps/api)

#### 4.1 Criar Service

1. Clique em **+ New**
2. Escolha **GitHub Repo** → selecione seu repositório
3. Nome do service: `cartback-api`

#### 4.2 Configurar Build

Vá em **Settings** do service:

- **Root Directory**: `apps/api`
- **Build Command**:
  ```bash
  npm install && node ace build
  ```
- **Start Command**:
  ```bash
  cd build && npm ci --omit=dev && node bin/server.js
  ```
- **Watch Paths**: `apps/api/**`

#### 4.3 Variáveis de Ambiente

Vá em **Variables** e adicione:

```bash
# App
NODE_ENV=production
PORT=3333
HOST=0.0.0.0
APP_KEY=<gerar-com-node-ace-generate-key>
APP_URL=https://api-cartback.up.railway.app

# Database (usar valores do MySQL service)
DB_HOST=${{MySQL.MYSQL_HOST}}
DB_PORT=${{MySQL.MYSQL_PORT}}
DB_USER=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
DB_DATABASE=${{MySQL.MYSQL_DATABASE}}

# Redis (usar valor do Redis service)
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}

# Session
SESSION_DRIVER=cookie

# Asaas (suas credenciais)
ASAAS_API_KEY=seu-asaas-api-key
ASAAS_WEBHOOK_TOKEN=seu-webhook-token
ASAAS_ENV=production

# WhatsApp Evolution API
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-api-key

# CORS
CORS_ORIGIN=https://cartback.com.br,https://www.cartback.com.br

# Workers (desabilitar workers neste service)
ENABLE_WORKERS=false
```

#### 4.4 Rodar Migrations

Após o primeiro deploy, execute no Railway CLI ou no painel:

```bash
railway run node ace migration:run --force
```

---

### 5️⃣ Deploy dos Workers (apps/api)

#### 5.1 Criar Service

1. Clique em **+ New**
2. Escolha **GitHub Repo** → mesmo repositório
3. Nome do service: `cartback-workers`

#### 5.2 Configurar Build

- **Root Directory**: `apps/api`
- **Build Command**:
  ```bash
  npm install && node ace build
  ```
- **Start Command**:
  ```bash
  cd build && npm ci --omit=dev && node bin/workers.js
  ```
- **Watch Paths**: `apps/api/**`

#### 5.3 Variáveis de Ambiente

**Copie TODAS as variáveis do service `cartback-api`**, mas altere:

```bash
ENABLE_WORKERS=true
APP_URL=https://api-cartback.up.railway.app
```

---

### 6️⃣ Deploy do Web (apps/web)

#### 6.1 Criar Service

1. Clique em **+ New**
2. Escolha **GitHub Repo** → mesmo repositório
3. Nome do service: `cartback-web`

#### 6.2 Configurar Build

- **Root Directory**: `apps/web`
- **Build Command**:
  ```bash
  npm install && npm run build
  ```
- **Start Command**:
  ```bash
  npm run preview -- --host 0.0.0.0 --port $PORT
  ```
- **Watch Paths**: `apps/web/**`

#### 6.3 Variáveis de Ambiente

```bash
NODE_ENV=production
VITE_API_URL=https://api-cartback.up.railway.app
```

---

## 🌐 Configurar Domínios

### API

1. Vá no service `cartback-api` → **Settings** → **Domains**
2. Clique em **Generate Domain** (vai gerar algo como `cartback-api.up.railway.app`)
3. Ou adicione domínio customizado: `api.cartback.com.br`
   - Crie um CNAME no seu DNS apontando para o domínio do Railway

### Web

1. Vá no service `cartback-web` → **Settings** → **Domains**
2. Adicione domínio customizado: `cartback.com.br` e `www.cartback.com.br`
3. No seu DNS:
   - `cartback.com.br` → A record para o IP do Railway (ou CNAME)
   - `www.cartback.com.br` → CNAME para o domínio do Railway

---

## 🔧 Ajustes Finais

### 1. Atualizar CORS na API

No `.env` da API no Railway:
```bash
CORS_ORIGIN=https://cartback.com.br,https://www.cartback.com.br
```

### 2. Atualizar VITE_API_URL no Web

No `.env` do Web no Railway:
```bash
VITE_API_URL=https://api.cartback.com.br
```

### 3. Habilitar Health Checks

Crie em `apps/api/start/routes.ts`:
```typescript
Route.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})
```

No Railway, vá em **Settings** → **Health Check**:
- **Path**: `/health`
- **Port**: `3333`

---

## 📝 Checklist de Deploy

- [ ] MySQL Database criado
- [ ] Redis criado
- [ ] Service `cartback-api` criado e rodando
- [ ] Service `cartback-workers` criado e rodando
- [ ] Service `cartback-web` criado e rodando
- [ ] Migrations executadas (`railway run node ace migration:run --force`)
- [ ] Domínios configurados
- [ ] CORS configurado corretamente
- [ ] Variáveis de ambiente conferidas
- [ ] Health checks funcionando
- [ ] Testar fluxo completo (cadastro → login → dashboard)
- [ ] Testar webhooks (Asaas, plataformas)
- [ ] Verificar logs de todos os services

---

## 🐛 Troubleshooting

### Workers não processam filas

Verifique:
```bash
railway logs -s cartback-workers
```

Certifique-se que `ENABLE_WORKERS=true` está setado no service de workers.

### Erro de CORS

Verifique se `CORS_ORIGIN` na API inclui o domínio do frontend (sem barra no final).

### Migrations falhando

Execute manualmente:
```bash
railway run -s cartback-api node ace migration:run --force
```

### Build falhando no Vite

Certifique-se que `VITE_API_URL` está definido ANTES do build.

### Database connection refused

Verifique se as variáveis de referência estão corretas:
```bash
DB_HOST=${{MySQL.MYSQL_HOST}}
```

---

## 💰 Custos Estimados no Railway

- **Starter Plan** (gratuito): $5 de crédito/mês
- **Developer Plan**: $20/mês (créditos ilimitados)

Estimativa para Cartback (5 services):
- MySQL: ~$5-10/mês
- Redis: ~$5/mês
- API: ~$5/mês
- Workers: ~$5/mês
- Web: ~$5/mês

**Total**: ~$25-30/mês no Developer Plan

---

## 🔐 Segurança

### Gerar APP_KEY segura

No seu terminal local:
```bash
cd apps/api
node ace generate:key
```

Copie o valor e adicione em `APP_KEY` no Railway.

### Rodar Seeders (opcional)

Se você tiver seeders (usuário admin, planos, etc):
```bash
railway run -s cartback-api node ace db:seed
```

---

## 📊 Monitoramento

No Railway, cada service tem:
- **Metrics**: CPU, memória, network
- **Logs**: Logs em tempo real
- **Deployments**: Histórico de deploys

Para monitoramento mais avançado, integre:
- Sentry (erros)
- LogRocket (sessões de usuário)
- Datadog ou New Relic (APM)

---

## 🚀 Deploy Automatizado (CI/CD)

O Railway já faz deploy automático quando você faz push no GitHub!

Para desabilitar deploy automático em algum service:
1. **Settings** → **Deploy Triggers**
2. Desmarque **Auto Deploy**

Para fazer deploy manual:
```bash
railway up -s cartback-api
```

---

## 📞 Suporte

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- AdonisJS Deploy: https://docs.adonisjs.com/guides/deployment

---

**Boa sorte com o deploy! 🚀**
