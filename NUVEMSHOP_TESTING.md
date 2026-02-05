# 🧪 Guia de Teste da Integração Nuvemshop

Passo a passo completo para testar a integração com Nuvemshop/TiendaNube, incluindo OAuth, webhooks e fluxo de recuperação de carrinhos.

---

## 📋 Pré-requisitos

### 1. Conta na Nuvemshop

**Criar conta de teste:**
1. Acesse: https://www.nuvemshop.com.br/trial
2. Crie uma loja de teste gratuita (30 dias)
3. Anote a URL da loja: `https://sua-loja.lojavirtualnuvem.com.br`

### 2. Criar Aplicação (Partner)

**Registrar como Partner:**
1. Acesse: https://partners.nuvemshop.com.br
2. Crie uma conta de desenvolvedor
3. Clique em **"Criar nova aplicação"**

**Preencher dados:**
- **Nome**: CartBack Dev
- **URL**: http://localhost:5173
- **Descrição**: Sistema de recuperação de carrinhos (desenvolvimento)

**URL de Callback:**
```
http://localhost:3333/api/integrations/nuvemshop/callback
```

**Permissões (Scopes):**
- ✅ `read_orders`
- ✅ `read_customers`
- ✅ `read_products`
- ✅ `write_webhooks`

**Salvar credenciais:**
- **App ID**: Ex: `25664`
- **App Secret**: Ex: `67eaaa37955ca187f08ebb1495bb18a257c12b7c132616b5`

### 3. Configurar .env

```bash
# apps/api/.env
NUVEMSHOP_APP_ID=25664
NUVEMSHOP_APP_SECRET=67eaaa37955ca187f08ebb1495bb18a257c12b7c132616b5
NUVEMSHOP_REDIRECT_URI=http://localhost:3333/api/integrations/nuvemshop/callback

APP_URL=http://localhost:3333
WEB_URL=http://localhost:5173
```

⚠️ **IMPORTANTE**: Para testar webhooks localmente, você precisará do ngrok (ver seção abaixo).

---

## 🧪 Teste 1: OAuth Flow (Conexão)

### Objetivo
Verificar se o fluxo de autorização OAuth 2.0 funciona corretamente.

### Passos

**1. Iniciar Backend e Frontend**

```bash
# Terminal 1: Backend
cd /usr/local/var/www/vhosts/cartback/apps/api
pnpm dev

# Terminal 2: Frontend
cd /usr/local/var/www/vhosts/cartback/apps/web
pnpm dev
```

**2. Acessar Frontend**

1. Abrir: http://localhost:5173
2. Login: `admin@cartback.com` / `password123`
3. Ir em: **Integrações**

**3. Conectar Nuvemshop**

1. Clicar em **"Conectar Nuvemshop"**
2. Você será redirecionado para: `https://www.tiendanube.com/apps/25664/authorize?...`
3. Fazer login na sua loja de teste
4. Clicar em **"Autorizar"**

**4. Verificar Sucesso**

Você será redirecionado de volta para: `http://localhost:5173/integrations?connected=nuvemshop`

**5. Verificar no Frontend**

Deve aparecer:
```
✅ Nuvemshop
   Loja: Sua Loja
   Status: Conectada
   [Desconectar]
```

**6. Verificar no Backend (Logs)**

```bash
# Logs esperados:
[Nuvemshop Callback] Trocando código por token...
[Nuvemshop Callback] Token recebido para store ID: 123456
[Nuvemshop Callback] Loja: Sua Loja
[Nuvemshop Callback] Integração salva (ID: 1)
[Nuvemshop Callback] Configurando webhooks...
[Nuvemshop Callback] Webhooks configurados com sucesso!
```

**7. Verificar no Banco**

```bash
docker exec cartback-mysql mysql -u cartback -pcartback cartback -e "
  SELECT id, platform, store_name, store_url, is_active
  FROM store_integrations
  WHERE platform = 'nuvemshop';
" 2>&1 | grep -v "Warning"
```

**Resultado esperado:**
```
id  platform    store_name      store_url                                   is_active
1   nuvemshop   Sua Loja        https://sua-loja.lojavirtualnuvem.com.br    1
```

### ✅ Critérios de Sucesso

- [ ] Redirecionamento para Nuvemshop funcionou
- [ ] Autorização foi aceita
- [ ] Redirecionamento de volta funcionou
- [ ] Integração aparece no frontend
- [ ] Registro criado no banco
- [ ] Webhooks foram configurados (logs confirmam)

---

## 🧪 Teste 2: Webhooks com Ngrok

### Objetivo
Testar recebimento de webhooks de carrinho abandonado e pedido criado.

### Preparação: Configurar Ngrok

**1. Instalar Ngrok** (se ainda não tiver)

```bash
# macOS
brew install ngrok

# Ou baixar de: https://ngrok.com/download
```

**2. Criar Conta Gratuita**

1. Acesse: https://dashboard.ngrok.com/signup
2. Copie seu authtoken
3. Configure:
   ```bash
   ngrok config add-authtoken SEU_TOKEN_AQUI
   ```

**3. Iniciar Ngrok**

```bash
ngrok http 3333
```

**4. Copiar URL do Ngrok**

Você verá algo assim:
```
Forwarding   https://abc123xyz.ngrok-free.app -> http://localhost:3333
```

**Copie**: `https://abc123xyz.ngrok-free.app`

**5. Atualizar .env**

```bash
# apps/api/.env
APP_URL=https://abc123xyz.ngrok-free.app
```

**6. Reiniciar Backend**

```bash
# Ctrl+C no terminal do backend
pnpm dev
```

### Teste: Webhook de Carrinho Abandonado

**1. Desconectar e Reconectar Nuvemshop**

No frontend:
1. Clicar em **"Desconectar"** na integração Nuvemshop
2. Clicar em **"Conectar Nuvemshop"** novamente
3. Autorizar novamente

Isso reconfigurará os webhooks com a URL do ngrok.

**2. Criar Carrinho Abandonado na Loja**

1. Abrir sua loja de teste: `https://sua-loja.lojavirtualnuvem.com.br`
2. Adicionar um produto ao carrinho
3. Ir para o checkout
4. **IMPORTANTE**: Preencher:
   - Nome: João Silva
   - Email: joao@teste.com
   - **Telefone: 11999999999** (obrigatório!)
   - CEP: 01001-000
5. **NÃO finalizar o pedido** - apenas feche a aba

**3. Aguardar Webhook**

A Nuvemshop pode demorar de **3 a 15 minutos** para enviar o webhook de carrinho abandonado.

**4. Verificar Logs do Backend**

```bash
# Logs esperados:
[Nuvemshop Webhook] Recebido: cart/abandoned (tenant: uuid-123)
[Nuvemshop Webhook] ✅ Assinatura validada
[Nuvemshop Webhook] Carrinho 789456: João Silva - 11999999999
[Nuvemshop Webhook] ✅ Carrinho 789456 adicionado à fila de processamento
```

**5. Verificar no Ngrok**

Abrir: http://127.0.0.1:4040

Deve mostrar:
```
POST /api/webhooks/nuvemshop/{uuid}
Status: 200 OK
Headers: X-Linkedstore-HMAC-SHA256: abc123...
```

**6. Verificar no Banco**

```bash
docker exec cartback-mysql mysql -u cartback -pcartback cartback -e "
  SELECT id, customer_name, customer_phone, status, created_at
  FROM abandoned_carts
  WHERE tenant_id = 1
  ORDER BY id DESC LIMIT 1;
" 2>&1 | grep -v "Warning"
```

**Resultado esperado:**
```
id  customer_name   customer_phone  status      created_at
1   João Silva      11999999999     pending     2024-01-15 10:30:00
```

### Teste: Webhook de Pedido (Recuperação)

**1. Finalizar Pedido**

1. Voltar para o checkout da loja
2. Se o carrinho expirou, adicione produtos novamente
3. Preencher **MESMO telefone**: 11999999999
4. Finalizar o pedido

**2. Verificar Logs do Backend**

```bash
# Logs esperados:
[Nuvemshop Webhook] Recebido: order/created (tenant: uuid-123)
[Nuvemshop Webhook] ✅ Assinatura validada
[Nuvemshop Webhook] Pedido 1234 criado: João Silva - 11999999999
[Nuvemshop Webhook] ✅ Carrinho 1 marcado como recuperado
```

**3. Verificar no Banco**

```bash
docker exec cartback-mysql mysql -u cartback -pcartback cartback -e "
  SELECT id, status, recovered_at
  FROM abandoned_carts
  WHERE id = 1;
" 2>&1 | grep -v "Warning"
```

**Resultado esperado:**
```
id  status      recovered_at
1   recovered   2024-01-15 10:45:00
```

### ✅ Critérios de Sucesso

- [ ] Ngrok está rodando e acessível
- [ ] Webhooks foram reconfigurados com URL do ngrok
- [ ] Webhook de carrinho abandonado foi recebido
- [ ] Assinatura HMAC foi validada
- [ ] Carrinho foi salvo no banco com status "pending"
- [ ] Webhook de pedido foi recebido
- [ ] Carrinho foi marcado como "recovered"
- [ ] Mensagens pendentes foram canceladas

---

## 🧪 Teste 3: Desconexão

### Objetivo
Verificar se os webhooks são removidos ao desconectar a integração.

### Passos

**1. Verificar Webhooks Ativos na Nuvemshop**

```bash
# Pegar access_token do banco
ACCESS_TOKEN=$(docker exec cartback-mysql mysql -u cartback -pcartback cartback -se "
  SELECT access_token FROM store_integrations WHERE platform = 'nuvemshop';
" 2>&1 | grep -v "Warning")

STORE_ID=$(docker exec cartback-mysql mysql -u cartback -pcartback cartback -se "
  SELECT store_id FROM store_integrations WHERE platform = 'nuvemshop';
" 2>&1 | grep -v "Warning")

# Listar webhooks (via API Nuvemshop)
curl -X GET "https://api.tiendanube.com/v1/${STORE_ID}/webhooks" \
  -H "Authentication: bearer ${ACCESS_TOKEN}" \
  -H "User-Agent: CartBack (contato@cartback.com)"
```

**Resultado esperado:**
```json
[
  {
    "id": 123,
    "url": "https://abc123xyz.ngrok-free.app/api/webhooks/nuvemshop/...",
    "event": "cart/abandoned"
  },
  {
    "id": 124,
    "url": "https://abc123xyz.ngrok-free.app/api/webhooks/nuvemshop/.../order",
    "event": "order/created"
  }
]
```

**2. Desconectar no Frontend**

1. Ir em **Integrações**
2. Clicar em **"Desconectar"**
3. Confirmar

**3. Verificar Logs do Backend**

```bash
# Logs esperados:
[Integration] Webhook 123 removido
[Integration] Webhook 124 removido
```

**4. Verificar no Banco**

```bash
docker exec cartback-mysql mysql -u cartback -pcartback cartback -e "
  SELECT id, platform, is_active
  FROM store_integrations
  WHERE platform = 'nuvemshop';
" 2>&1 | grep -v "Warning"
```

**Resultado esperado:**
```
id  platform    is_active
1   nuvemshop   0
```

**5. Verificar Webhooks Removidos**

```bash
# Listar webhooks novamente
curl -X GET "https://api.tiendanube.com/v1/${STORE_ID}/webhooks" \
  -H "Authentication: bearer ${ACCESS_TOKEN}" \
  -H "User-Agent: CartBack (contato@cartback.com)"
```

**Resultado esperado:**
```json
[]
```

### ✅ Critérios de Sucesso

- [ ] Desconexão funcionou no frontend
- [ ] Integração marcada como `is_active = 0`
- [ ] Webhooks foram removidos da Nuvemshop
- [ ] Logs confirmam remoção dos webhooks

---

## 🐛 Troubleshooting

### Erro: "Invalid redirect_uri"

**Causa**: URL de callback não está autorizada no app da Nuvemshop.

**Solução**:
1. Ir em: https://partners.nuvemshop.com.br
2. Editar seu app
3. Adicionar: `http://localhost:3333/api/integrations/nuvemshop/callback`
4. Salvar

---

### Webhook não chega

**Verificar**:

1. **Ngrok está rodando?**
   ```bash
   curl https://abc123xyz.ngrok-free.app/
   # Deve retornar: {"message":"CartBack API is running"}
   ```

2. **URL do webhook está correta?**
   ```bash
   docker exec cartback-mysql mysql -u cartback -pcartback cartback -e "
     SELECT id FROM store_integrations WHERE platform = 'nuvemshop';
   " 2>&1 | grep -v "Warning"

   # Ver logs de quando conectou para confirmar URL
   ```

3. **Webhook foi criado?**
   ```bash
   # Listar webhooks na Nuvemshop (ver comando acima)
   ```

4. **Ver requisições no Ngrok**:
   - Abrir: http://127.0.0.1:4040
   - Verificar se requisições chegaram

---

### Erro: "Invalid signature"

**Causa**: Assinatura HMAC não está válida.

**Verificar**:
```bash
# .env deve ter o App Secret correto
grep NUVEMSHOP_APP_SECRET .env
```

**Solução**:
- Confirme que `NUVEMSHOP_APP_SECRET` é o mesmo do painel Partners
- Reinicie o backend após alterar `.env`

---

### Carrinho não aparece no banco

**Verificar**:

1. **Telefone foi preenchido?**
   - Webhook ignora carrinhos sem telefone
   - Logs mostram: `reason: 'no_phone'`

2. **Tenant está ativo?**
   ```bash
   docker exec cartback-mysql mysql -u cartback -pcartback cartback -e "
     SELECT id, is_active FROM tenants WHERE id = 1;
   " 2>&1 | grep -v "Warning"
   ```

3. **Integração está ativa?**
   ```bash
   docker exec cartback-mysql mysql -u cartback -pcartback cartback -e "
     SELECT is_active FROM store_integrations WHERE platform = 'nuvemshop';
   " 2>&1 | grep -v "Warning"
   ```

---

### Pedido não marca carrinho como recuperado

**Verificar**:

1. **Mesmo telefone ou email?**
   ```bash
   docker exec cartback-mysql mysql -u cartback -pcartback cartback -e "
     SELECT customer_phone, customer_email, status
     FROM abandoned_carts WHERE tenant_id = 1;
   " 2>&1 | grep -v "Warning"
   ```

2. **Carrinho estava pending?**
   - Apenas carrinhos com `status = 'pending'` são marcados como recuperados

---

## ✅ Checklist Final

### OAuth Flow
- [ ] Conectar Nuvemshop redireciona para autorização
- [ ] Autorização funciona
- [ ] Callback recebe código e troca por token
- [ ] Integração salva no banco
- [ ] Webhooks configurados automaticamente
- [ ] Frontend mostra integração conectada

### Webhooks
- [ ] Ngrok expõe backend publicamente
- [ ] Carrinho abandonado dispara webhook
- [ ] HMAC validado corretamente
- [ ] Carrinho salvo no banco como "pending"
- [ ] Pedido criado dispara webhook
- [ ] Carrinho marcado como "recovered"
- [ ] Mensagens canceladas

### Desconexão
- [ ] Desconectar marca integração como inativa
- [ ] Webhooks removidos da Nuvemshop
- [ ] Frontend atualiza corretamente

---

## 📊 Fluxo Completo Validado

```
1. ✅ Usuário conecta Nuvemshop (OAuth)
2. ✅ Backend salva integração e configura webhooks
3. ✅ Cliente abandona carrinho na loja
4. ✅ Nuvemshop envia webhook (3-15 min depois)
5. ✅ Backend valida HMAC e salva carrinho
6. ✅ Job processa e envia mensagem WhatsApp
7. ✅ Cliente finaliza pedido
8. ✅ Nuvemshop envia webhook de order/created
9. ✅ Backend marca carrinho como recuperado
10. ✅ Mensagens pendentes canceladas
11. ✅ Usuário desconecta integração
12. ✅ Webhooks removidos da Nuvemshop
```

---

## 🎯 Integração 100% Funcional!

Se todos os testes passaram, a integração Nuvemshop está **100% completa** e pronta para produção! 🎉

### Próximos Passos

1. ✅ **Nuvemshop está 100%**
2. 🔜 **Criar integração "Personalizada" via webhooks**
