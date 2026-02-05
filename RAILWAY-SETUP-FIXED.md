# 🚂 Railway Setup - Monorepo Corrigido

## ✅ Problemas Corrigidos

O projeto agora está configurado corretamente para deploy no Railway como um **monorepo pnpm**.

### O que foi mudado:

1. **Criado `nixpacks.toml`** na raiz - configura Node 20 e pnpm
2. **Atualizados todos os `railway.toml`** - agora usam pnpm ao invés de npm
3. **Build do shared package** - todos os builds agora garantem que `@cartback/shared` seja buildado primeiro
4. **Paths corrigidos** - comandos de start agora usam caminhos corretos do monorepo

---

## 🏗️ Configuração no Railway

### 1. Criar Serviços

Você precisa criar **5 services** no Railway:

1. **MySQL Database**
2. **Redis**
3. **API** (apps/api - servidor AdonisJS)
4. **Workers** (apps/api - filas Bull)
5. **Web** (apps/web - frontend React)

---

### 2. MySQL Database

1. Clique em **+ New** → **Database** → **Add MySQL**
2. Railway provisiona automaticamente
3. Anote as variáveis geradas (usaremos nas referências)

---

### 3. Redis

1. Clique em **+ New** → **Database** → **Add Redis**
2. Railway provisiona automaticamente
3. Anote a variável `REDIS_URL`

---

### 4. Service: API

#### Settings → General
- **Service Name**: `cartback-api`
- **Root Directory**: `.` (raiz do projeto)
- **Watch Paths**: `apps/api/**`, `packages/shared/**`

#### Settings → Deploy
O Railway vai usar o arquivo `apps/api/railway.toml` automaticamente.

**IMPORTANTE**: Configure o **Railway Config Path**:
- **Railway Config Path**: `apps/api/railway.toml`

#### Variables
```bash
NODE_ENV=production
PORT=3333
HOST=0.0.0.0
APP_KEY=<gerar-com-node-ace-generate-key>
APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# Database (referências ao service MySQL)
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_DATABASE=${{MySQL.MYSQLDATABASE}}

# Redis (referências ao service Redis)
REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}
REDIS_PASSWORD=${{Redis.REDISPASSWORD}}

# Session
SESSION_DRIVER=cookie

# Asaas
ASAAS_API_KEY=seu-asaas-api-key
ASAAS_WEBHOOK_TOKEN=seu-webhook-token
ASAAS_ENV=production

# WhatsApp Evolution API (se estiver usando externo)
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-api-key

# CORS
CORS_ORIGIN=${{cartback-web.RAILWAY_PUBLIC_DOMAIN}}

# Workers
ENABLE_WORKERS=false
```

#### Rodar Migrations

Após o primeiro deploy com sucesso:
```bash
railway run -s cartback-api node apps/api/ace migration:run --force
```

---

### 5. Service: Workers

#### Settings → General
- **Service Name**: `cartback-workers`
- **Root Directory**: `.` (raiz do projeto)
- **Watch Paths**: `apps/api/**`, `packages/shared/**`

#### Settings → Deploy
**Railway Config Path**: `apps/api/railway.workers.toml`

#### Variables
**Copie TODAS as variáveis do service API**, mas mude:
```bash
ENABLE_WORKERS=true
APP_URL=${{cartback-api.RAILWAY_PUBLIC_DOMAIN}}
```

---

### 6. Service: Web

#### Settings → General
- **Service Name**: `cartback-web`
- **Root Directory**: `.` (raiz do projeto)
- **Watch Paths**: `apps/web/**`, `packages/shared/**`

#### Settings → Deploy
**Railway Config Path**: `apps/web/railway.toml`

#### Variables
```bash
NODE_ENV=production
VITE_API_URL=${{cartback-api.RAILWAY_PUBLIC_DOMAIN}}
```

---

## 🔧 Evolution API (WhatsApp)

A Evolution API precisa ser deployada separadamente pois usa Docker.

### Opções:

#### Opção 1: Usar Evolution API como serviço externo
Use um provedor como https://evolution-api.com ou hospede em outro lugar.

#### Opção 2: Deploy no Railway (Dockerfile)
1. Crie um novo service no Railway
2. Configure com o docker-compose da Evolution
3. Conecte ao mesmo MySQL e Redis

Para simplicidade, **recomendo usar um serviço externo** de Evolution API.

---

## 📝 Checklist de Deploy

- [ ] MySQL Database criado
- [ ] Redis criado
- [ ] Service `cartback-api` criado e configurado
  - [ ] Root Directory: `.`
  - [ ] Railway Config Path: `apps/api/railway.toml`
  - [ ] Variáveis de ambiente configuradas
  - [ ] Deploy bem-sucedido
- [ ] Migrations executadas
- [ ] Service `cartback-workers` criado e configurado
  - [ ] Root Directory: `.`
  - [ ] Railway Config Path: `apps/api/railway.workers.toml`
  - [ ] Variáveis copiadas da API com `ENABLE_WORKERS=true`
  - [ ] Deploy bem-sucedido
- [ ] Service `cartback-web` criado e configurado
  - [ ] Root Directory: `.`
  - [ ] Railway Config Path: `apps/web/railway.toml`
  - [ ] `VITE_API_URL` configurado
  - [ ] Deploy bem-sucedido
- [ ] Domínios configurados (se necessário)
- [ ] Testar fluxo completo

---

## 🐛 Troubleshooting

### Build falha com "Cannot find module '@cartback/shared'"

**Causa**: O shared package não foi buildado antes.

**Solução**: Os railway.toml já incluem o build do shared. Verifique se o build command está correto:
```bash
pnpm install --frozen-lockfile && pnpm --filter @cartback/shared build && cd apps/api && pnpm build
```

### "pnpm: command not found"

**Causa**: nixpacks.toml não está sendo usado.

**Solução**:
1. Verifique se o arquivo `nixpacks.toml` está na raiz
2. Em Settings do service, adicione variável:
   ```
   NIXPACKS_CONFIG_FILE=nixpacks.toml
   ```

### Database connection refused

**Causa**: Variáveis de referência incorretas.

**Solução**: Use o formato correto do Railway:
```bash
DB_HOST=${{MySQL.MYSQLHOST}}
```

**IMPORTANTE**: Os nomes das variáveis podem variar. Verifique no service MySQL quais variáveis estão disponíveis e use as corretas.

### Workers não processam filas

**Verificar**:
1. `ENABLE_WORKERS=true` no service workers
2. Mesmas credenciais de Redis que a API
3. Logs: `railway logs -s cartback-workers`

### Build muito lento

**Causa**: pnpm install sem cache.

**Solução**: O Railway deve cachear automaticamente. Se não:
1. Use `pnpm install --prefer-offline` se necessário
2. Considere usar `pnpm install` sem `--frozen-lockfile` se o lock estiver causando problemas

---

## 🎯 Estrutura de Arquivos Railway

```
cartback/
├── nixpacks.toml                    # Config Node + pnpm (raiz)
├── railway.json                     # Config geral Railway
├── apps/
│   ├── api/
│   │   ├── railway.toml            # Config API
│   │   └── railway.workers.toml    # Config Workers
│   └── web/
│       └── railway.toml            # Config Web
└── packages/
    └── shared/
        └── (buildado automaticamente)
```

---

## 💡 Dicas Importantes

1. **Root Directory sempre `.`** (raiz do monorepo)
2. **Railway Config Path** aponta para o railway.toml específico
3. **Watch Paths** inclui `packages/shared/**` para rebuild quando shared mudar
4. **Shared package é buildado primeiro** em todos os builds
5. **Use referências de variáveis** (`${{service.VARIABLE}}`) entre services

---

## 🚀 Próximos Passos

Após o deploy:

1. Configure domínios customizados (opcional)
2. Configure Evolution API externa
3. Teste fluxo completo de checkout
4. Configure monitoramento (Sentry, etc)
5. Configure backups do MySQL

---

**Status**: ✅ Configurações corrigidas e prontas para deploy!
