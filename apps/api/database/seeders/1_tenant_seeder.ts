import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Tenant from '#models/tenant'
import User from '#models/user'
import MessageTemplate from '#models/message_template'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    // Criar tenant de demonstração
    const tenant = await Tenant.firstOrCreate(
      { email: 'demo@cartback.com' },
      {
        name: 'Loja Demo',
        email: 'demo@cartback.com',
        phone: '11999999999',
        plan: 'trial',
        trialEndsAt: DateTime.now().plus({ days: 14 }),
        isActive: true,
      }
    )

    // Criar usuário owner do tenant
    await User.firstOrCreate(
      { email: 'admin@cartback.com' },
      {
        tenantId: tenant.id,
        email: 'admin@cartback.com',
        name: 'Admin Demo',
        password: 'password123',
        role: 'owner',
      }
    )

    // Criar templates de mensagem padrão
    const templates = [
      {
        tenantId: tenant.id,
        name: '30 minutos',
        triggerType: 'abandoned_cart' as const,
        delayMinutes: 30,
        content: `Olá {{nome}}! 👋

Notei que você deixou alguns itens no carrinho:

{{produtos}}

Que tal finalizar sua compra agora? 🛒
{{link}}

Qualquer dúvida, estou aqui para ajudar! 😊`,
        isActive: true,
        sortOrder: 1,
      },
      {
        tenantId: tenant.id,
        name: '24 horas',
        triggerType: 'abandoned_cart' as const,
        delayMinutes: 1440,
        content: `Oi {{nome}}! 😊

Vi que você ainda não finalizou sua compra. Seus itens ainda estão te esperando:

{{produtos}}

Aproveite antes que acabe! 🎁
{{link}}`,
        isActive: true,
        sortOrder: 2,
      },
      {
        tenantId: tenant.id,
        name: '48 horas',
        triggerType: 'abandoned_cart' as const,
        delayMinutes: 2880,
        content: `Olá {{nome}}! 👋

Esta é sua última chance! Seus itens ainda estão no carrinho:

{{produtos}}

Não perca essa oportunidade! ⚡
{{link}}

Se tiver alguma dúvida, me chama! 💬`,
        isActive: true,
        sortOrder: 3,
      },
    ]

    for (const template of templates) {
      await MessageTemplate.firstOrCreate(
        {
          tenantId: template.tenantId,
          name: template.name,
        },
        template
      )
    }

    console.log('✅ Seed completo!')
    console.log('📧 Email: admin@cartback.com')
    console.log('🔑 Senha: password123')
    console.log(`🏢 Tenant: ${tenant.name} (UUID: ${tenant.uuid})`)
  }
}
