/**
 * Script de teste manual para Evolution API
 *
 * Para executar:
 * 1. Certifique-se que o Docker está rodando: docker compose up -d
 * 2. Execute: node ace run test_evolution.ts
 */

import evolutionApiService from '#services/evolution_api_service'

async function testEvolutionApi() {
  console.log('🧪 Testando integração com Evolution API...\n')

  try {
    // 1. Health Check
    console.log('1️⃣ Testando conexão com Evolution API...')
    const isHealthy = await evolutionApiService.healthCheck()
    console.log(`   ✅ Health check: ${isHealthy ? 'OK' : 'FALHOU'}`)

    if (!isHealthy) {
      console.log('   ❌ Evolution API não está respondendo. Verifique se o Docker está rodando.')
      return
    }

    // 2. Server Info
    console.log('\n2️⃣ Buscando informações do servidor...')
    const serverInfo = await evolutionApiService.getServerInfo()
    console.log('   ✅ Servidor:', JSON.stringify(serverInfo, null, 2))

    // 3. Listar instâncias existentes
    console.log('\n3️⃣ Listando instâncias existentes...')
    const instances = await evolutionApiService.fetchAllInstances()
    console.log(`   ✅ Total de instâncias: ${instances.length}`)

    if (instances.length > 0) {
      instances.forEach((instance) => {
        console.log(
          `      - ${instance.instanceName} (status: ${instance.status}, número: ${instance.number || 'N/A'})`
        )
      })
    }

    // 4. Criar instância de teste
    const testInstanceName = `test_${Date.now()}`
    console.log(`\n4️⃣ Criando instância de teste: ${testInstanceName}...`)

    const createResult = await evolutionApiService.createInstance(testInstanceName, {
      qrcode: true,
      webhookUrl: 'http://localhost:3333/api/whatsapp/webhook',
      webhookByEvents: true,
      webhookEvents: ['CONNECTION_UPDATE', 'QRCODE_UPDATED', 'MESSAGES_UPSERT'],
    })

    console.log('   ✅ Instância criada com sucesso!')
    console.log(`      Instance Name: ${createResult.instance.instanceName}`)
    console.log(`      Status: ${createResult.instance.status}`)

    if (createResult.qrcode) {
      console.log(`      QR Code disponível: ${createResult.qrcode.base64.substring(0, 50)}...`)
    }

    // 5. Buscar QR Code
    console.log('\n5️⃣ Buscando QR Code da instância...')
    const qrCodeData = await evolutionApiService.getQrCode(testInstanceName)

    if (qrCodeData) {
      console.log('   ✅ QR Code obtido com sucesso!')
      console.log(`      Base64: ${qrCodeData.base64.substring(0, 50)}...`)
      console.log(`      Code: ${qrCodeData.code.substring(0, 50)}...`)
    } else {
      console.log('   ⚠️  QR Code não disponível (pode já estar conectado)')
    }

    // 6. Verificar estado da conexão
    console.log('\n6️⃣ Verificando estado da conexão...')
    const connectionState = await evolutionApiService.getConnectionState(testInstanceName)
    console.log(`   ✅ Estado: ${connectionState.state}`)

    // 7. Buscar informações da instância
    console.log('\n7️⃣ Buscando informações detalhadas da instância...')
    const instanceInfo = await evolutionApiService.fetchInstance(testInstanceName)

    if (instanceInfo) {
      console.log('   ✅ Instância encontrada!')
      console.log(`      Name: ${instanceInfo.instanceName}`)
      console.log(`      Status: ${instanceInfo.status}`)
      console.log(`      Número: ${instanceInfo.number || 'N/A'}`)
    }

    // 8. Limpar: deletar instância de teste
    console.log(`\n8️⃣ Deletando instância de teste: ${testInstanceName}...`)
    await evolutionApiService.deleteInstance(testInstanceName)
    console.log('   ✅ Instância deletada com sucesso!')

    console.log('\n✅ Todos os testes passaram com sucesso!')
    console.log('\n📝 Próximos passos:')
    console.log('   1. Conecte uma instância real escaneando o QR code')
    console.log('   2. Teste o envio de mensagens com sendText()')
    console.log('   3. Verifique os webhooks em /api/whatsapp/webhook')
  } catch (error: any) {
    console.error('\n❌ Erro durante os testes:', error.message)

    if (error.response) {
      console.error('   Status:', error.response.status)
      console.error('   Data:', JSON.stringify(error.response.data, null, 2))
    }

    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Dica: Verifique se a Evolution API está rodando:')
      console.error('   docker compose ps')
      console.error('   docker compose up -d evolution')
    }
  }
}

// Executar testes
testEvolutionApi()
