import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'rate_limit_configs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('tenant_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('tenants')
        .onDelete('CASCADE')
        .unique()

      // Limites personalizados (null = usar padrão do sistema)
      table.integer('max_messages_per_minute').nullable()
      table.integer('max_messages_per_hour').nullable()
      table.integer('max_messages_per_day').nullable()

      // Delay entre mensagens (em segundos)
      table.integer('min_delay_between_messages').defaultTo(3) // 3 segundos padrão

      // Warm-up settings
      table.integer('warmup_daily_increase').defaultTo(10) // Aumentar 10 contatos/dia
      table.integer('warmup_max_daily_messages').defaultTo(50) // Máx 50 msgs/dia no warmup

      // Horários permitidos
      table.time('allowed_start_time').defaultTo('08:00:00')
      table.time('allowed_end_time').defaultTo('22:00:00')

      // Proteções
      table.boolean('block_manual_sends').defaultTo(true) // Bloquear envios avulsos
      table.boolean('require_template').defaultTo(true) // Exigir template
      table.boolean('enable_personalization_check').defaultTo(true) // Verificar personalização

      // Response rate mínima (%)
      table.integer('min_response_rate').defaultTo(30) // 30% mínimo

      // Configurações avançadas
      table.boolean('auto_pause_on_low_quality').defaultTo(true) // Pausar se quality baixa
      table.integer('max_identical_messages').defaultTo(3) // Máx 3 mensagens idênticas
      table.integer('max_failures_before_pause').defaultTo(10) // Pausar após 10 falhas

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Índice
      table.index('tenant_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
