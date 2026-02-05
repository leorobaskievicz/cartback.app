import Subscription from '#models/subscription'
import planService from '#services/plan_service'
import { DateTime } from 'luxon'

export async function resetMonthlyUsage() {
  console.log('[ResetMonthlyUsage] Verificando subscriptions...')

  const subscriptions = await Subscription.query()
    .where('status', 'active')
    .where('current_period_end', '<=', DateTime.now().toSQL())

  for (const sub of subscriptions) {
    await planService.resetMonthlyUsage(sub.id)
    console.log(`[ResetMonthlyUsage] Reset subscription ${sub.id}`)
  }

  console.log(`[ResetMonthlyUsage] ${subscriptions.length} subscriptions resetadas`)
}
