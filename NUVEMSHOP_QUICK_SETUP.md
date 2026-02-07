# 🚀 Setup Rápido: Integração Nuvemshop em Produção

Guia direto e objetivo para ativar a integração Nuvemshop no CartBack em produção.

---

## 📋 Checklist Rápido

- [ ] Criar app no Partners Portal
- [ ] Configurar URLs de callback
- [ ] Copiar credenciais (App ID e Secret)
- [ ] Configurar variáveis no Railway
- [ ] Testar conexão
- [ ] Validar webhooks

---

## 🎯 Passo 1: Criar App no Nuvemshop Partners

### 1.1 Acessar Portal de Partners

1. Acesse: https://partners.nuvemshop.com.br
2. **Login** ou **Criar conta** (se não tiver)
3. Clique em **"Criar nova aplicação"**

### 1.2 Preencher Informações do App

```
Nome da aplicação: CartBack
URL da aplicação: https://cartback.app
Descrição: Sistema de recuperação automática de carrinhos abandonados via WhatsApp
```

### 1.3 Configurar OAuth (A PARTE MAIS IMPORTANTE!)

**URL de Redirecionamento (Callback):**
```
https://api.cartback.app/api/integrations/nuvemshop/callback
```

⚠️ **ATENÇÃO:** Essa URL precisa ser **EXATAMENTE** essa! Qualquer erro vai impedir a integração.

### 1.4 Selecionar Permissões (Scopes)

Marque estas opções:

- ✅ `read_orders` - Ler pedidos
- ✅ `read_customers` - Ler clientes
- ✅ `read_products` - Ler produtos
- ✅ `write_webhooks` - Criar webhooks

### 1.5 Salvar e Obter Credenciais

Após criar, você receberá:

```
App ID: 12345
App Secret: abc123def456xyz789...
```

**GUARDE ESSAS CREDENCIAIS!** Você vai precisar delas no próximo passo.

---

## ⚙️ Passo 2: Configurar Variáveis no Railway

### 2.1 Acessar Service cartback-api

1. Acesse https://railway.app
2. Abra seu projeto **CartBack**
3. Clique no service **cartback-api**
4. Vá em **Variables**

### 2.2 Adicionar/Editar Variáveis

Adicione estas 3 variáveis:

```bash
NUVEMSHOP_APP_ID=12345
NUVEMSHOP_APP_SECRET=abc123def456xyz789...
NUVEMSHOP_CALLBACK_URL=https://api.cartback.app/api/integrations/nuvemshop/callback
```

**Substitua:**
- `12345` → Seu App ID
- `abc123...` → Seu App Secret

### 2.3 Verificar Outras Variáveis

Certifique-se que também tem:

```bash
APP_URL=https://api.cartback.app
WEB_URL=https://cartback.app
```

⚠️ **Importante:** URLs devem ser HTTPS em produção!

### 2.4 Redeploy

Depois de adicionar as variáveis, clique em **Redeploy** ou aguarde deploy automático.

---

## 🧪 Passo 3: Testar Conexão

### 3.1 Acessar CartBack em Produção

1. Acesse https://cartback.app
2. Faça login
3. Vá em **Menu → Integrações**

### 3.2 Conectar Nuvemshop

1. Clique no card **"Nuvemshop"**
2. Clique em **"Conectar"**
3. Você será redirecionado para Nuvemshop

### 3.3 Autorizar na Nuvemshop

1. Faça login na sua loja Nuvemshop
2. Revise as permissões solicitadas
3. Clique em **"Autorizar aplicação"**

### 3.4 Confirmação

Você será redirecionado de volta para:
```
https://cartback.app/integrations?connected=nuvemshop
```

Deve aparecer:
```
✅ Nuvemshop
   Loja: Sua Loja Ltda
   Status: Conectada
   URL: https://sua-loja.lojavirtualnuvem.com.br
```

---

## 🎉 Pronto! Agora o Que Acontece?

### Webhooks Configurados Automaticamente

O CartBack criou 2 webhooks na sua loja:

#### 1. Carrinho Abandonado
```
Evento: cart/abandoned
URL: https://api.cartback.app/api/webhooks/nuvemshop/{seu-uuid}
```

**Quando dispara:**
- Cliente adiciona produtos ao carrinho
- Cliente preenche dados no checkout (incluindo telefone!)
- Cliente **NÃO finaliza** a compra
- Após **3-15 minutos**, Nuvemshop envia o webhook

**O que o CartBack faz:**
1. Recebe os dados do carrinho
2. Valida assinatura HMAC
3. Salva carrinho no banco
4. Agenda mensagens WhatsApp conforme seus templates

#### 2. Pedido Criado
```
Evento: order/created
URL: https://api.cartback.app/api/webhooks/nuvemshop/{seu-uuid}/order
```

**Quando dispara:**
- Cliente finaliza a compra

**O que o CartBack faz:**
1. Busca carrinhos abandonados desse cliente (por telefone/email)
2. Marca como "recuperado"
3. Cancela mensagens agendadas
4. Atualiza métricas

---

## 📊 Como Funciona o Fluxo Completo

```
1. Cliente abandona carrinho na Nuvemshop
   ↓
2. Nuvemshop envia webhook para CartBack (3-15 min)
   ↓
3. CartBack salva carrinho e agenda mensagens
   ↓
4. WhatsApp envia mensagens nos horários configurados (1min, 30min, 24h, 48h)
   ↓
5. Cliente clica no link e finaliza compra
   ↓
6. Nuvemshop envia webhook de pedido criado
   ↓
7. CartBack marca carrinho como recuperado e cancela próximas mensagens
```

---

## 🔧 Verificar se Está Funcionando

### Teste Prático

**1. Criar Carrinho de Teste na Sua Loja:**

1. Acesse sua loja: `https://sua-loja.lojavirtualnuvem.com.br`
2. Adicione um produto ao carrinho
3. Vá para o checkout
4. **IMPORTANTE:** Preencha:
   - Nome: Teste CartBack
   - Email: teste@cartback.com
   - **Telefone: 41999261087** ← Use seu número real!
   - CEP: 80000-000
5. **NÃO finalize** a compra - apenas feche a aba

**2. Aguardar (3-15 minutos)**

A Nuvemshop tem um delay antes de enviar o webhook.

**3. Verificar no CartBack:**

1. Acesse https://cartback.app
2. Vá em **Carrinhos**
3. Deve aparecer:
   ```
   Teste CartBack
   41999261087
   Status: Pendente
   [X] produto(s)
   ```

**4. Verificar WhatsApp:**

Você deve receber a primeira mensagem no seu WhatsApp em ~1 minuto!

---

## 🐛 Problemas Comuns

### "Invalid redirect_uri"

**Causa:** URL de callback não está cadastrada no app.

**Solução:**
1. Volte em https://partners.nuvemshop.com.br
2. Edite seu app
3. Adicione exatamente: `https://api.cartback.app/api/integrations/nuvemshop/callback`
4. Salvar e tentar novamente

---

### "Não consegui conectar"

**Verificar:**
1. Variables no Railway estão corretas?
   ```bash
   railway variables -s cartback-api | grep NUVEMSHOP
   ```
2. API está no ar?
   ```bash
   curl https://api.cartback.app/health
   ```
3. Logs do Railway:
   ```bash
   railway logs -s cartback-api | grep -i nuvemshop
   ```

---

### "Carrinho não aparece no painel"

**Possíveis causas:**

1. **Telefone não foi preenchido**
   - CartBack ignora carrinhos sem telefone
   - Sempre preencha o telefone no checkout

2. **Webhook não chegou ainda**
   - Nuvemshop pode demorar até 15 minutos
   - Aguarde um pouco mais

3. **Webhook não foi configurado**
   - Desconecte e reconecte a integração
   - Isso recria os webhooks

---

### "Pedido não marca carrinho como recuperado"

**Verificar:**
- Usou o **mesmo telefone ou email** no carrinho e no pedido?
- Carrinho estava com status "Pendente"?

---

## 📚 Documentação Completa

Para detalhes técnicos completos, consulte:

- **Integração Completa:** `apps/api/NUVEMSHOP_INTEGRATION.md`
- **Guia de Testes:** `NUVEMSHOP_TESTING.md`
- **API Reference:** `apps/api/API_REFERENCE.md`

---

## ✅ Checklist Final

- [ ] App criado no Partners Portal
- [ ] URL de callback configurada corretamente
- [ ] Credenciais copiadas
- [ ] Variáveis configuradas no Railway (NUVEMSHOP_APP_ID, SECRET, CALLBACK_URL)
- [ ] Redeploy feito
- [ ] Conexão testada no frontend
- [ ] Integração aparece como "Conectada"
- [ ] Carrinho de teste criado
- [ ] Carrinho apareceu no painel
- [ ] Mensagem WhatsApp recebida

---

## 🎯 URLs de Referência

### Produção
```
App URL: https://cartback.app
API URL: https://api.cartback.app
Callback: https://api.cartback.app/api/integrations/nuvemshop/callback
```

### Development (para testar localmente)
```
App URL: http://localhost:5173
API URL: http://localhost:3333
Callback: http://localhost:3333/api/integrations/nuvemshop/callback

⚠️ Para webhooks locais, use ngrok!
```

---

## 🆘 Suporte

Se encontrar problemas:

1. **Logs do Railway:**
   ```bash
   railway logs -s cartback-api -f
   ```

2. **Verificar variáveis:**
   ```bash
   railway variables -s cartback-api
   ```

3. **Testar API manualmente:**
   ```bash
   curl https://api.cartback.app/health
   ```

---

**Boa sorte! 🚀**
