import vine from '@vinejs/vine'

/**
 * Validator para registro de novo tenant + user
 */
export const registerValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(100),
    email: vine.string().email().normalizeEmail(),
    password: vine.string().minLength(8).maxLength(100),
    phone: vine.string().trim().optional(),
    tenantName: vine.string().trim().minLength(3).maxLength(100),
  })
)

/**
 * Validator para login
 */
export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    password: vine.string(),
  })
)

/**
 * Validator para refresh token
 */
export const refreshTokenValidator = vine.compile(
  vine.object({
    refreshToken: vine.string(),
  })
)
