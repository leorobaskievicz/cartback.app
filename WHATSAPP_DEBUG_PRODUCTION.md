# 🔍 Debug: WhatsApp não Dispara em Produção

## 📊 Situação

- ✅ Carrinhos aparecem no painel
- ✅ Agendamentos são criados
- ❌ Mensagens não chegam no WhatsApp

---

## 🎯 Possíveis Causas (em ordem de probabilidade)

### 1. Service Workers Não Está Rodando (80%)
Os jobs ficam na fila mas nunca são processados.

### 2. WhatsApp Não Conectado em Produção (10%)
Workers tentam enviar mas a instância não está conectada.

### 3. Evolution API Inacessível dos Workers (5%)
Workers não conseguem se comunicar com Evolution.

### 4. Redis Desconectado (3%)
Filas não funcionam.

### 5. Rate Limit/Health Block (2%)
Mensagens sendo bloqueadas por proteção.

---

## 🧪 Checklist de Diagnóstico

Execute cada teste na ordem e me avise os resultados:

### ✅ Teste 1: Service Workers Existe?

```bash
railway service list
```

**O que procurar:**
- Deve ter um service chamado `cartback-workers`

**Se NÃO existir:**
- Você precisa criar o service! (veja seção "Criar Service Workers")

---

### ✅ Teste 2: Workers Está Rodando?

```bash
railway logs -s cartback-workers --lines 50
```

**O que procurar:**
```
✅ Workers initialized and running
```

**Se aparecer erro:**
- Redis connection failed → Problema no Redis
- Cannot find module → Build com problemas
- Nenhum log → Service parado

---

### ✅ Teste 3: WhatsApp Conectado?

```bash
curl https://api.cartback.app/api/whatsapp \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resultado esperado:**
```json
{
  "connected": true,
  "instance": {
    "status": "connected",
    "phoneNumber": "5541999..."
  }
}
```

**Se `connected: false`:**
- Conecte o WhatsApp primeiro no painel em produção

---

### ✅ Teste 4: Verificar Variáveis dos Workers

```bash
railway variables -s cartback-workers | grep -E "(REDIS|EVOLUTION|ENABLE_WORKERS)"
```

**Deve ter:**
```bash
ENABLE_WORKERS=true
REDIS_HOST=...
REDIS_PORT=6379
REDIS_PASSWORD=...
EVOLUTION_API_URL=https://cartback-evolution-production.up.railway.app
EVOLUTION_API_KEY=cbk_evo_prod_...
```

**Se ENABLE_WORKERS=false:**
- Esse é o problema! Mude para `true`

---

### ✅ Teste 5: Logs Detalhados dos Workers

```bash
railway logs -s cartback-workers -f
```

Deixe rodando e **crie um novo carrinho de teste** no sistema.

**O que deve aparecer:**
```
[ProcessAbandonedCart] Processando carrinho 123
[SendMessage] Processando envio da mensagem 456
[SendMessage] Enviando mensagem para 41999261087...
[SendMessage] ✅ Mensagem 456 enviada com sucesso
```

**Se NÃO aparecer nada:**
- Jobs não estão sendo consumidos (problema no Redis ou workers)

**Se aparecer erro:**
- Anote a mensagem de erro exata

---

### ✅ Teste 6: Evolution API Acessível?

```bash
# Do próprio workers
railway run -s cartback-workers curl $EVOLUTION_API_URL
```

**Resultado esperado:**
```json
{
  "status": 200,
  "message": "Welcome to Evolution API",
  "version": "2.0.10"
}
```

**Se der timeout:**
- Workers não conseguem acessar Evolution (problema de rede)

---

## 🔧 Soluções por Cenário

### Cenário A: Service Workers Não Existe

**Você precisa criar:**

#### Via Railway Dashboard:
1. Abra seu projeto no Railway
2. Clique em **+ New**
3. **GitHub Repo** → Selecione o repositório
4. Nome: `cartback-workers`
5. **Settings**:
   - Root Directory: `apps/api`
   - Build Command: `npm install && node ace build`
   - Start Command: `cd build && npm ci --omit=dev && node bin/workers.js`
   - Watch Paths: `apps/api/**`

6. **Variables** (copie TODAS as variáveis da API, mas mude):
   ```bash
   ENABLE_WORKERS=true
   ```

7. **Deploy**

---

### Cenário B: ENABLE_WORKERS=false

No Railway Dashboard:

1. Service `cartback-workers` → **Variables**
2. Edite `ENABLE_WORKERS` para `true`
3. **Redeploy**

---

### Cenário C: WhatsApp Desconectado

1. Acesse https://cartback.app (ou seu domínio)
2. Login
3. Menu **WhatsApp**
4. Clique **Conectar WhatsApp**
5. Escaneie o QR Code

**IMPORTANTE:** Precisa conectar em **PRODUÇÃO**, não local!

---

### Cenário D: Evolution API Inacessível

Verifique se as variáveis estão corretas:

```bash
# No cartback-workers
EVOLUTION_API_URL=https://cartback-evolution-production.up.railway.app

# NO cartback-evolution
SERVER_URL=https://cartback-evolution-production.up.railway.app
```

Se a URL estiver errada, corrija e redeploy.

---

### Cenário E: Redis Desconectado

Verifique se o Redis está rodando:

```bash
railway service list
```

Deve ter um service **Redis**.

Verifique se as variáveis de referência estão corretas:

```bash
# No cartback-workers
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}
```

**NÃO pode ser valores hardcoded!** Deve usar `${{Redis.XXX}}`

---

### Cenário F: Rate Limit Bloqueando

Verifique no painel:

```bash
curl https://api.cartback.app/api/whatsapp/health \
  -H "Authorization: Bearer SEU_TOKEN"
```

Se `qualityRating: "flagged"` → Está bloqueado por proteção

**Solução:**
- Aguardar 24h para quality score melhorar
- Ou desabilitar temporariamente o rate limit (não recomendado)

---

## 🚨 Debug Avançado

### Ver Jobs na Fila (Redis)

```bash
railway run -s cartback-api node -e "
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

redis.keys('bull:*').then(keys => {
  console.log('Keys encontradas:', keys.length);
  console.log('Filas:', keys.filter(k => k.includes(':id')));
  redis.quit();
});
"
```

**Se retornar 0 keys:**
- Redis vazio → Jobs não estão sendo criados

**Se retornar muitas keys:**
- Jobs estão enfileirando mas não sendo processados → Workers parados

---

### Forçar Processamento Manual

Se nada funcionar, force um envio manual para testar:

```bash
railway run -s cartback-api node --eval "
const evolutionApi = require('./build/app/services/evolution_api_service.js').default;

evolutionApi.sendText(
  'SEU_INSTANCE_NAME',
  '5541999261087',
  'Teste manual do CartBack'
).then(result => {
  console.log('✅ Enviado:', result);
  process.exit(0);
}).catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
"
```

**Se funcionar:**
- Evolution OK → Problema nos workers/filas

**Se NÃO funcionar:**
- Problema no Evolution ou WhatsApp desconectado

---

## 📝 Informações para Debug

Quando me enviar os resultados, inclua:

1. **Teste 1:** Service workers existe? (sim/não)
2. **Teste 2:** Logs dos workers (últimas 20 linhas)
3. **Teste 3:** WhatsApp conectado? (sim/não + status)
4. **Teste 4:** ENABLE_WORKERS=? (true/false)
5. **Teste 5:** O que aparece ao criar carrinho de teste?
6. **Prints:** Se possível, screenshot do Railway mostrando os services

---

## 🎯 Comando Completo de Diagnóstico

Execute tudo de uma vez:

```bash
echo "=== 1. Lista de Services ==="
railway service list

echo "\n=== 2. Workers Logs ==="
railway logs -s cartback-workers --lines 20

echo "\n=== 3. Workers Variables ==="
railway variables -s cartback-workers | grep -E "(ENABLE_WORKERS|REDIS|EVOLUTION)"

echo "\n=== 4. Evolution Health ==="
curl https://cartback-evolution-production.up.railway.app

echo "\n=== 5. API Health ==="
curl https://api.cartback.app/health
```

Cole o resultado completo e eu te digo exatamente o que fazer! 🚀

---

**Boa sorte!**
