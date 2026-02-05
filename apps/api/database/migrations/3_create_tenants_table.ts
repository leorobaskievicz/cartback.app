import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tenants'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('uuid', 36).notNullable().unique()
      table.string('name').notNullable()
      table.string('email').notNullable()
      table.string('phone').nullable()
      table.enum('plan', ['trial', 'starter', 'pro', 'business']).defaultTo('trial')
      table.timestamp('trial_ends_at').nullable()
      table.boolean('is_active').defaultTo(true)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Índices
      table.index('uuid')
      table.index('is_active')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
