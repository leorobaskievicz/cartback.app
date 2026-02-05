# Evolution API - Setup e Configuração

Guia completo para configurar e usar a Evolution API no ambiente de desenvolvimento do CartBack.

---

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- Porta 8080 disponível
- MySQL e Redis rodando (via docker-compose)

---

## 🚀 Como Subir Localmente

### 1. Parar containers existentes (se necessário)

```bash
cd cartback
docker compose down -v
```

> ⚠️ O flag `-v` remove os volumes. Use apenas se quiser limpar completamente.

### 2. Iniciar todos os serviços

```bash
docker compose up -d
```

Isso iniciará:
- **MySQL** (porta 3306)
- **Redis** (porta 6379)
- **Evolution API** (porta 8080)

### 3. Verificar status dos containers

```bash
docker compose ps
```

Você deve ver 3 containers rodando:
- `cartback-mysql`
- `cartback-redis`
- `cartback_evolution`

### 4. Verificar logs da Evolution API

```bash
docker compose logs -f evolution
```

Aguarde até ver mensagens indicando que a API está pronta.

---

## 🧪 Como Testar a Conexão

### Teste 1: Health Check

```bash
curl http://localhost:8080
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "version": "x.x.x"
}
```

### Teste 2: Listar Instâncias

```bash
curl -X GET http://localhost:8080/instance/fetchInstances \
  -H "apikey: cartback_dev_key_123"
```

**Resposta esperada (array vazio inicialmente):**
```json
[]
```

### Teste 3: Criar uma Instância de Teste

```bash
curl -X POST http://localhost:8080/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: cartback_dev_key_123" \
  -d '{
    "instanceName": "test_instance",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

**Resposta esperada:**
```json
{
  "instance": {
    "instanceName": "test_instance",
    "status": "created"
  },
  "hash": {
    "apikey": "..."
  },
  "qrcode": {
    "code": "...",
    "base64": "data:image/png;base64,..."
  }
}
```

---

## 📱 Como Conectar WhatsApp (QR Code)

### Via API do CartBack

1. **Fazer login na API:**

```bash
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cartback.com",
    "password": "password123"
  }'
```

Copie o `token` da resposta.

2. **Solicitar conexão WhatsApp:**

```bash
curl -X POST http://localhost:3333/api/whatsapp/connect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "instanceName": "cartback-tenant-1"
  }'
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,...",
    "instanceName": "cartback-tenant-1"
  }
}
```

3. **Escanear QR Code:**

- Copie o `qrCode` (base64)
- Cole em um visualizador de base64 ou diretamente no HTML
- Abra o WhatsApp no celular
- Vá em **Dispositivos Vinculados** > **Vincular Dispositivo**
- Escaneie o QR code

4. **Verificar status da conexão:**

```bash
curl -X GET http://localhost:3333/api/whatsapp \
  -H "Authorization: Bearer {TOKEN}"
```

**Resposta quando conectado:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "instance": {
      "instanceName": "cartback-tenant-1",
      "phoneNumber": "5511999999999",
      "status": "connected"
    }
  }
}
```

### Via Evolution API Diretamente

1. **Criar instância:**

```bash
curl -X POST http://localhost:8080/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: cartback_dev_key_123" \
  -d '{
    "instanceName": "my_whatsapp",
    "qrcode": true
  }'
```

2. **Buscar QR Code atualizado:**

```bash
curl -X GET http://localhost:8080/instance/connect/my_whatsapp \
  -H "apikey: cartback_dev_key_123"
```

3. **Escanear e aguardar conexão**

---

## 🔌 Endpoints Principais da Evolution API

### Gerenciamento de Instâncias

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/instance/create` | Cria nova instância |
| GET | `/instance/fetchInstances` | Lista todas as instâncias |
| GET | `/instance/connect/:instanceName` | Busca QR code |
| GET | `/instance/connectionState/:instanceName` | Status da conexão |
| DELETE | `/instance/delete/:instanceName` | Remove instância |

### Envio de Mensagens

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/message/sendText/:instanceName` | Envia mensagem de texto |
| POST | `/message/sendMedia/:instanceName` | Envia mídia |
| POST | `/message/sendLocation/:instanceName` | Envia localização |

### Webhooks

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/webhook/set/:instanceName` | Configura webhook |
| GET | `/webhook/find/:instanceName` | Busca webhook configurado |

### Exemplos de Uso

**Enviar mensagem de texto:**

```bash
curl -X POST http://localhost:8080/message/sendText/my_whatsapp \
  -H "Content-Type: application/json" \
  -H "apikey: cartback_dev_key_123" \
  -d '{
    "number": "5511999999999",
    "text": "Olá! Esta é uma mensagem de teste."
  }'
```

**Configurar webhook:**

```bash
curl -X POST http://localhost:8080/webhook/set/my_whatsapp \
  -H "Content-Type: application/json" \
  -H "apikey: cartback_dev_key_123" \
  -d '{
    "url": "http://localhost:3333/api/whatsapp/webhook",
    "events": [
      "qrcode.updated",
      "connection.update",
      "messages.upsert"
    ]
  }'
```

---

## 🔧 Configurações do Docker Compose

A Evolution API está configurada com:

```yaml
environment:
  - SERVER_URL=http://localhost:8080
  - AUTHENTICATION_API_KEY=cartback_dev_key_123
  - DATABASE_PROVIDER=mysql
  - DATABASE_CONNECTION_URI=mysql://cartback:cartback@mysql:3306/cartback_evolution
  - REDIS_ENABLED=true
  - REDIS_URI=redis://redis:6379/1
  - WEBSOCKET_ENABLED=true
  - CONFIG_SESSION_PHONE_CLIENT=Cartback
  - CONFIG_SESSION_PHONE_NAME=Chrome
```

### Variáveis Importantes

- **AUTHENTICATION_API_KEY**: Chave de autenticação para a API
- **DATABASE_CONNECTION_URI**: Conexão com MySQL (database separado `cartback_evolution`)
- **REDIS_URI**: Cache e filas (database 1 do Redis)
- **SERVER_URL**: URL pública da API

---

## 📂 Estrutura de Volumes

```
evolution_instances:/evolution/instances
```

Armazena:
- Sessões do WhatsApp
- QR codes
- Tokens de autenticação
- Estado das conexões

---

## 🐛 Troubleshooting

### Problema: Evolution API não inicia

**Verificar logs:**
```bash
docker compose logs evolution
```

**Soluções comuns:**
- Aguardar MySQL estar pronto (healthcheck)
- Verificar se porta 8080 está livre
- Recriar containers: `docker compose up -d --force-recreate evolution`

### Problema: QR Code expirado

**Solução:**
```bash
curl -X GET http://localhost:8080/instance/connect/:instanceName \
  -H "apikey: cartback_dev_key_123"
```

Gera um novo QR code.

### Problema: Conexão perdida

**Verificar estado:**
```bash
curl -X GET http://localhost:8080/instance/connectionState/:instanceName \
  -H "apikey: cartback_dev_key_123"
```

**Reconectar:**
```bash
curl -X GET http://localhost:8080/instance/connect/:instanceName \
  -H "apikey: cartback_dev_key_123"
```

### Problema: Database não encontrado

**Verificar se database foi criado:**
```bash
docker exec -it cartback-mysql mysql -u root -proot -e "SHOW DATABASES;"
```

Deve aparecer `cartback_evolution`.

**Recriar database:**
```bash
docker compose down -v
docker compose up -d
```

---

## 🔐 Segurança em Produção

⚠️ **IMPORTANTE**: As configurações atuais são para desenvolvimento.

Em produção, você deve:

1. **Mudar a API Key:**
   ```bash
   AUTHENTICATION_API_KEY=sua_chave_super_secreta_aqui
   ```

2. **Usar HTTPS:**
   ```bash
   SERVER_URL=https://evolution.seudominio.com
   ```

3. **Configurar rate limiting**

4. **Habilitar autenticação de instâncias**

5. **Usar variáveis de ambiente secretas**

---

## 📚 Documentação Oficial

- **Evolution API**: https://doc.evolution-api.com
- **GitHub**: https://github.com/EvolutionAPI/evolution-api
- **Docker Hub**: https://hub.docker.com/r/atendai/evolution-api

---

## 🎯 Próximos Passos

1. ✅ Evolution API rodando
2. ⬜ Implementar `EvolutionApiService` completo
3. ⬜ Criar jobs para envio de mensagens agendadas
4. ⬜ Configurar webhooks para rastrear status de mensagens
5. ⬜ Implementar retry logic para mensagens falhadas

---

## 💡 Dicas

- **Logs em tempo real:** `docker compose logs -f evolution`
- **Reiniciar apenas Evolution:** `docker compose restart evolution`
- **Limpar tudo:** `docker compose down -v && docker compose up -d`
- **Backup de instâncias:** O volume `evolution_instances` contém todas as sessões

---

**Status:** ✅ Evolution API configurada e pronta para uso em desenvolvimento!
