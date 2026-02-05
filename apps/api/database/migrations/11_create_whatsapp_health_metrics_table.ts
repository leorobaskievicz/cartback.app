import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'whatsapp_health_metrics'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('whatsapp_instance_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('whatsapp_instances')
        .onDelete('CASCADE')
      table
        .integer('tenant_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('tenants')
        .onDelete('CASCADE')

      // Métricas de envio
      table.integer('messages_sent_last_minute').defaultTo(0)
      table.integer('messages_sent_last_hour').defaultTo(0)
      table.integer('messages_sent_last_24h').defaultTo(0)
      table.integer('messages_sent_last_7days').defaultTo(0)

      // Métricas de qualidade
      table.integer('messages_delivered').defaultTo(0)
      table.integer('messages_read').defaultTo(0)
      table.integer('messages_failed').defaultTo(0)
      table.integer('user_responses_received').defaultTo(0)
      table.integer('user_blocks_reported').defaultTo(0)

      // Health Score (0-100)
      table.integer('health_score').defaultTo(100)
      table
        .enum('quality_rating', ['high', 'medium', 'low', 'flagged'])
        .defaultTo('high')

      // Tier atual do WhatsApp
      table
        .enum('current_tier', ['unverified', 'tier1', 'tier2', 'tier3', 'tier4'])
        .defaultTo('unverified')
      table.integer('daily_limit').defaultTo(250)

      // Warm-up tracking
      table.date('number_connected_at').nullable()
      table.integer('days_since_connection').defaultTo(0)
      table.boolean('is_warming_up').defaultTo(true)

      // Alertas
      table.boolean('has_alerts').defaultTo(false)
      table.json('alerts').nullable() // Array de alertas ativos

      // Últimas atualizações
      table.timestamp('last_message_sent_at').nullable()
      table.timestamp('metrics_calculated_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Índices
      table.index('whatsapp_instance_id')
      table.index('tenant_id')
      table.index('health_score')
      table.index('quality_rating')
      table.index(['tenant_id', 'whatsapp_instance_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
