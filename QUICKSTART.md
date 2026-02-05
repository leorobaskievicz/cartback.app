# 🚀 QuickStart - CartBack

Guia rápido para iniciar o ambiente de desenvolvimento.

---

## 1️⃣ Iniciar Ambiente Docker

```bash
cd cartback

# Parar e limpar containers existentes (se houver)
docker compose down -v

# Iniciar todos os serviços (MySQL, Redis, Evolution API)
docker compose up -d

# Verificar se estão rodando
docker compose ps
```

**Esperado:** 3 containers rodando
- ✅ `cartback-mysql` (porta 3306)
- ✅ `cartback-redis` (porta 6379)
- ✅ `cartback_evolution` (porta 8080)

---

## 2️⃣ Aguardar Inicialização

```bash
# Ver logs em tempo real
docker compose logs -f

# Ou apenas da Evolution API
docker compose logs -f evolution
```

Aguarde até ver mensagens de sucesso na Evolution API.

---

## 3️⃣ Testar Conexões

### Testar Evolution API

```bash
# Health check
curl http://localhost:8080

# Listar instâncias
curl http://localhost:8080/instance/fetchInstances \
  -H "apikey: cartback_dev_key_123"
```

### Testar MySQL

```bash
# Verificar se databases foram criados
docker exec -it cartback-mysql mysql -u root -proot -e "SHOW DATABASES;"
```

Deve aparecer:
- `cartback`
- `cartback_evolution`

### Testar Redis

```bash
# Verificar se Redis está respondendo
docker exec -it cartback-redis redis-cli ping
```

Resposta: `PONG`

---

## 4️⃣ Instalar Dependências

```bash
cd cartback

# Instalar dependências (pnpm)
pnpm install
```

---

## 5️⃣ Rodar Migrations

```bash
cd apps/api

# Rodar migrations
node ace migration:run

# Popular dados iniciais (seed)
node ace db:seed
```

**Credenciais de teste:**
- Email: `admin@cartback.com`
- Senha: `password123`

---

## 6️⃣ Iniciar Backend

```bash
cd apps/api

# Desenvolvimento com hot reload
pnpm dev
```

API rodando em: `http://localhost:3333`

---

## 7️⃣ Iniciar Frontend

```bash
# Em outro terminal
cd apps/web

# Desenvolvimento
pnpm dev
```

Frontend rodando em: `http://localhost:5173`

---

## 8️⃣ Testar API

### Login

```bash
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cartback.com",
    "password": "password123"
  }'
```

Copie o `token` da resposta.

### Testar rota autenticada

```bash
curl -X GET http://localhost:3333/api/auth/me \
  -H "Authorization: Bearer {SEU_TOKEN}"
```

### Conectar WhatsApp (Evolution API)

```bash
curl -X POST http://localhost:3333/api/whatsapp/connect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {SEU_TOKEN}" \
  -d '{
    "instanceName": "cartback-tenant-1"
  }'
```

Escanear o QR code retornado no WhatsApp.

---

## 9️⃣ Acessar Frontend

1. Abrir navegador: `http://localhost:5173`
2. Login:
   - Email: `admin@cartback.com`
   - Senha: `password123`

---

## 🛑 Parar Ambiente

```bash
# Parar containers mas manter dados
docker compose stop

# Parar e remover containers (mantém volumes)
docker compose down

# Parar, remover containers E volumes (limpa tudo)
docker compose down -v
```

---

## 🔧 Comandos Úteis

### Docker

```bash
# Ver logs em tempo real
docker compose logs -f

# Reiniciar serviço específico
docker compose restart evolution

# Ver status
docker compose ps

# Executar comando em container
docker exec -it cartback-mysql bash
```

### Backend (AdonisJS)

```bash
# Criar migration
node ace make:migration nome_da_migration

# Rodar migrations
node ace migration:run

# Reverter última migration
node ace migration:rollback

# Criar model
node ace make:model NomeDoModel

# Criar controller
node ace make:controller NomeDoController

# Criar seeder
node ace make:seeder NomeDoSeeder
```

### Frontend (React + Vite)

```bash
# Build de produção
pnpm build

# Preview do build
pnpm preview

# Lint
pnpm lint
```

---

## 📚 Documentação

- **API Reference:** `apps/api/API_REFERENCE.md`
- **Database Schema:** `apps/api/DATABASE.md`
- **Controllers/Services:** `apps/api/CONTROLLERS_SERVICES.md`
- **Evolution API Setup:** `EVOLUTION_SETUP.md`
- **README:** `README.md`

---

## 🐛 Troubleshooting

### Porta já em uso

```bash
# Verificar o que está usando a porta
lsof -i :3333  # Backend
lsof -i :5173  # Frontend
lsof -i :8080  # Evolution API

# Matar processo
kill -9 {PID}
```

### Migrations não rodam

```bash
# Verificar se MySQL está rodando
docker compose ps mysql

# Verificar conexão
docker exec -it cartback-mysql mysql -u cartback -pcartback -e "SELECT 1;"

# Recriar database
docker compose down -v
docker compose up -d
```

### Evolution API não responde

```bash
# Ver logs
docker compose logs evolution

# Reiniciar
docker compose restart evolution

# Recriar
docker compose up -d --force-recreate evolution
```

---

**Pronto!** 🎉 Ambiente completo rodando!

**Portas:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3333
- Evolution API: http://localhost:8080
- MySQL: localhost:3306
- Redis: localhost:6379
