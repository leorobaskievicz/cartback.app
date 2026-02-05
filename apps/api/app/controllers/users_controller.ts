import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class UsersController {
  async index({ response }: HttpContext) {
    const users = await User.all()
    return response.ok(users)
  }

  async show({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    return response.ok(user)
  }

  async update({ params, request, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    const data = request.only(['name', 'email'])

    user.merge(data)
    await user.save()

    return response.ok(user)
  }

  async destroy({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    await user.delete()

    return response.noContent()
  }
}
