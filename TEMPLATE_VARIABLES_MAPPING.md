# Mapeamento de Variáveis - Templates Meta WhatsApp API

## 📋 Visão Geral

O CartBack suporta **dois formatos de templates**:

1. **Formato Simples (Evolution API)**: Usa variáveis nomeadas `{{nome}}`, `{{produtos}}`, etc.
2. **Formato Meta (API Oficial)**: Usa variáveis numeradas `{{1}}`, `{{2}}`, etc.

---

## 🔄 Mapeamento Fixo de Variáveis

O sistema usa um **mapeamento fixo** entre as variáveis numeradas do Meta e os dados do carrinho:

| Variável | Descrição | Exemplo | Origem dos Dados |
|----------|-----------|---------|------------------|
| `{{1}}` | Nome do cliente | "João Silva" | `cart.customerName` |
| `{{2}}` | Produtos do carrinho | "Produto X e mais 2 itens" | `cart.items` (formatado) |
| `{{3}}` | Link do carrinho | "https://loja.com/cart/abc123" | `cart.cartUrl` |
| `{{4}}` | Valor total | "R$ 149,90" | `cart.totalValue` (formatado) |
| `{{5}}` | Desconto | "R$ 50,00" | Futuro uso |
| `{{6}}` | Data de validade | "20/02/2026" | Futuro uso |
| `{{7}}` | Código do carrinho | "ABC123" | Futuro uso |

> **⚠️ IMPORTANTE**: Este mapeamento é **fixo** e não pode ser alterado. Ao criar templates, sempre use as variáveis conforme a tabela acima.

---

## 📝 Examples (Exemplos de Variáveis)

### O que são Examples?

Examples são valores de amostra que você fornece para cada variável ao criar um template. O Meta WhatsApp API **exige** examples para:

- **Aprovação**: O revisor do Meta precisa ver como ficará a mensagem
- **Validação**: Garantir que o template está formatado corretamente
- **Preview**: Mostrar uma prévia da mensagem no painel do Meta

### Como Funciona

1. **Frontend**: O usuário cria um template e insere:
   - O texto com variáveis: `"Oi {{1}}! Seus produtos: {{2}}. Total: {{4}}"`
   - Examples para cada variável:
     - `{{1}}`: "João Silva"
     - `{{2}}`: "Produto X e mais 2 itens"
     - `{{4}}`: "R$ 149,90"

2. **Backend**: Constrói o payload para o Meta:
```json
{
  "name": "recuperacao_carrinho_1",
  "category": "MARKETING",
  "language": "pt_BR",
  "components": [
    {
      "type": "BODY",
      "text": "Oi {{1}}! Seus produtos: {{2}}. Total: {{4}}",
      "example": {
        "body_text": [
          ["João Silva", "Produto X e mais 2 itens", "R$ 149,90"]
        ]
      }
    }
  ]
}
```

3. **Meta**: Recebe, valida e armazena o template com os examples
4. **Disparo**: Ao enviar mensagens, o CartBack substitui as variáveis pelos dados reais do carrinho

---

## 🔧 Implementação Técnica

### Backend

#### 1. Validator (`message_template.ts`)
```typescript
export const createMessageTemplateValidator = vine.compile(
  vine.object({
    // ... outros campos
    headerExample: vine.string().trim().maxLength(60).optional(),
    bodyExamples: vine.array(vine.string().trim()).optional(),
  })
)
```

#### 2. Controller (`message_templates_controller.ts`)
```typescript
// Examples padrão caso o usuário não forneça
const defaultExamples = [
  'João Silva',                      // {{1}} = Nome
  'Produto X e mais 2 itens',        // {{2}} = Produtos
  'https://loja.com/cart/abc123',    // {{3}} = Link
  'R$ 149,90',                       // {{4}} = Total
  'R$ 50,00',                        // {{5}} = Desconto
  '20/02/2026',                      // {{6}} = Data
  'ABC123',                          // {{7}} = Código
]

// Usar examples fornecidos pelo usuário ou defaults
const finalExamples = data.bodyExamples && data.bodyExamples.length > 0
  ? data.bodyExamples
  : defaultExamples.slice(0, variableMatches.length)

bodyComponent.example = {
  body_text: [finalExamples.slice(0, variableMatches.length)],
}
```

#### 3. Job de Disparo (`send_whatsapp_official_message.ts`)
```typescript
// Mapeamento fixo ao enviar mensagem
const bodyParams = [
  cart.customerName || 'Cliente',                    // {{1}}
  formatProducts(cart.items || []),                  // {{2}}
  cart.cartUrl || '',                                // {{3}}
  formatCurrency(cart.totalValue || 0),              // {{4}}
]

await whatsappOfficialService.sendTemplateMessage(credentials, {
  to: cart.customerPhone,
  templateName: template.metaTemplateName!,
  languageCode: template.metaLanguage,
  components: [
    {
      type: 'body',
      parameters: bodyParams.map((text) => ({ type: 'text', text })),
    },
  ],
})
```

### Frontend

#### 1. Interface (`TemplateFormDialog.tsx`)
```typescript
interface TemplateFormData {
  // ... outros campos
  headerExample?: string  // Exemplo para {{1}} no header
  bodyExamples?: string[]  // Exemplos para {{1}}, {{2}}, {{3}}, {{4}}...
}
```

#### 2. Campos Dinâmicos
O frontend detecta automaticamente as variáveis usadas e mostra campos de input para cada uma:

```tsx
{(() => {
  const bodyVarMatches = [...(formData.bodyText || '').matchAll(/\{\{(\d+)\}\}/g)]
  const uniqueVars = [...new Set(bodyVarMatches.map((m) => parseInt(m[1])))]
    .sort((a, b) => a - b)

  return uniqueVars.map((varIndex) => (
    <TextField
      label={`Exemplo para {{${varIndex}}}`}
      value={currentExamples[varIndex - 1] || ''}
      onChange={(e) => {
        const newExamples = [...(formData.bodyExamples || [])]
        newExamples[varIndex - 1] = e.target.value
        setFormData({ ...formData, bodyExamples: newExamples })
      }}
    />
  ))
})()}
```

---

## 🎯 Casos de Uso

### Caso 1: Template Simples (Evolution API)

**Template:**
```
Oi {{nome}}! Vi que você deixou {{produtos}} no carrinho.
Valor total: {{total}}
Finalize aqui: {{link}}
```

**Como funciona:**
- Variáveis nomeadas são usadas diretamente
- Não precisa de examples (Evolution API não exige)
- Na conversão para Meta API, são mapeadas para {{1}}, {{2}}, etc.

### Caso 2: Template Meta (API Oficial) - Básico

**Template (body):**
```
Oi {{1}}! Vi que você deixou {{2}} no carrinho.
Total: {{4}}
Finalize: {{3}}
```

**Examples fornecidos:**
- `{{1}}`: "Maria Santos"
- `{{2}}`: "Tênis Nike e mais 1 item"
- `{{3}}`: "https://minhaloja.com/cart/xyz"
- `{{4}}`: "R$ 299,90"

**Resultado no Meta:**
O revisor verá: "Oi Maria Santos! Vi que você deixou Tênis Nike e mais 1 item no carrinho. Total: R$ 299,90. Finalize: https://minhaloja.com/cart/xyz"

### Caso 3: Template Meta com Header

**Template:**
- **Header (TEXT):** `Seu pedido {{1}}`
- **Body:** `Olá! Seus itens: {{2}}. Total: {{4}}.`

**Examples:**
- Header `{{1}}`: "João Silva"
- Body `{{1}}` (não usado pois header já consome o índice 1)
- Body `{{2}}`: "Produto A, Produto B"
- Body `{{4}}`: "R$ 350,00"

> **⚠️ ATENÇÃO**: O header com `{{1}}` "consome" o índice 1. No body, você deve começar do `{{2}}` ou usar `{{1}}` novamente (mas o Meta pode interpretar de forma diferente).

---

## ✅ Boas Práticas

### 1. Use Examples Realistas
❌ **Ruim:** `{{1}}`: "teste", `{{2}}`: "abc"
✅ **Bom:** `{{1}}`: "João Silva", `{{2}}`: "Produto X e mais 2 itens"

### 2. Mantenha a Ordem das Variáveis
❌ **Ruim:** `"Olá {{3}}! Seus produtos: {{1}}"`
✅ **Bom:** `"Olá {{1}}! Seus produtos: {{2}}. Total: {{4}}. Link: {{3}}"`

### 3. Não Misture Formatos
❌ **Ruim:** `"Olá {{nome}}! Total: {{4}}"` (mistura formato Evolution e Meta)
✅ **Bom (Evolution):** `"Olá {{nome}}! Total: {{total}}"`
✅ **Bom (Meta):** `"Olá {{1}}! Total: {{4}}"`

### 4. Forneça Examples para TODAS as Variáveis
❌ **Ruim:** Template usa `{{1}}`, `{{2}}`, `{{4}}`, mas fornece examples apenas para `{{1}}` e `{{2}}`
✅ **Bom:** Fornece examples para todas: `{{1}}`, `{{2}}`, `{{4}}`

---

## 🐛 Troubleshooting

### Erro: "Invalid parameter"
**Causa:** Examples fornecidos não correspondem às variáveis usadas
**Solução:** Verifique se forneceu examples para TODAS as variáveis `{{1}}`, `{{2}}`, etc.

### Erro: "Template rejected by Meta"
**Causa:** Meta rejeitou o template (conteúdo inadequado, muitas variáveis, etc.)
**Solução:** Revise o conteúdo, reduza variáveis, use examples mais claros

### Disparo funciona mas mostra "undefined"
**Causa:** Mapeamento incorreto no job de disparo
**Solução:** Verifique se `cart.customerName`, `cart.items`, etc. existem no banco

### Examples não aparecem no Meta
**Causa:** Payload enviado para Meta não contém `example`
**Solução:** Verifique se o backend está montando corretamente o `bodyComponent.example`

---

## 📚 Referências

- [Meta WhatsApp Business API - Message Templates](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates)
- [Template Components](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/components)
- [Example Object Format](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/components#example-object)

---

**Última atualização:** 2026-02-23
