import vine from '@vinejs/vine'

/**
 * Validator para checkout com cartão de crédito
 */
export const checkoutCreditCardValidator = vine.compile(
  vine.object({
    plan: vine.enum(['starter', 'pro', 'business']),
    billingType: vine.literal('CREDIT_CARD'),
    creditCard: vine.object({
      holderName: vine.string().trim().minLength(3).maxLength(100),
      number: vine
        .string()
        .trim()
        .regex(/^\d{13,19}$/), // 13-19 dígitos
      expiryMonth: vine
        .string()
        .trim()
        .regex(/^(0[1-9]|1[0-2])$/), // 01-12
      expiryYear: vine
        .string()
        .trim()
        .regex(/^\d{4}$/), // YYYY
      ccv: vine
        .string()
        .trim()
        .regex(/^\d{3,4}$/), // 3 ou 4 dígitos
    }),
    holderInfo: vine.object({
      name: vine.string().trim().minLength(3).maxLength(100),
      email: vine.string().email().normalizeEmail(),
      cpfCnpj: vine
        .string()
        .trim()
        .regex(/^\d{11}$|^\d{14}$/), // CPF (11) ou CNPJ (14)
      postalCode: vine
        .string()
        .trim()
        .regex(/^\d{8}$/), // CEP sem hífen
      addressNumber: vine.string().trim().minLength(1).maxLength(10),
      addressComplement: vine.string().trim().optional(),
      phone: vine
        .string()
        .trim()
        .regex(/^\d{10,11}$/), // DDD + número
    }),
  })
)

/**
 * Validator para checkout com PIX ou Boleto
 */
export const checkoutSimpleValidator = vine.compile(
  vine.object({
    plan: vine.enum(['starter', 'pro', 'business']),
    billingType: vine.enum(['PIX', 'BOLETO']),
  })
)
