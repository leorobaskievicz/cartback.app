import vine from '@vinejs/vine'

/**
 * Validator para criar/atualizar template de mensagem
 */
export const createMessageTemplateValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(100),
    triggerType: vine.enum(['abandoned_cart', 'tracking_update']).optional(),
    delayMinutes: vine.number().min(0).max(10080), // Max 7 dias
    content: vine.string().trim().minLength(10).maxLength(1000),
    isActive: vine.boolean().optional(),
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
