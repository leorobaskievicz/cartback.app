import vine from '@vinejs/vine'

/**
 * Validator para criar integração manual (webhook)
 */
export const createStoreIntegrationValidator = vine.compile(
  vine.object({
    platform: vine.enum(['nuvemshop', 'yampi', 'shopify', 'woocommerce', 'webhook']),
    storeName: vine.string().trim().minLength(3).maxLength(100),
    storeUrl: vine.string().url().optional(),
  })
)
