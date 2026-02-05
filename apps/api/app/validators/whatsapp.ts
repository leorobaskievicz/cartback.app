import vine from '@vinejs/vine'

/**
 * Validator para conectar instância WhatsApp
 */
export const connectWhatsappValidator = vine.compile(
  vine.object({
    instanceName: vine.string().trim().minLength(3).maxLength(50),
  })
)
