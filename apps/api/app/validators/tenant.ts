import vine from '@vinejs/vine'

/**
 * Validator para atualização de dados do tenant
 */
export const updateTenantValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(100).optional(),
    email: vine.string().email().normalizeEmail().optional(),
    phone: vine.string().trim().optional(),
    cpfCnpj: vine.string().trim().optional(),
  })
)
