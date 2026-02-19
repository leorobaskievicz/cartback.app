import vine from '@vinejs/vine'

/**
 * Validator para criar/atualizar template de mensagem
 * Suporta tanto formato simples (Evolution API) quanto formato completo (Meta API)
 */
export const createMessageTemplateValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(100),
    triggerType: vine.enum(['abandoned_cart', 'tracking_update']).optional(),
    delayMinutes: vine.number().min(0).max(10080), // Max 7 dias
    content: vine.string().trim().optional(), // Opcional se usar metaMode
    isActive: vine.boolean().optional(),
    // Campos Meta API (opcionais)
    metaMode: vine.boolean().optional(), // Se true, usa campos abaixo
    metaLanguage: vine.string().optional(),
    metaCategory: vine.enum(['MARKETING', 'UTILITY']).optional(),
    headerType: vine.enum(['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT']).optional(),
    headerText: vine.string().trim().maxLength(60).optional(),
    headerMediaUrl: vine.string().url().optional(),
    bodyText: vine.string().trim().minLength(1).maxLength(1024).optional(),
    footerText: vine.string().trim().maxLength(60).optional(),
    buttons: vine
      .array(
        vine.object({
          type: vine.enum(['QUICK_REPLY', 'URL', 'PHONE_NUMBER']),
          text: vine.string().trim().minLength(1).maxLength(25),
          url: vine.string().url().optional(),
          phoneNumber: vine.string().optional(),
        })
      )
      .optional(),
  })
)

/**
 * Validator para atualizar template
 */
export const updateMessageTemplateValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(100).optional(),
    delayMinutes: vine.number().min(0).max(10080).optional(),
    content: vine.string().trim().minLength(10).maxLength(1000).optional(),
    isActive: vine.boolean().optional(),
  })
)

/**
 * Validator para reordenar templates
 */
export const reorderTemplatesValidator = vine.compile(
  vine.object({
    templates: vine.array(
      vine.object({
        id: vine.number(),
        sortOrder: vine.number(),
      })
    ),
  })
)
