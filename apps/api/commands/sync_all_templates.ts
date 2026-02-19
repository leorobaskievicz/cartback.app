import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import WhatsappOfficialCredential from '#models/whatsapp_official_credential'
import templateSyncService from '#services/template_sync_service'

export default class SyncAllTemplates extends BaseCommand {
  static commandName = 'templates:sync-all'
  static description = 'Sincroniza templates de todos os tenants com API Oficial ativa'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('Iniciando sincronização de templates para todos os tenants...')

    const credentials = await WhatsappOfficialCredential.query().where('is_active', true)

    this.logger.info(`Encontrados ${credentials.length} tenants com API Oficial ativa`)

    let totalSent = 0
    let totalImported = 0
    let totalUpdated = 0
    let errors = 0

    for (const credential of credentials) {
      try {
        this.logger.info(`Sincronizando tenant ${credential.tenantId}...`)

        const result = await templateSyncService.fullSync(credential.tenantId)

        totalSent += result.sentToMeta
        totalImported += result.importedFromMeta
        totalUpdated += result.updated

        this.logger.success(
          `Tenant ${credential.tenantId}: Enviados=${result.sentToMeta}, Importados=${result.importedFromMeta}, Atualizados=${result.updated}`
        )
      } catch (error: any) {
        this.logger.error(`Erro ao sincronizar tenant ${credential.tenantId}: ${error.message}`)
        errors++
      }
    }

    this.logger.info('─'.repeat(50))
    this.logger.info(`RESUMO DA SINCRONIZAÇÃO:`)
    this.logger.info(`  Templates enviados para Meta: ${totalSent}`)
    this.logger.info(`  Templates importados da Meta: ${totalImported}`)
    this.logger.info(`  Status atualizados: ${totalUpdated}`)
    this.logger.info(`  Erros: ${errors}`)
    this.logger.info('─'.repeat(50))
  }
}
