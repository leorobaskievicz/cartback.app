import { defineConfig } from '@adonisjs/core/app'

export default defineConfig({
  typescript: true,
  directories: {
    controllers: 'app/controllers',
    models: 'app/models',
    services: 'app/services',
    middleware: 'app/middleware',
    validators: 'app/validators',
    providers: 'providers',
    start: 'start',
  },
  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/core/providers/hash_provider'),
    () => import('@adonisjs/core/providers/repl_provider'),
    () => import('@adonisjs/lucid/database_provider'),
    () => import('@adonisjs/auth/auth_provider'),
    () => import('#providers/queue_provider'),
  ],
  commands: [
    () => import('@adonisjs/core/commands'),
    () => import('@adonisjs/lucid/commands'),
    () => import('@adonisjs/assembler/commands'),
  ],
  preloads: [
    {
      file: () => import('#start/routes'),
      environment: ['web', 'console'],
    },
    {
      file: () => import('#start/kernel'),
      environment: ['web'],
    },
  ],
})
