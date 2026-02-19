import vine from '@vinejs/vine'

/**
 * Validator para criar/atualizar credenciais da API Oficial WhatsApp
 */
export const upsertOfficialCredentialsValidator = vine.compile(
  vine.object({
    phoneNumberId: vine.string().trim().minLength(5).maxLength(30),
    wabaId: vine.string().trim().minLength(5).maxLength(30),
    accessToken: vine.string().trim().minLength(10),
    webhookVerifyToken: vine.string().trim().minLength(8).maxLength(100),
  })
)

/**
 * Validator para criar template na Meta
 */
const templateComponentSchema = vine.object({
  type: vine.enum(['HEADER', 'BODY', 'FOOTER', 'BUTTONS']),
  format: vine.enum(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT']).optional(),
  text: vine.string().optional(),
  buttons: vine
    .array(
      vine.object({
        type: vine.enum(['QUICK_REPLY', 'URL', 'PHONE_NUMBER']),
        text: vine.string().trim().maxLength(25),
        url: vine.string().trim().optional(),
        phone_number: vine.string().trim().optional(),
      })
    )
    .optional(),
  example: vine
    .object({
      header_text: vine.array(vine.string()).optional(),
      body_text: vine.array(vine.array(vine.string())).optional(),
      header_handle: vine.array(vine.string()).optional(),
    })
    .optional(),
})

export const createOfficialTemplateValidator = vine.compile(
  vine.object({
    name: vine
      .string()
      .trim()
      .minLength(3)
      .maxLength(512)
      .regex(/^[a-z0-9_]+$/)
      .transform((v) => v.toLowerCase()),
    displayName: vine.string().trim().maxLength(100).optional(),
    category: vine.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION']),
    language: vine.string().trim().minLength(2).maxLength(10),
    components: vine.array(templateComponentSchema).minLength(1),
  })
)
