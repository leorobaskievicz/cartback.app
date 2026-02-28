import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import evolutionApi from '#services/evolution_api_service'
import WhatsappInstance from '#models/whatsapp_instance'

export default class TestEvolutionDirect extends BaseCommand {
  static commandName = 'test:evolution-direct'
  static description = 'Testa envio direto para Evolution API e captura resposta completa'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const testPhones = [
      { phone: '41998027292', label: '❌ NÚMERO QUE SEMPRE FALHA' },
      { phone: '41992489909', label: '❌ NÚMERO QUE SEMPRE FALHA' },
      { phone: '41999261087', label: '✅ NÚMERO QUE FUNCIONA' },
    ]

    try {
      // Buscar instância WhatsApp conectada
      const whatsappInstance = await WhatsappInstance.query()
        .where('tenant_id', 4)
        .where('status', 'connected')
        .first()

      if (!whatsappInstance) {
        this.logger.error('❌ Nenhuma instância WhatsApp conectada encontrada para tenant 4')
        return
      }

      this.logger.info(`🔗 Instância conectada: ${whatsappInstance.instanceName}`)
      this.logger.info('')

      for (const { phone, label } of testPhones) {
        this.logger.info('========================================')
        this.logger.info(`🧪 TESTANDO: ${label}`)
        this.logger.info(`📱 Número: ${phone}`)
        this.logger.info('========================================')

        const testMessage = `🧪 TESTE DE DEBUG - ${new Date().toISOString()}\n\nEste é um teste técnico automático.`

        try {
          this.logger.info(`📤 Enviando via Evolution API...`)

          const result = await evolutionApi.sendText(
            whatsappInstance.instanceName,
            phone,
            testMessage
          )

          this.logger.info(`✅ SUCESSO!`)
          this.logger.info(`Message ID: ${result?.key?.id}`)
          this.logger.info(`Resposta completa:`)
          this.logger.info(JSON.stringify(result, null, 2))
        } catch (error: any) {
          this.logger.error(`❌ FALHOU!`)
          this.logger.error(`Status: ${error.status || error.response?.status}`)
          this.logger.error(`Mensagem: ${error.message}`)

          if (error.response?.data) {
            this.logger.error(`Response Data:`)
            this.logger.error(JSON.stringify(error.response.data, null, 2))
          }

          if (error.responseData) {
            this.logger.error(`Response Data (enhanced):`)
            this.logger.error(JSON.stringify(error.responseData, null, 2))
          }
        }

        this.logger.info('')
        this.logger.info('')

        // Aguardar 2 segundos entre testes
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }

      this.logger.info('========================================')
      this.logger.info('✅ TESTES CONCLUÍDOS')
      this.logger.info('========================================')
    } catch (error: any) {
      this.logger.error(`❌ Erro geral: ${error.message}`)
      this.logger.error(error.stack)
    }
  }
}
