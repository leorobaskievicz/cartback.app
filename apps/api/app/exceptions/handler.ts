import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class Handler extends ExceptionHandler {
  protected debug = true

  async handle(error: unknown, ctx: HttpContext) {
    console.error('🔥 EXCEPTION HANDLER - handle:', error)
    if (error instanceof Error) {
      console.error('🔥 Error message:', error.message)
      console.error('🔥 Error stack:', error.stack)
    }
    return super.handle(error, ctx)
  }

  async report(error: unknown, ctx: HttpContext) {
    console.error('🔥 EXCEPTION HANDLER - report:', error)
    if (error instanceof Error) {
      console.error('🔥 Error message:', error.message)
      console.error('🔥 Error stack:', error.stack)
    }
    return super.report(error, ctx)
  }
}
