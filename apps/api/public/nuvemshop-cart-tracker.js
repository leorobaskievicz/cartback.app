/**
 * CartBack - Nuvemshop Abandoned Cart Tracker
 *
 * Este script detecta quando um cliente preenche dados no checkout
 * e abandona sem finalizar a compra.
 *
 * Configuração no Partner Portal:
 * - Where: checkout
 * - Event: onload
 * - Auto installed: true
 */

(function() {
  'use strict';

  // === CONFIGURAÇÃO ===
  const CARTBACK_API_URL = 'https://api.cartback.app';
  const MIN_PHONE_LENGTH = 10; // Mínimo de dígitos para considerar telefone válido
  const DEBOUNCE_TIME = 2000; // 2 segundos de debounce

  // Obter tenantUuid dos query params (passado via API na associação do script)
  const urlParams = new URLSearchParams(window.location.search);
  const TENANT_UUID = urlParams.get('tenant_uuid');

  if (!TENANT_UUID) {
    console.warn('[CartBack] tenant_uuid não encontrado nos parâmetros');
    return;
  }

  console.log('[CartBack] Script iniciado - Tenant:', TENANT_UUID);

  // === ESTADO ===
  let lastSentData = null;
  let debounceTimer = null;
  let dataCollectedAt = null;

  // === FUNÇÕES AUXILIARES ===

  /**
   * Normaliza telefone removendo caracteres especiais
   */
  function normalizePhone(phone) {
    if (!phone) return null;
    return phone.replace(/\D/g, ''); // Remove tudo que não é número
  }

  /**
   * Coleta dados do checkout
   */
  function collectCheckoutData() {
    try {
      // Acessar dados do carrinho via LS object (fornecido pela Nuvemshop)
      const cart = window.LS?.cart || {};
      const checkout = window.LS?.checkout || {};

      // Coletar dados do formulário
      const nameField = document.querySelector('[name="name"]') ||
                       document.querySelector('[name="first_name"]') ||
                       document.querySelector('#name');

      const emailField = document.querySelector('[name="email"]') ||
                        document.querySelector('#email');

      const phoneField = document.querySelector('[name="phone"]') ||
                        document.querySelector('[name="celular"]') ||
                        document.querySelector('#phone');

      const customerName = nameField?.value?.trim() || checkout.contact_name || null;
      const customerEmail = emailField?.value?.trim() || checkout.contact_email || null;
      const rawPhone = phoneField?.value?.trim() || checkout.contact_phone || null;
      const customerPhone = normalizePhone(rawPhone);

      // Validar se tem os dados mínimos
      if (!customerPhone || customerPhone.length < MIN_PHONE_LENGTH) {
        return null; // Sem telefone válido, não envia
      }

      // Montar payload
      return {
        // Identificação
        tenant_uuid: TENANT_UUID,
        store_id: window.LS?.store?.id || null,
        checkout_id: cart.id || checkout.id || null,

        // Cliente
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,

        // Carrinho
        cart_url: window.location.href,
        total_value: parseFloat(cart.total || checkout.total || 0),
        currency: cart.currency || 'BRL',

        // Items
        items: (cart.items || []).map(item => ({
          id: item.product_id || item.id,
          variant_id: item.variant_id,
          name: item.name || item.product_name,
          price: parseFloat(item.price || 0),
          quantity: parseInt(item.quantity || 1),
          image_url: item.image?.src || item.image || null
        })),

        // Metadados
        page_url: window.location.href,
        page_title: document.title,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[CartBack] Erro ao coletar dados:', error);
      return null;
    }
  }

  /**
   * Verifica se dados mudaram significativamente
   */
  function dataChanged(newData) {
    if (!lastSentData) return true;

    return (
      lastSentData.customer_phone !== newData.customer_phone ||
      lastSentData.customer_email !== newData.customer_email ||
      lastSentData.total_value !== newData.total_value
    );
  }

  /**
   * Envia dados para CartBack
   */
  function sendToCartBack(data) {
    if (!data) return;

    // Evitar envios duplicados
    if (!dataChanged(data)) {
      console.log('[CartBack] Dados não mudaram, ignorando envio');
      return;
    }

    const webhookUrl = `${CARTBACK_API_URL}/api/webhooks/nuvemshop-script/${TENANT_UUID}`;

    // Usar sendBeacon para garantir envio mesmo ao fechar aba
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const sent = navigator.sendBeacon(webhookUrl, blob);

    if (sent) {
      console.log('[CartBack] Dados enviados com sucesso');
      lastSentData = data;
      dataCollectedAt = new Date();
    } else {
      console.warn('[CartBack] Falha ao enviar via sendBeacon, tentando fetch...');

      // Fallback: usar fetch com keepalive
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true // Mantém request mesmo ao fechar aba
      }).catch(err => {
        console.error('[CartBack] Erro ao enviar:', err);
      });
    }
  }

  /**
   * Tenta enviar com debounce
   */
  function trySendDebounced() {
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
      const data = collectCheckoutData();
      if (data) {
        sendToCartBack(data);
      }
    }, DEBOUNCE_TIME);
  }

  // === EVENT LISTENERS ===

  /**
   * Monitora mudanças nos campos
   */
  function attachFieldListeners() {
    const fields = document.querySelectorAll(
      '[name="name"], [name="first_name"], [name="email"], [name="phone"], [name="celular"], #name, #email, #phone'
    );

    fields.forEach(field => {
      field.addEventListener('blur', trySendDebounced);
      field.addEventListener('change', trySendDebounced);
    });

    console.log(`[CartBack] Monitorando ${fields.length} campos`);
  }

  /**
   * Detecta abandono (usuário saindo da página)
   */
  window.addEventListener('beforeunload', function() {
    const data = collectCheckoutData();
    if (data) {
      sendToCartBack(data);
    }
  });

  /**
   * Detecta visibilidade da página (aba em background)
   */
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      const data = collectCheckoutData();
      if (data) {
        sendToCartBack(data);
      }
    }
  });

  // === INICIALIZAÇÃO ===

  // Aguardar DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachFieldListeners);
  } else {
    attachFieldListeners();
  }

  // Envio periódico (a cada 30 segundos enquanto estiver no checkout)
  setInterval(function() {
    const data = collectCheckoutData();
    if (data && dataCollectedAt) {
      const secondsSinceLastSend = (new Date() - dataCollectedAt) / 1000;

      // Só envia se passou mais de 25 segundos desde o último envio
      if (secondsSinceLastSend > 25) {
        sendToCartBack(data);
      }
    }
  }, 30000);

  console.log('[CartBack] Monitoramento de abandono ativado ✅');
})();
