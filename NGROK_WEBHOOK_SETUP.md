# 🌐 Configurar Ngrok para Testar Webhook Asaas

## 📋 Passo a Passo Completo

### 1️⃣ Iniciar o Backend (se ainda não estiver rodando)

```bash
cd /usr/local/var/www/vhosts/cartback/apps/api
pnpm dev
```

**Verificar se está rodando:** http://localhost:3333

---

### 2️⃣ Em OUTRO terminal, iniciar o Ngrok

```bash
ngrok http 3333
```

**Você verá algo assim:**

```
ngrok

Session Status                online
Account                       seu@email.com (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123xyz.ngrok-free.app -> http://localhost:3333

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**📝 COPIE a URL do "Forwarding":**
```
https://abc123xyz.ngrok-free.app
```

---

### 3️⃣ Configurar Webhook no Painel Asaas

#### A) Acessar o Painel Sandbox

1. Abrir: https://sandbox.asaas.com/
2. Fazer login
3. Menu lateral → **Configurações** → **Webhooks**
   - Ou: https://sandbox.asaas.com/webhooks

#### B) Adicionar Novo Webhook

Clicar em **"+ Adicionar Webhook"** ou **"Novo Webhook"**

**Preencher:**

| Campo | Valor |
|-------|-------|
| **Nome** | CartBack Dev |
| **URL** | `https://SUA-URL-NGROK.ngrok-free.app/api/webhooks/asaas` |
| **Token de Autenticação** | `cartback_webhook_secret_token_2024` |
| **Método** | POST |
| **Status** | Ativo ✅ |

**Eventos para marcar:**
- ✅ `PAYMENT_CONFIRMED` (Pagamento confirmado)
- ✅ `PAYMENT_RECEIVED` (Pagamento recebido)
- ✅ `PAYMENT_OVERDUE` (Pagamento vencido)

**Exemplo de URL completa:**
```
https://abc123xyz.ngrok-free.app/api/webhooks/asaas
```

⚠️ **IMPORTANTE:** Cole a URL **SEM barra no final**!

#### C) Salvar

Clicar em **"Salvar"** ou **"Criar"**

---

### 4️⃣ Testar o Webhook

#### A) Teste Direto pelo Painel Asaas

Alguns painéis têm botão **"Testar Webhook"** que envia um evento de teste.

#### B) Criar um Pagamento de Teste

1. **No CartBack frontend** (http://localhost:5173):
   - Login: `admin@cartback.com` / `password123`
   - Ir em **Planos**
   - Escolher **Pro**
   - Selecionar **Boleto**
   - Confirmar

2. **Verificar logs do backend** (terminal onde está `pnpm dev`):
   ```
   ✅ Deve aparecer algo como:
   🔑 Asaas API Key loaded: $aact_hmlg_...
   [19:55:10.121] INFO: Subscription created...
   ```

3. **No painel Asaas**:
   - Ir em **Cobranças** ou **Faturas**
   - Encontrar a cobrança que foi criada
   - Clicar nela
   - Procurar botão **"Confirmar Pagamento"** ou **"Marcar como Pago"**
   - Confirmar

4. **Webhook será enviado automaticamente!**

   **Logs esperados no backend:**
   ```
   [Asaas Webhook] Event: PAYMENT_CONFIRMED pay_abc123...
   ✅ PaymentHistory status updated
   ✅ Subscription activated with plan: pro
   ```

---

### 5️⃣ Verificar se Funcionou

#### A) Ver Logs do Ngrok

Abrir em outro navegador: http://127.0.0.1:4040

Vai mostrar todas as requisições HTTP que passaram pelo ngrok, incluindo o webhook!

#### B) Verificar no Banco de Dados

```bash
docker exec cartback-mysql mysql -u cartback -pcartback cartback -e "
  SELECT plan, status, messages_limit
  FROM subscriptions
  WHERE tenant_id = 1;
" 2>&1 | grep -v "Warning"
```

**Resultado esperado:**
```
plan    status  messages_limit
pro     active  2000
```

#### C) Verificar no Frontend

1. Dar **F5** na página de Planos
2. Deve mostrar:
   - ✅ Plano: **Pro**
   - ✅ Status: **Ativo**
   - ✅ Mensagens: **2000**

---

### 6️⃣ Testar Manualmente (Opcional)

Se quiser simular o webhook sem passar pelo Asaas:

```bash
# 1. Pegar o external_payment_id
docker exec cartback-mysql mysql -u cartback -pcartback cartback -e "
  SELECT external_payment_id, target_plan, status
  FROM payment_histories
  ORDER BY id DESC
  LIMIT 1;
" 2>&1 | grep -v "Warning"

# 2. Copiar o external_payment_id e colar abaixo
curl -X POST http://localhost:3333/api/webhooks/asaas \
  -H "asaas-access-token: cartback_webhook_secret_token_2024" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PAYMENT_CONFIRMED",
    "payment": {
      "id": "COLE_O_EXTERNAL_PAYMENT_ID_AQUI"
    }
  }'
```

**Resposta esperada:**
```json
{
  "received": true
}
```

---

## 🐛 Troubleshooting

### Erro: "Webhook não está chegando"

**1. Verificar se ngrok está rodando:**
```bash
curl https://SUA-URL.ngrok-free.app/
# Deve retornar: {"message":"CartBack API is running"...}
```

**2. Testar endpoint do webhook:**
```bash
curl -X POST https://SUA-URL.ngrok-free.app/api/webhooks/asaas \
  -H "asaas-access-token: cartback_webhook_secret_token_2024" \
  -H "Content-Type: application/json" \
  -d '{"event":"TEST","payment":{"id":"test"}}'
```

**3. Ver logs do ngrok:**
- Abrir: http://127.0.0.1:4040
- Verificar se a requisição chegou
- Ver status code (deve ser 200)

**4. Verificar logs do backend:**
- Terminal onde está `pnpm dev`
- Deve aparecer: `[Asaas Webhook] Event: ...`

---

### Erro: "Invalid webhook token"

**Causa:** Token errado no painel Asaas

**Solução:**
1. Voltar no painel Asaas → Webhooks
2. Editar o webhook
3. Token deve ser EXATAMENTE: `cartback_webhook_secret_token_2024`
4. Salvar

---

### Erro: "Payment not found"

**Causa:** O `external_payment_id` não existe no banco

**Solução:**
```bash
# Ver IDs disponíveis
docker exec cartback-mysql mysql -u cartback -pcartback cartback -e "
  SELECT id, external_payment_id, target_plan, status
  FROM payment_histories;
" 2>&1 | grep -v "Warning"
```

---

### Ngrok: "Session Expired"

**Causa:** Plano gratuito do ngrok tem limite de tempo

**Solução:**
1. Criar conta gratuita em: https://dashboard.ngrok.com/signup
2. Copiar seu authtoken
3. Configurar:
   ```bash
   ngrok config add-authtoken SEU_TOKEN_AQUI
   ```
4. Rodar novamente: `ngrok http 3333`

---

## 📝 Comandos Úteis

### Ver todos os webhooks recebidos (logs do ngrok):
```
http://127.0.0.1:4040/inspect/http
```

### Parar ngrok:
```
Ctrl + C no terminal do ngrok
```

### Ver webhooks configurados no Asaas:
```
https://sandbox.asaas.com/webhooks
```

### Limpar dados de teste:
```bash
docker exec cartback-mysql mysql -u cartback -pcartback cartback -e "
  UPDATE subscriptions SET plan = 'trial', status = 'trial' WHERE tenant_id = 1;
  DELETE FROM payment_histories WHERE tenant_id = 1;
" 2>&1 | grep -v "Warning"
```

---

## ✅ Checklist Final

Antes de testar, verificar:

- [ ] Backend rodando em `localhost:3333`
- [ ] Ngrok rodando e mostrando URL
- [ ] URL do ngrok configurada no Asaas
- [ ] Token configurado corretamente
- [ ] Eventos marcados (PAYMENT_CONFIRMED, etc)
- [ ] CPF/CNPJ cadastrado no tenant
- [ ] Frontend rodando em `localhost:5173`

---

## 🎯 Fluxo Completo de Teste

```
1. ✅ Backend rodando (pnpm dev)
2. ✅ Ngrok rodando (ngrok http 3333)
3. ✅ Webhook configurado no Asaas
4. ✅ Login no frontend
5. ✅ Escolher plano Pro + Boleto
6. ✅ Confirmar checkout
7. ✅ Ver no Asaas: cobrança criada
8. ✅ Marcar como pago no Asaas
9. ✅ Webhook enviado automaticamente
10. ✅ Logs do backend mostram: PAYMENT_CONFIRMED
11. ✅ Plano ativado no CartBack
12. 🎉 SUCESSO!
```

---

**Qualquer dúvida, consulte os logs em:**
- Backend: Terminal onde roda `pnpm dev`
- Ngrok: http://127.0.0.1:4040
- Banco: `docker exec cartback-mysql mysql...`
