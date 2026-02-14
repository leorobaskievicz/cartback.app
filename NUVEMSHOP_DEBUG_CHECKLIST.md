# 🔍 Nuvemshop Script - Guia de Debug

## ✅ Status do Script
- **URL**: https://api.cartback.app/nuvemshop-cart-tracker.js
- **Status**: ✅ Acessível (HTTP 200)
- **Script ID configurado**: 4550

---

## 🧪 Como Testar se o Script Está Carregando

### Passo 1: Abrir Loja de Teste Nuvemshop

1. Acesse sua loja de teste Nuvemshop
2. Adicione algum produto ao carrinho
3. **Vá para o checkout** (isso é importante - o script só roda no checkout!)

---

### Passo 2: Abrir DevTools

**No Chrome/Edge:**
- Pressione `F12` ou `Ctrl+Shift+I` (Windows/Linux)
- Pressione `Cmd+Option+I` (Mac)

**No Firefox:**
- Pressione `F12` ou `Ctrl+Shift+K`

---

### Passo 3: Verificar se o Script Carregou

#### 3.1 Ir na aba **Network** (Rede)

1. Clique na aba **Network**
2. Filtre por "JS" ou digite "cartback" no filtro
3. Recarregue a página (`F5`)
4. **Procure por:** `cartback-cart-tracker.js` ou `nuvemshop-cart-tracker.js`

**O que você deve ver:**

✅ **Se estiver funcionando:**
```
Request URL: https://api.cartback.app/nuvemshop-cart-tracker.js?tenant_uuid=xxx-xxx-xxx
Status: 200 OK
```

❌ **Se NÃO estiver carregando:**
```
(Nada aparece com o nome "cartback")
```

---

#### 3.2 Ir na aba **Console**

1. Clique na aba **Console**
2. **Procure por mensagens** do CartBack

**O que você deve ver:**

✅ **Se estiver funcionando:**
```javascript
[CartBack] Script iniciado - Tenant: abc-123-def-456
[CartBack] Monitorando 3 campos
[CartBack] Monitoramento de abandono ativado ✅
```

⚠️ **Se aparecer este warning:**
```javascript
[CartBack] tenant_uuid não encontrado nos parâmetros
```
**Significado:** O script carregou MAS não recebeu o tenant_uuid. Isso significa que o script NÃO foi associado corretamente à loja.

❌ **Se NÃO aparecer nada:**
O script não está carregando. Pode ser que:
- Script não foi publicado no Partner Portal
- Script não está marcado como "Auto installed"
- A loja de teste não está com o app instalado

---

### Passo 4: Verificar URL do Script

No console, digite:

```javascript
// Ver todos os scripts carregados
performance.getEntriesByType("resource")
  .filter(r => r.name.includes("cartback") || r.name.includes("script"))
  .map(r => r.name)
```

Você deve ver algo como:
```
["https://api.cartback.app/nuvemshop-cart-tracker.js?tenant_uuid=xxx"]
```

---

### Passo 5: Verificar Query Params

Se o script carregou mas deu warning sobre `tenant_uuid`, verifique a URL:

```javascript
// No console
console.log('URL atual:', window.location.href)
console.log('Query params:', new URLSearchParams(window.location.search).toString())
```

**O script precisa receber o tenant_uuid na URL!**

Exemplo de URL correta:
```
https://sua-loja.lojavirtualnuvem.com.br/checkout?tenant_uuid=abc-123
```

---

## 🐛 Problemas Comuns

### ❌ Script não carrega (nada no Network)

**Possíveis causas:**

1. **Script não foi publicado no Partner Portal**
   - Ir em: https://partners.nuvemshop.com.br
   - Scripts → Seu script (ID 4550)
   - Verificar status: deve estar **"Active"** (não "Draft" ou "Testing")

2. **Script não está marcado como "Auto installed"**
   - No Partner Portal, editar o script
   - Marcar checkbox **"Auto installed"**
   - Salvar

3. **App não está instalado na loja de teste**
   - A loja de teste precisa ter autorizado seu app
   - Fazer OAuth flow: conectar Nuvemshop pelo CartBack

---

### ⚠️ Script carrega mas dá warning "tenant_uuid não encontrado"

**Causa:** Script não foi **associado** à loja com os query params.

**Solução:**

1. **Desconectar e reconectar** a integração Nuvemshop:
   - Ir em https://cartback.app/integrations
   - Desconectar Nuvemshop
   - Conectar novamente

2. **O que acontece ao reconectar:**
   - Backend chama `nuvemshopService.associateScript()`
   - Isso registra o script com `query_params: { tenant_uuid: "xxx" }`
   - A partir daí, o script recebe o tenant_uuid automaticamente

3. **Verificar nos logs do Railway:**
   ```bash
   railway logs -s cartback-api | grep "Script associado"
   ```
   Deve aparecer:
   ```
   [Nuvemshop] Script 4550 associado à loja 123456
   ```

---

### ✅ Script carrega e funciona, mas webhook não chega

**Testar envio manual:**

No console do checkout, cole isso:

```javascript
// Coletar dados e enviar manualmente
const testData = {
  tenant_uuid: 'SEU_TENANT_UUID_AQUI', // substitua!
  store_id: window.LS?.store?.id,
  checkout_id: window.LS?.cart?.id,
  customer_name: 'Teste CartBack',
  customer_email: 'teste@cartback.com',
  customer_phone: '5541999999999', // use seu número real!
  cart_url: window.location.href,
  total_value: 299.90,
  currency: 'BRL',
  items: [{
    id: 'test-1',
    name: 'Produto Teste',
    price: 299.90,
    quantity: 1
  }],
  timestamp: new Date().toISOString()
};

// Enviar
fetch('https://api.cartback.app/api/webhooks/nuvemshop-script/' + testData.tenant_uuid, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(r => r.json())
.then(d => console.log('✅ Resposta:', d))
.catch(e => console.error('❌ Erro:', e));
```

**Se funcionar:**
- Você verá: `✅ Resposta: {received: true, processed: true, cart_id: "xxx"}`
- O carrinho vai aparecer em https://cartback.app/carts

**Se não funcionar:**
- Ver a mensagem de erro
- Verificar logs do Railway

---

## 🔍 Debug Avançado

### Ver estado do LS (objeto da Nuvemshop)

```javascript
// No console
console.log('LS.store:', window.LS?.store)
console.log('LS.cart:', window.LS?.cart)
console.log('LS.checkout:', window.LS?.checkout)
```

### Verificar campos do formulário

```javascript
// Ver campos que o script monitora
document.querySelectorAll('[name="name"], [name="email"], [name="phone"]')
  .forEach(field => {
    console.log(field.name, '=', field.value)
  })
```

### Forçar coleta e envio

```javascript
// ATENÇÃO: só use isso se o script estiver carregado!
// Isso vai forçar a coleta e envio dos dados

const nameField = document.querySelector('[name="name"]');
const emailField = document.querySelector('[name="email"]');
const phoneField = document.querySelector('[name="phone"]');

// Preencher campos
if (nameField) nameField.value = 'Teste CartBack';
if (emailField) emailField.value = 'teste@cartback.com';
if (phoneField) phoneField.value = '41999999999';

// Disparar evento blur para o script capturar
if (phoneField) phoneField.dispatchEvent(new Event('blur'));
```

---

## 📋 Checklist de Verificação

- [ ] Script está publicado (status: Active) no Partner Portal
- [ ] Script está marcado como "Auto installed"
- [ ] Script carrega no Network (HTTP 200)
- [ ] Console mostra: `[CartBack] Script iniciado`
- [ ] Console **NÃO** mostra warning sobre tenant_uuid
- [ ] Query params na URL incluem `tenant_uuid=xxx`
- [ ] Integração Nuvemshop está conectada em https://cartback.app/integrations
- [ ] Variável `NUVEMSHOP_SCRIPT_ID=4550` está configurada no Railway
- [ ] Teste manual de webhook funciona
- [ ] Carrinho de teste aparece no painel CartBack

---

## 🆘 Se Nada Funcionar

1. **Verificar se app está publicado:**
   - Partner Portal → Seu App → Status deve ser "Published"

2. **Verificar logs em tempo real:**
   ```bash
   railway logs -s cartback-api -f | grep -i nuvemshop
   ```

3. **Verificar se tenant existe:**
   - Fazer login em https://cartback.app
   - Ir em Configurações
   - Copiar o UUID do tenant
   - Comparar com o que está na URL do script

4. **Reconectar TUDO:**
   - Desconectar Nuvemshop
   - Desconectar WhatsApp (se quiser)
   - Conectar Nuvemshop novamente
   - Logs devem mostrar: "Script 4550 associado à loja"

---

## ✅ Teste Final

Quando estiver tudo funcionando:

1. Ir no checkout da sua loja
2. Preencher nome, email, telefone
3. Console deve mostrar: `[CartBack] Dados enviados com sucesso`
4. Aguardar 5 segundos
5. Ir em https://cartback.app/carts
6. **Seu carrinho deve aparecer lá!** 🎉

---

**Última atualização:** 14/02/2026
