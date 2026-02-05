# Checkout com Cartão de Crédito

## Endpoint
```
POST /api/subscription/checkout
```

## Headers
```
Authorization: Bearer {token}
Content-Type: application/json
```

## Payload de Exemplo - PIX
```json
{
  "plan": "starter",
  "billingType": "PIX"
}
```

## Payload de Exemplo - Boleto
```json
{
  "plan": "pro",
  "billingType": "BOLETO"
}
```

## Payload de Exemplo - Cartão de Crédito
```json
{
  "plan": "business",
  "billingType": "CREDIT_CARD",
  "creditCard": {
    "holderName": "LEONARDO DA SILVA",
    "number": "5162306219378829",
    "expiryMonth": "12",
    "expiryYear": "2028",
    "ccv": "318"
  },
  "holderInfo": {
    "name": "Leonardo da Silva",
    "email": "leonardo@example.com",
    "cpfCnpj": "12345678901",
    "postalCode": "80010000",
    "addressNumber": "123",
    "addressComplement": "Apto 101",
    "phone": "41999999999"
  }
}
```

## Campos Obrigatórios

### Para PIX/Boleto:
- `plan`: "starter" | "pro" | "business"
- `billingType`: "PIX" | "BOLETO"

### Para Cartão de Crédito:
- `plan`: "starter" | "pro" | "business"
- `billingType`: "CREDIT_CARD"
- `creditCard`:
  - `holderName`: Nome como está no cartão
  - `number`: Número do cartão (13-19 dígitos, sem espaços)
  - `expiryMonth`: Mês de validade (01-12)
  - `expiryYear`: Ano de validade (YYYY)
  - `ccv`: Código de segurança (3-4 dígitos)
- `holderInfo`:
  - `name`: Nome completo
  - `email`: Email válido
  - `cpfCnpj`: CPF (11 dígitos) ou CNPJ (14 dígitos)
  - `postalCode`: CEP (8 dígitos, sem hífen)
  - `addressNumber`: Número do endereço
  - `addressComplement`: Complemento (opcional)
  - `phone`: Telefone com DDD (10-11 dígitos)

## Resposta de Sucesso

### PIX/Boleto:
```json
{
  "success": true,
  "data": {
    "subscription": {
      "plan": "starter",
      "status": "pending"
    },
    "payment": {
      "id": 1,
      "amount": 5900,
      "status": "pending",
      "paymentMethod": "pix",
      "dueDate": "2026-02-02T00:00:00.000-03:00",
      "invoiceUrl": "https://...",
      "pixQrCode": "data:image/png;base64,...",
      "pixCopyPaste": "00020126...",
      "boletoUrl": null
    }
  }
}
```

### Cartão de Crédito:
```json
{
  "success": true,
  "data": {
    "subscription": {
      "plan": "business",
      "status": "active"
    },
    "payment": {
      "id": 2,
      "amount": 19900,
      "status": "confirmed",
      "paymentMethod": "credit_card",
      "dueDate": "2026-02-02T00:00:00.000-03:00",
      "invoiceUrl": "https://...",
      "pixQrCode": null,
      "pixCopyPaste": null,
      "boletoUrl": null
    }
  }
}
```

## Resposta de Erro - Validação
```json
{
  "success": false,
  "error": "Dados inválidos",
  "validation": {
    "creditCard.number": ["O número do cartão deve conter entre 13 e 19 dígitos"],
    "creditCard.expiryMonth": ["O mês deve estar entre 01 e 12"]
  }
}
```

## Cartões de Teste (Sandbox Asaas)

### Aprovado:
- Número: `5162306219378829`
- CVV: `318`
- Validade: qualquer data futura

### Recusado:
- Número: `5105105105105100`
- CVV: `123`
- Validade: qualquer data futura

## Notas Importantes

1. **Cartão ativa imediatamente**: Ao usar cartão, a subscription fica `active` logo após o processamento
2. **PIX/Boleto aguardam pagamento**: Status fica `pending` até confirmação do pagamento
3. **Dados sensíveis**: Os dados do cartão são tokenizados antes de serem enviados ao Asaas
4. **CPF/CNPJ obrigatório**: O tenant precisa ter CPF/CNPJ cadastrado antes de fazer checkout
