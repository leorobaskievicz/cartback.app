# 🔍 Debug: Evolution API no Railway - QR Code não aparece

## 📊 Diagnóstico do Problema

### O que está acontecendo:
- ✅ Local: Evolution API cria instância e QR code aparece
- ❌ Produção (Railway): Instância é criada mas QR code nunca aparece

---

## 🎯 Possíveis Causas

### 1. Service Evolution API não está deployado no Railway
**Como verificar:**
```bash
railway service list
```

Você deve ver um service chamado `cartback-evolution` ou similar.

**Se NÃO existir, você precisa criar:**

#### Opção A: Via Railway CLI
```bash
railway service create cartback-evolution
railway link --service cartback-evolution
```

#### Opção B: Via Railway Dashboard
1. Acesse https://railway.app/dashboard
2. Abra seu projeto Cartback
3. Clique em "+ New"
4. Selecione "Empty Service"
5. Nome: `cartback-evolution`
6. Em Settings → Deploy:
   - Container Image: `atendai/evolution-api:v2.0.10`
   - Port: `8080`

---

### 2. Variáveis de Ambiente do Evolution API

O service `cartback-evolution` no Railway **PRECISA** ter estas variáveis:

```bash
# Servidor
SERVER_URL=https://cartback-evolution.up.railway.app
PORT=8080

# Autenticação
AUTHENTICATION_API_KEY=cbk_evo_prod_a7f8d9e2c1b4f6h3j5k8m2n9p4q7

# Database (MySQL do Railway)
DATABASE_ENABLED=true
DATABASE_PROVIDER=mysql
DATABASE_CONNECTION_URI=${{MySQL.MYSQLURL}}
DATABASE_CONNECTION_CLIENT_NAME=cartback_evolution

# Cache (usar local em vez de Redis)
CACHE_REDIS_ENABLED=false
CACHE_LOCAL_ENABLED=true

# Logs
LOG_LEVEL=ERROR

# Sessão
CONFIG_SESSION_PHONE_CLIENT=Cartback
CONFIG_SESSION_PHONE_NAME=Chrome

# Não deletar instância automaticamente
DEL_INSTANCE=false
```

**IMPORTANTE:** Use `${{MySQL.MYSQLURL}}` para referenciar o MySQL do Railway.

---

### 3. Variáveis de Ambiente da API (cartback-api)

Verifique se no service `cartback-api` você tem:

```bash
# URL pública da sua API (onde o webhook vai receber)
APP_URL=https://api-cartback.up.railway.app
# OU se usar domínio customizado:
# APP_URL=https://api.cartback.com.br

# URL do Evolution API
EVOLUTION_API_URL=https://cartback-evolution.up.railway.app

# API Key (mesma configurada no Evolution)
EVOLUTION_API_KEY=cbk_evo_prod_a7f8d9e2c1b4f6h3j5k8m2n9p4q7
```

**⚠️ ERRO COMUM:**
Se `APP_URL` estiver com `localhost` ou `host.docker.internal`, o webhook NÃO vai funcionar!

---

### 4. Domínio Público do Evolution

O service `cartback-evolution` precisa ter um domínio público para funcionar.

**Como gerar:**
1. Railway Dashboard → Service `cartback-evolution`
2. Settings → Networking → Generate Domain
3. Copie a URL gerada (ex: `cartback-evolution.up.railway.app`)
4. Cole na variável `EVOLUTION_API_URL` da API

---

## 🧪 Testes de Diagnóstico

### Teste 1: Evolution API está rodando?
```bash
curl https://cartback-evolution.up.railway.app
```

**Resposta esperada:**
```json
{
  "status": 200,
  "message": "Welcome to the Evolution API..."
}
```

**Se der erro:** O service não está rodando ou não tem domínio público.

---

### Teste 2: API consegue acessar Evolution?
```bash
railway run -s cartback-api curl $EVOLUTION_API_URL
```

**Resposta esperada:** Similar ao Teste 1.

**Se der timeout:** Problema de rede/DNS.

---

### Teste 3: Criar instância via Evolution direto
```bash
curl -X POST https://cartback-evolution.up.railway.app/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: cbk_evo_prod_a7f8d9e2c1b4f6h3j5k8m2n9p4q7" \
  -d '{
    "instanceName": "test_debug",
    "qrcode": true
  }'
```

**Resposta esperada:**
```json
{
  "instance": { ... },
  "qrcode": {
    "code": "...",
    "base64": "data:image/png;base64,..."
  }
}
```

**Se retornar QR Code:** Evolution está OK. O problema é na integração.

**Se NÃO retornar QR Code:** Evolution está com problema.

---

### Teste 4: Webhook está acessível?
```bash
curl https://api-cartback.up.railway.app/health
```

**Se der erro:** Problema no deploy da API.

---

## 🔧 Soluções por Cenário

### Cenário A: Service Evolution não existe
1. Criar service via Dashboard ou CLI
2. Configurar variáveis de ambiente
3. Deploy da imagem Docker `atendai/evolution-api:v2.0.10`
4. Gerar domínio público
5. Atualizar `EVOLUTION_API_URL` na API

---

### Cenário B: Evolution existe mas QR não gera
**Problema:** Versão incompatível ou config errada.

**Solução:**
1. Verificar se está usando **v2.0.10** (não v1.7.4)
2. Verificar variáveis de ambiente (especialmente DATABASE e CACHE)
3. Verificar logs:
   ```bash
   railway logs -s cartback-evolution
   ```

---

### Cenário C: Evolution gera QR mas webhook não chega
**Problema:** URL do webhook incorreta ou não acessível.

**Solução:**
1. Verificar se `APP_URL` está correto (URL pública, não localhost)
2. Verificar se `/api/webhooks/whatsapp` está acessível (sem auth)
3. Verificar logs da API:
   ```bash
   railway logs -s cartback-api | grep "webhook"
   ```

---

### Cenário D: Webhook chega mas não salva no banco
**Problema:** Code do controller/banco.

**Solução:**
1. Verificar logs da API para erros
2. Verificar se migrations rodaram:
   ```bash
   railway run -s cartback-api node ace migration:status
   ```
3. Se necessário, rodar migrations:
   ```bash
   railway run -s cartback-api node ace migration:run --force
   ```

---

## 📝 Checklist de Verificação Rápida

- [ ] Service `cartback-evolution` existe no Railway?
- [ ] Evolution tem domínio público gerado?
- [ ] Evolution responde no health check?
- [ ] Variável `EVOLUTION_API_URL` na API aponta para URL correta?
- [ ] Variável `EVOLUTION_API_KEY` é a mesma nos dois services?
- [ ] Variável `APP_URL` está com URL pública (não localhost)?
- [ ] Teste criar instância direto no Evolution funciona?
- [ ] Webhook `/api/webhooks/whatsapp` está acessível sem auth?
- [ ] Logs do Evolution mostram erros?
- [ ] Logs da API mostram webhooks chegando?

---

## 🚀 Comandos Úteis

### Ver todos os services
```bash
railway service list
```

### Ver variáveis de um service
```bash
railway variables -s cartback-evolution
railway variables -s cartback-api
```

### Ver logs em tempo real
```bash
railway logs -s cartback-evolution -f
railway logs -s cartback-api -f
```

### Restart de um service
```bash
railway restart -s cartback-evolution
railway restart -s cartback-api
```

### SSH no service (debug avançado)
```bash
railway run -s cartback-api sh
```

---

## 📞 Próximos Passos

1. **Execute os Testes 1-4** e anote os resultados
2. **Identifique o cenário** (A, B, C ou D)
3. **Aplique a solução** correspondente
4. **Teste novamente** criando uma instância no frontend

Se nenhuma solução funcionar, compartilhe:
- Logs do Evolution
- Logs da API
- Resultados dos 4 testes
- Print das variáveis de ambiente

---

**Boa sorte! 🚀**
