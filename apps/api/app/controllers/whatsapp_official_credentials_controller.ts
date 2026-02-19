import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import WhatsappOfficialCredential from '#models/whatsapp_official_credential'
import whatsappOfficialService from '#services/whatsapp_official_service'
import templateSyncService from '#services/template_sync_service'
import {
  upsertOfficialCredentialsValidator,
} from '#validators/whatsapp_official'

export default class WhatsappOfficialCredentialsController {
  /**
   * GET /api/whatsapp-official/credentials
   * Retorna as credenciais do tenant (sem expor o access_token completo)
   */
  async show({ auth, response }: HttpContext) {
    const user = auth.user!

    const credential = await WhatsappOfficialCredential.query()
      .where('tenant_id', user.tenantId)
      .first()

    if (!credential) {
      return response.ok({
        success: true,
        data: { configured: false, credential: null },
      })
    }

    return response.ok({
      success: true,
      data: {
        configured: true,
        credential: {
          id: credential.id,
          phoneNumberId: credential.phoneNumberId,
          wabaId: credential.wabaId,
          // Mascarar o token por segurança
          accessToken: credential.accessToken
            ? '••••••••' + credential.accessToken.slice(-6)
            : null,
          webhookVerifyToken: credential.webhookVerifyToken,
          phoneNumber: credential.phoneNumber,
          displayName: credential.displayName,
          status: credential.status,
          lastError: credential.lastError,
          isActive: credential.isActive,
          tokenExpiresAt: credential.tokenExpiresAt,
          createdAt: credential.createdAt,
          updatedAt: credential.updatedAt,
        },
      },
    })
  }

  /**
   * POST /api/whatsapp-official/credentials
   * Cria ou atualiza as credenciais do tenant
   */
  async upsert({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const data = await upsertOfficialCredentialsValidator.validate(request.all())

    // Verificar credenciais na Meta API antes de salvar
    const verification = await whatsappOfficialService.verifyCredentials({
      phoneNumberId: data.phoneNumberId,
      wabaId: data.wabaId,
      accessToken: data.accessToken,
    })

    if (!verification.valid) {
      return response.badRequest({
        success: false,
        error: {
          code: 'INVALID_META_CREDENTIALS',
          message: 'Credenciais inválidas: ' + verification.error,
        },
      })
    }

    // Tentar obter informações sobre expiração do token
    let tokenExpiresAt: DateTime | null = null
    try {
      const tokenDebug = await whatsappOfficialService.debugAccessToken(data.accessToken)
      if (tokenDebug.isValid && tokenDebug.expiresAt) {
        // expiresAt é timestamp Unix (segundos), converter para DateTime
        // Se expiresAt for 0, significa que é token permanente (System User)
        if (tokenDebug.expiresAt > 0) {
          tokenExpiresAt = DateTime.fromSeconds(tokenDebug.expiresAt)
        }
      }
    } catch (error) {
      console.warn('⚠️ Não foi possível obter data de expiração do token:', error)
      // Não é crítico, continua sem a data de expiração
    }

    // Criar ou atualizar credenciais
    let credential = await WhatsappOfficialCredential.query()
      .where('tenant_id', user.tenantId)
      .first()

    if (credential) {
      credential.phoneNumberId = data.phoneNumberId
      credential.wabaId = data.wabaId
      credential.accessToken = data.accessToken
      credential.webhookVerifyToken = data.webhookVerifyToken
      credential.phoneNumber = verification.phoneNumber || null
      credential.displayName = verification.displayName || null
      credential.status = 'active'
      credential.lastError = null
      credential.isActive = true
      credential.tokenExpiresAt = tokenExpiresAt
      await credential.save()
    } else {
      credential = await WhatsappOfficialCredential.create({
        tenantId: user.tenantId,
        phoneNumberId: data.phoneNumberId,
        wabaId: data.wabaId,
        accessToken: data.accessToken,
        webhookVerifyToken: data.webhookVerifyToken,
        phoneNumber: verification.phoneNumber || null,
        displayName: verification.displayName || null,
        status: 'active',
        isActive: true,
        tokenExpiresAt: tokenExpiresAt,
      })
    }

    // Auto-sync templates em background (não bloqueia resposta)
    templateSyncService
      .fullSync(user.tenantId)
      .then((result) => {
        console.log(
          `✅ Auto-sync completed for tenant ${user.tenantId}:`,
          `Sent: ${result.sentToMeta}, Imported: ${result.importedFromMeta}, Updated: ${result.updated}`
        )
      })
      .catch((error) => {
        console.error(`⚠️ Auto-sync failed for tenant ${user.tenantId}:`, error)
      })

    return response.ok({
      success: true,
      data: {
        id: credential.id,
        phoneNumberId: credential.phoneNumberId,
        wabaId: credential.wabaId,
        accessToken: '••••••••' + credential.accessToken.slice(-6),
        webhookVerifyToken: credential.webhookVerifyToken,
        phoneNumber: credential.phoneNumber,
        displayName: credential.displayName,
        status: credential.status,
        isActive: credential.isActive,
        tokenExpiresAt: credential.tokenExpiresAt,
      },
      message: 'Credenciais salvas com sucesso!',
    })
  }

  /**
   * DELETE /api/whatsapp-official/credentials
   * Remove as credenciais do tenant
   */
  async destroy({ auth, response }: HttpContext) {
    const user = auth.user!

    const credential = await WhatsappOfficialCredential.query()
      .where('tenant_id', user.tenantId)
      .firstOrFail()

    await credential.delete()

    return response.ok({
      success: true,
      data: { message: 'Credenciais removidas com sucesso' },
    })
  }

  /**
   * POST /api/whatsapp-official/credentials/verify
   * Verifica as credenciais atuais sem modificá-las
   */
  async verify({ auth, response }: HttpContext) {
    const user = auth.user!

    const credential = await WhatsappOfficialCredential.query()
      .where('tenant_id', user.tenantId)
      .firstOrFail()

    const verification = await whatsappOfficialService.verifyCredentials({
      phoneNumberId: credential.phoneNumberId,
      wabaId: credential.wabaId,
      accessToken: credential.accessToken,
    })

    if (!verification.valid) {
      credential.status = 'error'
      credential.lastError = verification.error || 'Falha na verificação'
      await credential.save()

      return response.ok({
        success: true,
        data: { valid: false, error: verification.error },
      })
    }

    credential.status = 'active'
    credential.lastError = null
    credential.phoneNumber = verification.phoneNumber || credential.phoneNumber
    credential.displayName = verification.displayName || credential.displayName
    await credential.save()

    return response.ok({
      success: true,
      data: {
        valid: true,
        phoneNumber: verification.phoneNumber,
        displayName: verification.displayName,
      },
    })
  }
}
