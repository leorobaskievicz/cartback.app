/**
 * Utilitário para adicionar parâmetros UTM de tracking
 * Permite rastreamento de conversões no Google Analytics
 */

/**
 * Adiciona parâmetros UTM ao cart_url se não existirem
 *
 * @param url - URL do carrinho
 * @param templateName - Nome do template para utm_campaign
 * @returns URL com parâmetros UTM adicionados
 */
export function addUtmTracking(url: string | null, templateName: string): string {
  if (!url) return ''

  try {
    const urlObj = new URL(url)

    // Verificar se já tem parâmetros UTM
    const hasUtm =
      urlObj.searchParams.has('utm_source') ||
      urlObj.searchParams.has('utm_medium') ||
      urlObj.searchParams.has('utm_campaign')

    // Se já tem UTM, não modificar (respeitar UTMs customizados)
    if (hasUtm) {
      return url
    }

    // Adicionar parâmetros UTM para tracking
    urlObj.searchParams.set('utm_source', 'cartback')
    urlObj.searchParams.set('utm_medium', 'whatsapp')

    // Usar nome do template como utm_campaign (sanitizado)
    const campaignName = sanitizeTemplateName(templateName)
    urlObj.searchParams.set('utm_campaign', campaignName)

    return urlObj.toString()
  } catch (error) {
    // Se URL for inválida, retornar original
    console.warn(`[UTM Tracking] URL inválida: ${url}`)
    return url
  }
}

/**
 * Sanitiza o nome do template para usar como utm_campaign
 * Remove caracteres especiais e converte para formato URL-friendly
 */
function sanitizeTemplateName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD') // Decompor caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9]+/g, '_') // Substituir caracteres especiais por _
    .replace(/^_+|_+$/g, '') // Remover _ do início/fim
    .substring(0, 50) // Limitar tamanho
}
