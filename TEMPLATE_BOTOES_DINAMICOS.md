# Botões Dinâmicos em Templates do WhatsApp

## ⚠️ IMPORTANTE: O problema mais comum

**ERRO:** Colocar apenas `{{link}}` no campo URL do botão  
**CORRETO:** Colocar a URL **COMPLETA** com `{{link}}` no final

## Como usar botões URL com links dinâmicos

Para criar um botão de URL dinâmico (que muda de acordo com o carrinho de cada cliente), a **URL COMPLETA** precisa ser fornecida com a variável no final.

### ✅ Formato CORRETO

**Exemplo real do CallFarma:**
```json
{
  "buttons": [{
    "type": "URL",
    "text": "Finalizar Pedido",
    "url": "https://callfarma.com.br/?carrinho={{link}}&pagamento=true&repres=7797",
    "urlExample": "https://callfarma.com.br/?carrinho=468673&pagamento=true&repres=7797"
  }]
}
```

**Campos obrigatórios:**
- `url`: URL **COMPLETA** com `{{link}}` no final (não apenas `{{link}}`)
- `urlExample`: Exemplo **COMPLETO** de como ficará a URL real

**Pontos importantes:**
- ✅ URL deve começar com `https://` ou `http://`
- ✅ A variável `{{link}}` deve estar no FINAL da URL
- ✅ Pode ter query params antes/depois da variável
- ✅ O exemplo deve ser uma URL real e válida

### ❌ Formatos INCORRETOS

**Erro 1: Apenas a variável (MAIS COMUM)**
```json
{
  "buttons": [{
    "type": "URL",
    "text": "Finalizar Pedido",
    "url": "{{link}}"  ← ERRO: Não é uma URL completa!
  }]
}
```
**Erro da Meta:** `Param components[2]['buttons'][0]['url'] is not a valid URI`

**Erro 2: URL sem https://**
```json
{
  "url": "callfarma.com.br/?carrinho={{link}}"  ← ERRO: Falta https://
}
```

**Erro 3: Variável no meio da URL**
```json
{
  "url": "https://loja.com/cart/{{link}}/checkout"  ← ERRO: Variável não está no final
}
```

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

### Exemplo completo de payload (CallFarma)

```json
{
  "name": "Abandono Carrinho 1",
  "bodyText": "Oi {{nome}}! 💚\n\nSeu carrinho está quase finalizado 🛒✨",
  "bodyExamples": {
    "nome": "João da Silva"
  },
  "footerText": "callfarma.com.br",
  "buttons": [{
    "type": "URL",
    "text": "Finalizar Pedido",
    "url": "https://callfarma.com.br/?carrinho={{link}}&pagamento=true&repres=7797",
    "urlExample": "https://callfarma.com.br/?carrinho=468673&pagamento=true&repres=7797"
  }],
  "metaMode": true,
  "metaLanguage": "pt_BR",
  "metaCategory": "UTILITY",
  "triggerType": "abandoned_cart",
  "delayMinutes": 20,
  "isActive": true
}
```

**URL final enviada ao cliente (com UTM automático):**
```
https://callfarma.com.br/?carrinho=468673&pagamento=true&repres=7797&utm_source=cartback&utm_medium=whatsapp&utm_campaign=abandono_carrinho_1
```

## Passo a Passo no Frontend

1. **Criar Template** → Modo Completo (Meta API)
2. **Adicionar Botão** → Tipo: Link (URL)
3. **Texto do Botão:** "Finalizar Pedido"
4. **URL Completa:** `https://callfarma.com.br/?carrinho={{link}}&pagamento=true&repres=7797`
   - ⚠️ NÃO coloque apenas `{{link}}`!
   - ✅ Coloque a URL completa com `{{link}}` incluído
5. **Exemplo de URL:** Aparece automaticamente quando detecta `{{link}}`
   - Preencha: `https://callfarma.com.br/?carrinho=468673&pagamento=true&repres=7797`
   - Deve ser uma URL real sem `{{link}}`
6. **Salvar e Sincronizar** com Meta

## Validações do Sistema

O CartBack agora valida automaticamente:

1. ✅ URL não pode ser apenas `{{link}}` (deve ser URL completa)
2. ✅ URL deve começar com `https://` ou `http://`
3. ✅ Variável `{{link}}` deve estar no final (não no meio)
4. ✅ Campo de exemplo é obrigatório quando há variável
5. ✅ Exemplo deve ser uma URL válida completa

Se alguma validação falhar, você verá uma mensagem clara indicando o erro.

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
