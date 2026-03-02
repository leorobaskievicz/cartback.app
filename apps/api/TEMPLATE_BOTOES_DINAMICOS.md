# Botões Dinâmicos em Templates do WhatsApp

## Como usar botões URL com links dinâmicos

Para criar um botão de URL dinâmico (que muda de acordo com o carrinho de cada cliente), a **URL precisa ter uma base fixa válida** com a variável no final.

### ✅ Formato CORRETO

```json
{
  "buttons": [{
    "type": "URL",
    "text": "Finalizar Pedido",
    "url": "https://minhaloja.com/cart/{{link}}"
  }]
}
```

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
  "url": "https://minhaloja.com/checkout?cart={{link}}&customer={{nome}}"
}
```

## UTM Tracking automático

O CartBack adiciona **automaticamente** parâmetros UTM aos links:

- `utm_source=cartback`
- `utm_medium=whatsapp`
- `utm_campaign=nome_do_template` (sanitizado)

Isso permite rastrear conversões no Google Analytics e saber qual template gerou mais vendas!

### Exemplo completo

**Template enviado:**
```json
{
  "name": "Abandono Carrinho 1",
  "bodyText": "Oi {{nome}}! Seu carrinho está esperando 🛒",
  "buttons": [{
    "type": "URL",
    "text": "Ver Carrinho",
    "url": "https://loja.com/cart/{{link}}"
  }]
}
```

**URL final no WhatsApp:**
```
https://loja.com/cart/abc123?utm_source=cartback&utm_medium=whatsapp&utm_campaign=abandono_carrinho_1
```

## Formato Meta API (interno)

Internamente, o CartBack converte variáveis nomeadas para o formato Meta:

- `{{link}}` → `{{1}}`
- `{{nome}}` → `{{1}}` (se for a primeira variável)
- Etc.

E adiciona automaticamente o campo `example` exigido pela Meta:

```json
{
  "type": "URL",
  "text": "Ver Carrinho", 
  "url": "https://loja.com/cart/{{1}}",
  "example": ["https://loja.com/cart/abc123xyz"]
}
```

Você **não precisa** se preocupar com isso! Use sempre variáveis nomeadas (`{{link}}`, etc.) que o CartBack faz a conversão automaticamente.
