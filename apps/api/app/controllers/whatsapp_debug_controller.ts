import type { HttpContext } from '@adonisjs/core/http'
import WhatsappInstance from '#models/whatsapp_instance'
import evolutionApi from '#services/evolution_api_service'

/**
 * Controller para debug e diagnóstico do WhatsApp
 */
export default class WhatsappDebugController {
  /**
   * POST /api/whatsapp/debug/check-number
   * Verifica se um número está registrado no WhatsApp
   */
  async checkNumber({ request, response, auth }: HttpContext) {
    const { phone } = request.only(['phone'])

    if (!phone) {
      return response.badRequest({ error: 'Phone number is required' })
    }

    const user = auth.user!

    // Buscar instância WhatsApp conectada
    const whatsappInstance = await WhatsappInstance.query()
      .where('tenant_id', user.tenantId)
      .where('status', 'connected')
      .first()

    if (!whatsappInstance) {
      return response.badRequest({
        error: 'No connected WhatsApp instance found',
      })
    }

    try {
      // Verificar se o número existe no WhatsApp
      const exists = await evolutionApi.checkNumberExists(
        whatsappInstance.instanceName,
        phone
      )

      // Tentar obter informações do contato
      const contactInfo = exists
        ? await evolutionApi.getContactInfo(whatsappInstance.instanceName, phone)
        : null

      return response.ok({
        phone,
        exists,
        contactInfo,
        instance: whatsappInstance.instanceName,
        recommendation: exists
          ? 'Número válido para envio'
          : 'Número NÃO está registrado no WhatsApp. Não é possível enviar mensagens.',
      })
    } catch (error: any) {
      console.error('[WhatsApp Debug] Erro ao verificar número:', error)
      return response.internalServerError({
        error: 'Failed to check number',
        details: error.message,
      })
    }
  }

  /**
   * POST /api/whatsapp/debug/format-phone
   * Testa a formatação de um número sem enviar
   */
  async formatPhone({ request, response }: HttpContext) {
    const { phone } = request.only(['phone'])

    if (!phone) {
      return response.badRequest({ error: 'Phone number is required' })
    }

    // Simular a formatação que o código faz
    const cleaned = phone.replace(/\D/g, '')
    const formatted = cleaned.startsWith('55') ? cleaned : '55' + cleaned

    return response.ok({
      original: phone,
      original_length: phone.length,
      original_hex: Buffer.from(phone).toString('hex'),
      cleaned: cleaned,
      cleaned_length: cleaned.length,
      formatted: formatted,
      formatted_length: formatted.length,
      has_spaces: phone.includes(' '),
      has_parentheses: phone.includes('(') || phone.includes(')'),
      has_dash: phone.includes('-'),
      has_plus: phone.includes('+'),
    })
  }

  /**
   * POST /api/whatsapp/debug/test-send
   * Testa envio de mensagem para um número específico
   */
  async testSend({ request, response, auth }: HttpContext) {
    const { phone, message } = request.only(['phone', 'message'])

    if (!phone || !message) {
      return response.badRequest({ error: 'Phone and message are required' })
    }

    const user = auth.user!

    // Buscar instância WhatsApp conectada
    const whatsappInstance = await WhatsappInstance.query()
      .where('tenant_id', user.tenantId)
      .where('status', 'connected')
      .first()

    if (!whatsappInstance) {
      return response.badRequest({
        error: 'No connected WhatsApp instance found',
      })
    }

    try {
      console.log(`[WhatsApp Debug] Testando envio para ${phone}`)

      const result = await evolutionApi.sendText(
        whatsappInstance.instanceName,
        phone,
        message
      )

      return response.ok({
        success: true,
        phone,
        messageId: result?.key?.id,
        result,
      })
    } catch (error: any) {
      console.error('[WhatsApp Debug] Erro ao enviar:', error)

      const errorData = error.response?.data
      const errorMessage =
        errorData?.message || errorData?.error?.message || errorData?.error || error.message

      return response.status(error.response?.status || 500).send({
        success: false,
        error: errorMessage,
        details: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: errorData,
        },
      })
    }
  }
}
