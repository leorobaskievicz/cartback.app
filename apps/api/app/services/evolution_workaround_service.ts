import evolutionApi from '#services/evolution_api_service'

/**
 * Workarounds para bugs conhecidos do Evolution API
 */
class EvolutionWorkaroundService {
  /**
   * Envia mensagem com retry e limpeza de sessão em caso de erro
   * Workaround para Issue #2272 - "SessionError: No sessions" em números específicos
   */
  async sendTextWithRetry(
    instanceName: string,
    phone: string,
    message: string,
    maxRetries: number = 3
  ): Promise<any> {
    let lastError: any = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Evolution Workaround] Tentativa ${attempt}/${maxRetries} para ${phone}`)

        // Tentar enviar normalmente
        const result = await evolutionApi.sendText(instanceName, phone, message)

        console.log(`[Evolution Workaround] ✅ Sucesso na tentativa ${attempt}`)
        return result
      } catch (error: any) {
        lastError = error

        // Verificar se é o erro de SessionError
        const isSessionError =
          error.message?.includes('SessionError') || error.message?.includes('No sessions')

        console.log(
          `[Evolution Workaround] ❌ Falha na tentativa ${attempt}: ${error.message}`
        )

        if (isSessionError && attempt < maxRetries) {
          // Aguardar progressivamente mais tempo
          const delayMs = 1000 * Math.pow(2, attempt - 1) // 1s, 2s, 4s...

          console.log(
            `[Evolution Workaround] SessionError detectado, aguardando ${delayMs}ms antes de retry...`
          )

          await new Promise((resolve) => setTimeout(resolve, delayMs))

          // Nota: Idealmente aqui faríamos uma limpeza de sessão via Evolution API
          // mas a API pública não tem endpoint para isso
        } else if (!isSessionError) {
          // Se não é SessionError, não vale a pena retry
          console.log(
            `[Evolution Workaround] Erro não é SessionError, abortando retry`
          )
          throw error
        }
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    console.log(
      `[Evolution Workaround] ❌ Todas as ${maxRetries} tentativas falharam para ${phone}`
    )
    throw lastError
  }

  /**
   * Verifica se um erro é o bug conhecido "SessionError: No sessions"
   */
  isSessionErrorBug(error: any): boolean {
    const errorMessage = error.message?.toLowerCase() || ''
    const errorResponse = JSON.stringify(error.response?.data || '').toLowerCase()

    return (
      errorMessage.includes('sessionerror') ||
      errorMessage.includes('no sessions') ||
      errorResponse.includes('sessionerror') ||
      errorResponse.includes('no sessions')
    )
  }

  /**
   * Gera mensagem de erro amigável para o usuário
   */
  getFriendlyErrorMessage(error: any, phone: string): string {
    if (this.isSessionErrorBug(error)) {
      return `Não foi possível enviar mensagem para ${phone}. Este é um problema conhecido do servidor WhatsApp (SessionError). Tente novamente em alguns minutos ou entre em contato manualmente com este cliente.`
    }

    return error.message || 'Erro desconhecido ao enviar mensagem'
  }
}

export default new EvolutionWorkaroundService()
