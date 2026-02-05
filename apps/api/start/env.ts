import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  APP_KEY: Env.schema.string(),
  APP_URL: Env.schema.string(),
  WEB_URL: Env.schema.string.optional(),
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),
  REDIS_HOST: Env.schema.string({ format: 'host' }),
  REDIS_PORT: Env.schema.number(),
  REDIS_URL: Env.schema.string.optional(),

  // Nuvemshop Integration
  NUVEMSHOP_APP_ID: Env.schema.string.optional(),
  NUVEMSHOP_APP_SECRET: Env.schema.string.optional(),
  NUVEMSHOP_REDIRECT_URI: Env.schema.string.optional(),

  // Evolution API (WhatsApp)
  EVOLUTION_API_URL: Env.schema.string(),
  EVOLUTION_API_KEY: Env.schema.string(),

  // Asaas Payment Gateway
  ASAAS_API_KEY: Env.schema.string(),
  ASAAS_ENVIRONMENT: Env.schema.enum(['sandbox', 'production'] as const),
  ASAAS_WEBHOOK_TOKEN: Env.schema.string(),
})
