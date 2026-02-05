/**
 * Script de teste manual para o sistema de filas
 *
 * Para executar:
 * 1. Certifique-se que Redis está rodando: docker compose up -d redis
 * 2. Execute: node ace run test_queues.ts
 */

import queueService from '#jobs/queue_service'
import Tenant from '#models/tenant'
import WhatsappInstance from '#models/whatsapp_instance'
import MessageTemplate from '#models/message_template'

async function testQueueSystem() {
  console.log('🧪 Testando sistema de filas...\n')

  try {
    // 1. Verificar estatísticas das filas
    console.log('1️⃣ Verificando estatísticas das filas...')

    const queues = ['process-abandoned-cart', 'send-whatsapp-message', 'check-cart-recovered']

    for (const queueName of queues) {
      const stats = await queueService.getQueueStats(queueName)
      console.log(`   📊 ${queueName}:`)
      console.log(`      - Aguardando: ${stats.waiting}`)
      console.log(`      - Ativos: ${stats.active}`)
      console.log(`      - Agendados: ${stats.delayed}`)
      console.log(`      - Completados: ${stats.completed}`)
      console.log(`      - Falhados: ${stats.failed}`)
      console.log('')
    }

    // 2. Buscar tenant de teste
    console.log('2️⃣ Buscando tenant de teste...')
    const tenant = await Tenant.query().first()

    if (!tenant) {
      console.log('   ❌ Nenhum tenant encontrado. Execute as migrations e seed primeiro.')
      return
    }

    console.log(`   ✅ Tenant encontrado: ${tenant.name} (ID: ${tenant.id})`)

    // 3. Verificar WhatsApp
    console.log('\n3️⃣ Verificando WhatsApp...')
    const whatsapp = await WhatsappInstance.query()
      .where('tenant_id', tenant.id)
      .where('status', 'connected')
      .first()

    if (!whatsapp) {
      console.log('   ⚠️  Tenant não tem WhatsApp conectado')
      console.log('   💡 Conecte um WhatsApp antes de testar envio de mensagens')
    } else {
      console.log(`   ✅ WhatsApp conectado: ${whatsapp.instanceName}`)
    }

    // 4. Verificar templates
    console.log('\n4️⃣ Verificando templates...')
    const templates = await MessageTemplate.query()
      .where('tenant_id', tenant.id)
      .where('trigger_type', 'abandoned_cart')
      .where('is_active', true)

    if (templates.length === 0) {
      console.log('   ⚠️  Nenhum template ativo encontrado')
      console.log('   💡 Crie templates antes de testar')
    } else {
      console.log(`   ✅ ${templates.length} template(s) ativo(s):`)
      templates.forEach((t) => {
        console.log(`      - "${t.name}" (delay: ${t.delayMinutes}min)`)
      })
    }

    // 5. Simular carrinho abandonado (apenas adiciona à fila, não envia)
    console.log('\n5️⃣ Simulando carrinho abandonado...')

    const testCartData = {
      tenantId: tenant.id,
      storeIntegrationId: 1,
      externalCartId: `test_cart_${Date.now()}`,
      customerName: 'João Teste',
      customerEmail: 'joao@teste.com',
      customerPhone: '5511999999999',
      cartUrl: 'https://exemplo.com/checkout/abc123',
      totalValue: 199.9,
      items: [
        {
          id: '1',
          name: 'Camiseta Preta',
          quantity: 1,
          price: 99.9,
        },
        {
          id: '2',
          name: 'Calça Jeans',
          quantity: 1,
          price: 100.0,
        },
      ],
    }

    const job = await queueService.addJob('process-abandoned-cart', testCartData)

    console.log(`   ✅ Carrinho adicionado à fila (Job ID: ${job.id})`)
    console.log(`      - Cliente: ${testCartData.customerName}`)
    console.log(`      - Telefone: ${testCartData.customerPhone}`)
    console.log(`      - Valor: R$ ${testCartData.totalValue}`)
    console.log(`      - Produtos: ${testCartData.items.length} item(s)`)

    // 6. Aguardar processamento
    console.log('\n6️⃣ Aguardando processamento...')
    console.log(`   ⏳ Job ID: ${job.id} - aguarde alguns segundos...`)
    await new Promise((resolve) => setTimeout(resolve, 5000))

    console.log('   ✅ Processamento iniciado! Verifique os logs acima.')

    // 7. Verificar estatísticas finais
    console.log('\n7️⃣ Estatísticas finais:')

    for (const queueName of queues) {
      const stats = await queueService.getQueueStats(queueName)
      if (stats.total > 0 || stats.completed > 0 || stats.failed > 0) {
        console.log(`   📊 ${queueName}:`)
        console.log(
          `      Total: ${stats.total} | Completados: ${stats.completed} | Falhados: ${stats.failed}`
        )
      }
    }

    console.log('\n✅ Teste concluído!')
    console.log('\n📝 Próximos passos:')
    console.log('   1. Verifique os logs acima para mensagens agendadas')
    console.log('   2. Aguarde o delay dos templates para ver mensagens sendo enviadas')
    console.log('   3. Verifique a tabela abandoned_carts no banco')
    console.log('   4. Verifique a tabela message_logs no banco')
    console.log('\n💡 Dica: Use o Bull Board para monitorar as filas visualmente')
  } catch (error: any) {
    console.error('\n❌ Erro durante os testes:', error.message)

    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Dica: Verifique se o Redis está rodando:')
      console.error('   docker compose ps redis')
      console.error('   docker compose up -d redis')
    }

    throw error
  }
}

// Executar testes
testQueueSystem()
  .then(() => {
    console.log('\n✅ Script finalizado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script falhou:', error)
    process.exit(1)
  })
