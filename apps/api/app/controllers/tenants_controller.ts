import type { HttpContext } from '@adonisjs/core/http'
import Tenant from '#models/tenant'
import { updateTenantValidator } from '#validators/tenant'

export default class TenantsController {
  /**
   * GET /api/tenant
   * Retorna dados do tenant atual
   */
  async show({ auth, response }: HttpContext) {
    const user = auth.user!
    const tenant = await Tenant.findOrFail(user.tenantId)

    return response.ok({
      success: true,
      data: {
        id: tenant.id,
        uuid: tenant.uuid,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        cpfCnpj: tenant.cpfCnpj,
        plan: tenant.plan,
        isActive: tenant.isActive,
        trialEndsAt: tenant.trialEndsAt,
      },
    })
  }

  /**
   * PUT /api/tenant
   * Atualiza dados do tenant
   */
  async update({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const tenant = await Tenant.findOrFail(user.tenantId)
    const data = await updateTenantValidator.validate(request.all())

    tenant.merge(data)
    await tenant.save()

    return response.ok({
      success: true,
      data: {
        id: tenant.id,
        uuid: tenant.uuid,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        cpfCnpj: tenant.cpfCnpj,
        plan: tenant.plan,
        isActive: tenant.isActive,
      },
    })
  }
}
