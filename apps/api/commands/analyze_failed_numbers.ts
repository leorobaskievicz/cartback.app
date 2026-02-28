import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'

export default class AnalyzeFailedNumbers extends BaseCommand {
  static commandName = 'analyze:failed-numbers'
  static description = 'Analisa números que falharam comparando com os que tiveram sucesso'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('🔍 Analisando falhas de envio...')

    try {
      // Buscar últimos 100 logs
      const recentLogs = await db.rawQuery(`
        SELECT
          customer_phone,
          status,
          error_message,
          error_code,
          message_content,
          LENGTH(customer_phone) as phone_length,
          SUBSTRING(customer_phone, 1, 4) as phone_prefix,
          created_at
        FROM unified_message_logs
        WHERE provider = 'evolution'
        ORDER BY created_at DESC
        LIMIT 100
      `)

      const logs = recentLogs[0]

      // Separar sucessos e falhas
      const successes = logs.filter((l: any) => l.status === 'sent')
      const failures = logs.filter((l: any) => l.status === 'failed')

      this.logger.info(`\n📊 RESUMO:`)
      this.logger.info(`Total de logs: ${logs.length}`)
      this.logger.info(`Sucessos: ${successes.length} (${((successes.length / logs.length) * 100).toFixed(1)}%)`)
      this.logger.info(`Falhas: ${failures.length} (${((failures.length / logs.length) * 100).toFixed(1)}%)`)

      // Análise de comprimento de números
      this.logger.info(`\n📏 COMPRIMENTO DOS NÚMEROS:`)
      const successLengths = successes.map((l: any) => l.phone_length)
      const failureLengths = failures.map((l: any) => l.phone_length)

      this.logger.info(`Sucessos: ${[...new Set(successLengths)].sort().join(', ')} caracteres`)
      this.logger.info(`Falhas: ${[...new Set(failureLengths)].sort().join(', ')} caracteres`)

      // Exemplos de números que funcionaram
      this.logger.info(`\n✅ EXEMPLOS DE NÚMEROS QUE FUNCIONARAM:`)
      successes.slice(0, 5).forEach((log: any) => {
        this.logger.info(`  ${log.customer_phone} (${log.phone_length} chars)`)
      })

      // Números que falharam
      this.logger.info(`\n❌ NÚMEROS QUE FALHARAM:`)
      failures.slice(0, 10).forEach((log: any) => {
        this.logger.info(`  ${log.customer_phone} (${log.phone_length} chars)`)
        this.logger.info(`    Erro: ${log.error_message}`)
        this.logger.info(`    Code: ${log.error_code}`)
        this.logger.info(``)
      })

      // Análise específica dos números problemáticos
      const problematicNumbers = ['41998027292', '41992489909']
      this.logger.info(`\n🎯 ANÁLISE ESPECÍFICA DOS NÚMEROS PROBLEMÁTICOS:`)

      for (const phoneFragment of problematicNumbers) {
        const failedLogs = failures.filter((l: any) =>
          l.customer_phone.includes(phoneFragment)
        )

        if (failedLogs.length > 0) {
          this.logger.info(`\nNúmero ${phoneFragment}:`)
          failedLogs.forEach((log: any) => {
            this.logger.info(`  Telefone completo: ${log.customer_phone}`)
            this.logger.info(`  Comprimento: ${log.phone_length} caracteres`)
            this.logger.info(`  Prefixo: ${log.phone_prefix}`)
            this.logger.info(`  Erro: ${log.error_message}`)
            this.logger.info(`  Prévia da mensagem: ${log.message_content?.substring(0, 100)}...`)
            this.logger.info(`  Data: ${log.created_at}`)
            this.logger.info(``)
          })
        }
      }

      // Comparar com número de sucesso parecido
      const successExample = successes.find((l: any) => l.customer_phone.startsWith('5541'))
      if (successExample) {
        this.logger.info(`\n🔬 COMPARAÇÃO COM NÚMERO DE SUCESSO SIMILAR:`)
        this.logger.info(`Número que funcionou: ${successExample.customer_phone}`)
        this.logger.info(`Comprimento: ${successExample.phone_length} caracteres`)
        this.logger.info(`Prévia da mensagem: ${successExample.message_content?.substring(0, 100)}...`)

        const failExample = failures.find((l: any) =>
          l.customer_phone.includes('98027292') || l.customer_phone.includes('92489909')
        )

        if (failExample) {
          this.logger.info(`\nNúmero que falhou: ${failExample.customer_phone}`)
          this.logger.info(`Comprimento: ${failExample.phone_length} caracteres`)
          this.logger.info(`Prévia da mensagem: ${failExample.message_content?.substring(0, 100)}...`)

          // Comparar byte por byte
          this.logger.info(`\n🔍 DIFERENÇAS:`)
          this.logger.info(`  Comprimento: ${successExample.phone_length} vs ${failExample.phone_length}`)
          this.logger.info(`  Mesma mensagem? ${successExample.message_content === failExample.message_content}`)

          if (successExample.message_content !== failExample.message_content) {
            this.logger.info(`  Tamanho mensagem sucesso: ${successExample.message_content?.length}`)
            this.logger.info(`  Tamanho mensagem falha: ${failExample.message_content?.length}`)
          }
        }
      }

      // Breakdown de erros
      const errorBreakdown: Record<string, number> = {}
      failures.forEach((log: any) => {
        const key = log.error_message || 'Unknown'
        errorBreakdown[key] = (errorBreakdown[key] || 0) + 1
      })

      this.logger.info(`\n📋 TIPOS DE ERROS:`)
      Object.entries(errorBreakdown)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .forEach(([error, count]) => {
          this.logger.info(`  ${count}x: ${error}`)
        })

      this.logger.info(`\n✅ Análise concluída!`)
    } catch (error: any) {
      this.logger.error(`❌ Erro ao analisar: ${error.message}`)
      this.logger.error(error.stack)
    }
  }
}
