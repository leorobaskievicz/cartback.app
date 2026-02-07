# 📝 Variáveis de Template - CartBack

## ✅ Variáveis Suportadas

O sistema de templates do CartBack suporta **4 variáveis** para personalizar as mensagens de recuperação de carrinho:

### Formato Correto

**IMPORTANTE:** Use sempre **chaves duplas** `{{ }}`, nunca chaves simples!

```
❌ ERRADO: {nome}, {produtos}, {link}, {total}
✅ CORRETO: {{nome}}, {{produtos}}, {{link}}, {{total}}
```

---

## 📋 Lista de Variáveis

### 1. `{{nome}}`
**Nome do cliente**

- **Origem:** `cart.customerName` ou `customer_name` do webhook
- **Exemplo:** "João Silva", "Maria Santos"
- **Fallback:** "Cliente" (se não fornecido)

**Exemplo:**
```
Oi {{nome}}! 👋
```
**Resultado:**
```
Oi João Silva! 👋
```

---

### 2. `{{produtos}}`
**Lista de produtos do carrinho**

- **Origem:** `cart.items` do webhook
- **Formato:** Formatação automática baseada na quantidade

**Comportamento:**
- **1 produto:** "Nome do Produto"
- **2+ produtos:** "Produto 1 e mais X itens"
- **Nenhum:** "seus produtos"

**Exemplo:**
```
Vi que você deixou {{produtos}} no carrinho 🛒
```
**Resultado (1 item):**
```
Vi que você deixou Camiseta Preta no carrinho 🛒
```
**Resultado (3 itens):**
```
Vi que você deixou Camiseta Preta e mais 2 itens no carrinho 🛒
```

---

### 3. `{{link}}`
**Link para recuperar o carrinho**

- **Origem:** `cart.cartUrl` ou `cart_url` do webhook
- **Exemplo:** "https://minhaloja.com/carrinho/abc123"
- **Fallback:** String vazia (se não fornecido)

**Exemplo:**
```
Quer finalizar sua compra? {{link}}
```
**Resultado:**
```
Quer finalizar sua compra? https://minhaloja.com/carrinho/abc123
```

---

### 4. `{{total}}`
**Valor total do carrinho**

- **Origem:** `cart.totalValue` ou `total_value` do webhook
- **Formato:** R$ 1.234,56 (moeda brasileira)
- **Fallback:** R$ 0,00 (se não fornecido)

**Exemplo:**
```
Total: {{total}}
```
**Resultado:**
```
Total: R$ 299,90
```

---

## 📝 Exemplos Completos

### Template Simples
```
Oi {{nome}}! 😊

Vi que você deixou {{produtos}} no carrinho.

Quer finalizar sua compra? {{link}}

Total: {{total}}
```

### Template Com Desconto
```
Olá {{nome}}! 🎉

Seus itens ainda estão esperando:
{{produtos}}

Aproveite 10% OFF na sua compra!
Use o código: VOLTA10

{{link}}

Total: {{total}}
```

### Template Com Urgência
```
{{nome}}, seus produtos estão reservados! ⏰

{{produtos}}

Complete sua compra agora e garanta:
✅ Frete grátis
✅ Entrega em 48h

{{link}}

Valor: {{total}}
```

---

## 🔧 Como Usar no Frontend

### Criar Template

```typescript
const template = {
  name: "Recuperação +1h",
  content: "Oi {{nome}}! Vi que você deixou {{produtos}} no carrinho 🛒\n\n{{link}}\n\nTotal: {{total}}",
  delayMinutes: 60
}

await templatesApi.create(template)
```

### Pré-visualização

O frontend já mostra uma pré-visualização automática com dados de exemplo:

```typescript
const getPreviewMessage = (message: string) => {
  return message
    .replace(/\{\{nome\}\}/g, 'João Silva')
    .replace(/\{\{produtos\}\}/g, '• Produto 1 - R$ 199,90\n• Produto 2 - R$ 99,90')
    .replace(/\{\{link\}\}/g, 'https://sua-loja.com/carrinho/abc123')
    .replace(/\{\{total\}\}/g, 'R$ 299,90')
}
```

---

## ⚠️ Erros Comuns

### 1. Usar Chaves Simples
❌ **Errado:**
```
Oi {nome}! Seus produtos: {produtos}
```

✅ **Correto:**
```
Oi {{nome}}! Seus produtos: {{produtos}}
```

---

### 2. Usar Nomes Diferentes
❌ **Errado:**
```
Oi {{customerName}}!
{{productList}}
{{url}}
{{price}}
```

✅ **Correto:**
```
Oi {{nome}}!
{{produtos}}
{{link}}
{{total}}
```

---

### 3. Esquecer de Personalizar
❌ **Evite mensagens genéricas:**
```
Olá!

Você deixou itens no carrinho.

Clique aqui para finalizar.
```

✅ **Use as variáveis:**
```
Oi {{nome}}! 👋

Vi que você deixou {{produtos}} no carrinho 🛒

{{link}}

Total: {{total}}
```

---

## 🧪 Testar Template

### Via Painel (Recomendado)

1. Vá em **Templates**
2. Clique no ícone de **Enviar** (✉️) no template
3. Digite seu número com DDD: `5541999999999`
4. Clique em **Enviar Teste**

A mensagem será enviada com dados de exemplo pré-definidos.

### Via Webhook Custom

```bash
curl -X POST 'https://api.cartback.app/api/webhooks/custom/SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'X-CartBack-API-Key: SUA_API_KEY' \
  -d '{
    "cart_id": "teste_123",
    "customer_name": "João Silva",
    "customer_phone": "5541999999999",
    "cart_url": "https://minhaloja.com/carrinho/abc123",
    "total_value": 299.90,
    "items": [
      {
        "id": "prod_001",
        "name": "Camiseta Preta",
        "price": 99.90,
        "quantity": 3
      }
    ]
  }'
```

---

## 🔍 Debug

### Ver Mensagem Final Antes de Enviar

Os logs do backend mostram a mensagem final:

```bash
railway logs -s cartback-workers -f | grep "Enviando mensagem"
```

**Você verá:**
```
[SendMessage] Enviando mensagem para 5541999999999...
[SendMessage] Conteúdo: Oi João Silva! Vi que você deixou Camiseta Preta no carrinho 🛒...
```

---

## 📚 Referências de Código

### Backend
- **Variáveis definidas:** `apps/api/app/jobs/send_whatsapp_message.ts:107-112`
- **Substituição:** `apps/api/app/jobs/send_whatsapp_message.ts:208-212`
- **Formatação produtos:** `apps/api/app/jobs/send_whatsapp_message.ts:217-228`
- **Formatação moeda:** `apps/api/app/jobs/send_whatsapp_message.ts:233-238`

### Frontend
- **Pré-visualização:** `apps/web/src/pages/Templates.tsx:189-195`
- **Helper text:** `apps/web/src/pages/Templates.tsx:375`
- **Variáveis listadas:** `apps/web/src/pages/Templates.tsx:315`

---

## ✅ Checklist

Ao criar um template, certifique-se de:

- [ ] Usar chaves duplas `{{}}` e não simples `{}`
- [ ] Usar variáveis corretas: `nome`, `produtos`, `link`, `total`
- [ ] Personalizar com pelo menos 1 variável (preferencialmente `{{nome}}`)
- [ ] Testar o template antes de ativar
- [ ] Verificar a pré-visualização no frontend
- [ ] Ativar o template após testar

---

**Última atualização:** 07/02/2026
