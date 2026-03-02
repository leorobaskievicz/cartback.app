# Botões Dinâmicos em Templates do WhatsApp

## Como usar botões URL com links dinâmicos

Para criar um botão de URL dinâmico (que muda de acordo com o carrinho de cada cliente), a **URL precisa ter uma base fixa válida** com a variável no final.

### ✅ Formato CORRETO

```json
{
  "buttons": [{
    "type": "URL",
    "text": "Finalizar Pedido",
    "url": "https://minhaloja.com/cart/{{link}}",
    "urlExample": "https://minhaloja.com/cart/abc123xyz"
  }]
}
```

**Campos obrigatórios para botões dinâmicos:**
- `url`: URL com variável `{{link}}` que será substituída pelo ID/token de cada carrinho
- `urlExample`: Exemplo real de como ficará a URL (usado pela Meta API para validação)

A variável `{{link}}` será substituída pelo ID/token do carrinho de cada cliente.

**Exemplo de URL final enviada:**
```
https://minhaloja.com/cart/abc123xyz?utm_source=cartback&utm_medium=whatsapp&utm_campaign=abandono_carrinho_1
```

### ❌ Formato INCORRETO

```json
{
  "buttons": [{
    "type": "URL", 
    "text": "Finalizar Pedido",
    "url": "{{link}}"  ← ERRO: Meta API rejeita URLs que são apenas variáveis
  }]
}
```

**Erro da Meta:** `Param components[2]['buttons'][0]['url'] is not a valid URI`

## Variáveis disponíveis para botões

Você pode usar estas variáveis em URLs de botões:

- `{{link}}` - ID/token do carrinho
- `{{nome}}` - Nome do cliente
- `{{total}}` - Valor total do carrinho
- `{{produtos}}` - Descrição dos produtos

**Exemplo usando múltiplas variáveis:**
```json
{
  "url": "https://minhaloja.com/checkout?cart={{link}}&customer={{nome}}",
  "urlExample": "https://minhaloja.com/checkout?cart=abc123&customer=joao_silva"
}
```

## Por que preciso fornecer um exemplo?

A Meta API **valida** o formato dos templates antes de aprovar. O campo `urlExample` serve para:

1. ✅ Validar que a URL final será válida quando a variável for substituída
2. ✅ Mostrar para os revisores da Meta como ficará o link
3. ✅ Evitar erros de formato que causariam rejeição do template

**Importante:** O exemplo deve ser uma URL completa e válida que representa como ficará o link real.

## UTM Tracking automático

O CartBack adiciona **automaticamente** parâmetros UTM aos links:

- `utm_source=cartback`
- `utm_medium=whatsapp`
- `utm_campaign=nome_do_template` (sanitizado)

Isso permite rastrear conversões no Google Analytics e saber qual template gerou mais vendas!

### Exemplo completo de payload

```json
{
  "name": "Abandono Carrinho 1",
  "bodyText": "Oi {{nome}}! Seu carrinho está esperando 🛒",
  "bodyExamples": {
    "nome": "João Silva"
  },
  "footerText": "Loja Exemplo",
  "buttons": [{
    "type": "URL",
    "text": "Ver Carrinho",
    "url": "https://loja.com/cart/{{link}}",
    "urlExample": "https://loja.com/cart/abc123xyz"
  }],
  "metaMode": true,
  "metaLanguage": "pt_BR",
  "metaCategory": "UTILITY"
}
```

**URL final enviada ao cliente:**
```
https://loja.com/cart/abc123xyz?utm_source=cartback&utm_medium=whatsapp&utm_campaign=abandono_carrinho_1
```

## No Frontend (Modal de cadastro)

Quando o usuário adiciona um botão URL com variável:

1. Campo **"URL do Botão"**: `https://loja.com/cart/{{link}}`
2. Campo **"Exemplo de URL"**: `https://loja.com/cart/abc123xyz`
   - Placeholder sugerido: "Ex: https://loja.com/cart/abc123xyz"
   - Validação: deve ser uma URL válida completa
   - Aparece apenas quando a URL contém `{{link}}` ou outras variáveis

## Formato Meta API (interno)

Internamente, o CartBack converte variáveis nomeadas para o formato Meta:

- `{{link}}` → `{{1}}`
- `{{nome}}` → `{{1}}` (se for a primeira variável)
- Etc.

E usa o exemplo fornecido:

```json
{
  "type": "URL",
  "text": "Ver Carrinho", 
  "url": "https://loja.com/cart/{{1}}",
  "example": ["https://loja.com/cart/abc123xyz"]
}
```

Você **não precisa** se preocupar com isso! Use sempre variáveis nomeadas (`{{link}}`, etc.) e forneça um exemplo válido que o CartBack faz a conversão automaticamente.
