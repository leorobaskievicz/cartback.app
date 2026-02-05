import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payment_histories'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('target_plan', 20).nullable().after('subscription_id')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('target_plan')
    })
  }
}
