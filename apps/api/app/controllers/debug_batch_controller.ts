import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import evolutionApi from '#services/evolution_api_service'
import WhatsappInstance from '#models/whatsapp_instance'

/**
 * Controller TEMPORÁRIO para debug (SEM AUTENTICAÇÃO)
 * REMOVER APÓS DEBUG
 */
export default class DebugBatchController {
  /**
   * GET /api/debug/last-batch
   * ENDPOINT TEMPORÁRIO SEM AUTH - REMOVER APÓS DEBUG
   */
  async lastBatch({ response }: HttpContext) {
    try {
      // 1. Últimas falhas
      const recentFailures = await db.rawQuery(`
        SELECT
          customer_phone,
          LENGTH(customer_phone) as tamanho,
          HEX(customer_phone) as hex_do_numero,
          error_message,
          created_at
        FROM unified_message_logs
        WHERE status = 'failed'
          AND provider = 'evolution'
          AND created_at >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
        ORDER BY created_at DESC
        LIMIT 10
      `)

      // 2. Últimos sucessos
      const recentSuccesses = await db.rawQuery(`
        SELECT
          customer_phone,
          LENGTH(customer_phone) as tamanho,
          HEX(customer_phone) as hex_do_numero,
          created_at
        FROM unified_message_logs
        WHERE status = 'sent'
          AND provider = 'evolution'
          AND created_at >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
        ORDER BY created_at DESC
        LIMIT 10
      `)

      // 3. Números problemáticos específicos
      const problematic98027292 = await db.rawQuery(`
        SELECT
          customer_phone as numero_completo,
          LENGTH(customer_phone) as tamanho,
          HEX(customer_phone) as hex,
          error_message as erro,
          created_at
        FROM unified_message_logs
        WHERE customer_phone LIKE '%98027292%'
        ORDER BY created_at DESC
        LIMIT 3
      `)

      const problematic92489909 = await db.rawQuery(`
        SELECT
          customer_phone as numero_completo,
          LENGTH(customer_phone) as tamanho,
          HEX(customer_phone) as hex,
          error_message as erro,
          created_at
        FROM unified_message_logs
        WHERE customer_phone LIKE '%92489909%'
        ORDER BY created_at DESC
        LIMIT 3
      `)

      // 4. Carrinho original
      const originalCarts = await db.rawQuery(`
        SELECT
          customer_phone as numero_no_carrinho,
          LENGTH(customer_phone) as tamanho,
          HEX(customer_phone) as hex,
          status as status_carrinho,
          created_at
        FROM abandoned_carts
        WHERE (customer_phone LIKE '%98027292%' OR customer_phone LIKE '%92489909%')
        ORDER BY created_at DESC
        LIMIT 5
      `)

      // Decodificar HEX para facilitar leitura
      const decodeHex = (hex: string) => {
        try {
          return Buffer.from(hex, 'hex').toString('utf8')
        } catch {
          return 'N/A'
        }
      }

      return response.ok({
        success: true,
        analysis: {
          summary: {
            total_failures_last_30min: recentFailures[0]?.length || 0,
            total_successes_last_30min: recentSuccesses[0]?.length || 0,
          },
          recent_failures: (recentFailures[0] || []).map((f: any) => ({
            ...f,
            hex_decoded: decodeHex(f.hex_do_numero),
          })),
          recent_successes: (recentSuccesses[0] || []).map((s: any) => ({
            ...s,
            hex_decoded: decodeHex(s.hex_do_numero),
          })),
          problematic_numbers: {
            phone_98027292: (problematic98027292[0] || []).map((p: any) => ({
              ...p,
              hex_decoded: decodeHex(p.hex),
            })),
            phone_92489909: (problematic92489909[0] || []).map((p: any) => ({
              ...p,
              hex_decoded: decodeHex(p.hex),
            })),
          },
          original_carts: (originalCarts[0] || []).map((c: any) => ({
            ...c,
            hex_decoded: decodeHex(c.hex),
          })),
        },
      })
    } catch (error: any) {
      console.error('[Debug Batch] Erro:', error.message)
      return response.internalServerError({
        error: 'Failed to analyze',
        details: error.message,
        stack: error.stack,
      })
    }
  }

  /**
   * POST /api/debug/test-evolution
   * Testa envio direto para Evolution API e captura resposta completa
   */
  async testEvolution({ request, response }: HttpContext) {
    try {
      const { phone, tenantId } = request.only(['phone', 'tenantId'])

      if (!phone) {
        return response.badRequest({ error: 'Phone required' })
      }

      // Buscar instância WhatsApp conectada do tenant
      const whatsappInstance = await WhatsappInstance.query()
        .where('tenant_id', tenantId || 4) // Default tenant 4
        .where('status', 'connected')
        .first()

      if (!whatsappInstance) {
        return response.badRequest({
          error: 'No connected WhatsApp instance',
          hint: 'Verifique se há uma instância conectada para o tenant',
        })
      }

      const testMessage = `🧪 TESTE DE DEBUG - ${new Date().toISOString()}\n\nEste é um teste técnico para diagnosticar problemas de envio.`

      console.log('\n========================================')
      console.log('🧪 TESTE EVOLUTION API - DEBUG')
      console.log('========================================')
      console.log('Instância:', whatsappInstance.instanceName)
      console.log('Telefone original:', phone)
      console.log('Mensagem:', testMessage)
      console.log('========================================\n')

      try {
        // Tentar enviar via Evolution API
        const result = await evolutionApi.sendText(
          whatsappInstance.instanceName,
          phone,
          testMessage
        )

        console.log('\n✅ SUCESSO NA RESPOSTA DO EVOLUTION:')
        console.log(JSON.stringify(result, null, 2))
        console.log('========================================\n')

        return response.ok({
          success: true,
          phone_tested: phone,
          instance: whatsappInstance.instanceName,
          result: result,
          message: 'Mensagem enviada com sucesso!',
        })
      } catch (error: any) {
        console.log('\n❌ ERRO NA RESPOSTA DO EVOLUTION:')
        console.log('Status:', error.status || error.response?.status)
        console.log('Message:', error.message)
        console.log('Response Data:', JSON.stringify(error.response?.data, null, 2))
        console.log('Full Error:', JSON.stringify(error, null, 2))
        console.log('========================================\n')

        return response.status(error.status || 500).send({
          success: false,
          phone_tested: phone,
          instance: whatsappInstance.instanceName,
          error: {
            message: error.message,
            status: error.status || error.response?.status,
            response_data: error.response?.data,
            response_headers: error.response?.headers,
          },
          hint: 'Veja os logs do Railway para detalhes completos',
        })
      }
    } catch (error: any) {
      console.error('[Debug Evolution] Erro:', error)
      return response.internalServerError({
        error: 'Test failed',
        details: error.message,
      })
    }
  }
}
