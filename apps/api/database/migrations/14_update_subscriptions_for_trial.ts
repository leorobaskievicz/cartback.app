import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'subscriptions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Adicionar coluna trial_ends_at
      table.timestamp('trial_ends_at').nullable()
    })

    // Atualizar enum via raw SQL (necessário para MySQL)
    this.defer(async (db) => {
      await db.rawQuery(
        `ALTER TABLE ${this.tableName}
         MODIFY COLUMN plan ENUM('trial', 'starter', 'pro', 'business') NOT NULL`
      )
      await db.rawQuery(
        `ALTER TABLE ${this.tableName}
         MODIFY COLUMN status ENUM('active', 'past_due', 'cancelled', 'trial', 'pending') DEFAULT 'active'`
      )
      await db.rawQuery(
        `ALTER TABLE ${this.tableName}
         MODIFY COLUMN payment_gateway ENUM('asaas') NULL`
      )
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('trial_ends_at')
    })

    this.defer(async (db) => {
      await db.rawQuery(
        `ALTER TABLE ${this.tableName}
         MODIFY COLUMN plan ENUM('starter', 'pro', 'business') NOT NULL`
      )
      await db.rawQuery(
        `ALTER TABLE ${this.tableName}
         MODIFY COLUMN status ENUM('active', 'past_due', 'cancelled') DEFAULT 'active'`
      )
      await db.rawQuery(
        `ALTER TABLE ${this.tableName}
         MODIFY COLUMN payment_gateway ENUM('asaas', 'stripe') DEFAULT 'asaas'`
      )
    })
  }
}
