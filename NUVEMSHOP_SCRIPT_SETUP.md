# 📜 Nuvemshop: Setup do Script de Detecção em Tempo Real

Guia completo para configurar o script JavaScript que detecta carrinhos abandonados em **tempo real** no checkout da Nuvemshop.

---

## 🎯 Por que usar Scripts?

**Problema:** A Nuvemshop NÃO tem webhook de carrinho abandonado. Apenas polling via API (lento).

**Solução:** Script JavaScript roda no checkout e detecta abandono **instantaneamente** (segundos vs. minutos/horas).

### Comparação:

| Método | Velocidade | Confiabilidade | Como funciona |
|--------|-----------|----------------|---------------|
| **Script JS** | ⚡ Instantâneo (1-5s) | 🟡 ~95% | Roda no checkout, detecta beforeunload |
| **Polling API** | 🐢 6-12 horas | ✅ 100% | CartBack busca API 2x/dia |
| **Híbrido (ambos)** | ⚡ Instantâneo | ✅ 100% | Script como primário, polling como backup |

**CartBack usa abordagem híbrida!**

---

## 📋 Passo a Passo

### 1️⃣ Hospedar o Script

O script já está pronto em:
```
/usr/local/var/www/vhosts/cartback/apps/api/public/nuvemshop-cart-tracker.js
```

**Opções de hospedagem:**

#### Opção A: Usar Railway (Recomendado)
- O arquivo está na pasta `public/` da API
- Acessível em: `https://api.cartback.app/nuvemshop-cart-tracker.js`
- Já está configurado e pronto

#### Opção B: CDN Externo
- Upload para Cloudflare R2, AWS S3, ou outro CDN
- Vantagem: Menor latência, cache global

---

### 2️⃣ Criar Script no Partner Portal

1. **Acesse:** https://partners.nuvemshop.com.br
2. **Vá em:** Seu App → **"Scripts"**
3. **Clique:** "Criar script"

#### Preencha os campos:

**Nome:**
```
CartBack - Abandoned Cart Detector
```

**Handle (identificador):**
```
cartback-cart-tracker
```

**Where (onde executar):**
```
✅ checkout
```
> ⚠️ Marque APENAS "checkout" (não marcar store, product, etc.)

**Event (quando executar):**
```
✅ onload
```
> Executa assim que a página carrega (melhor performance)

**Script URL (Development Mode):**
```
https://api.cartback.app/nuvemshop-cart-tracker.js
```
> Durante desenvolvimento, usar "Development mode" permite carregar de URL customizada

**Auto installed:**
```
✅ Sim (marcar checkbox)
```
> Script será automaticamente ativado para todas as lojas que instalarem o app

---

### 3️⃣ Publicar o Script

1. **Testar primeiro:**
   - Clique em "Testar em loja demo"
   - Abra o checkout de uma loja de teste
   - Verifique console do browser: deve aparecer `[CartBack] Script iniciado`

2. **Publicar:**
   - Status: **Draft** → **Testing** → **Active**
   - Clique em "Publicar versão"
   - Aguarde aprovação (se necessário)

3. **Obter Script ID:**
   - Após criar, você verá o ID do script (ex: `12345`)
   - **COPIE ESSE ID** - você vai precisar!

---

### 4️⃣ Configurar Variáveis de Ambiente

**No Railway** (service `cartback-api`):

Adicione a variável:
```bash
NUVEMSHOP_SCRIPT_ID=12345
```
> Substitua `12345` pelo ID real do script

**Outras variáveis necessárias** (se ainda não tiver):
```bash
NUVEMSHOP_APP_ID=25664
NUVEMSHOP_APP_SECRET=abc123...
NUVEMSHOP_CALLBACK_URL=https://api.cartback.app/api/integrations/nuvemshop/callback
APP_URL=https://api.cartback.app
WEB_URL=https://cartback.app
```

**Redeploy:**
- Após adicionar variáveis, faça redeploy ou aguarde deploy automático

---

### 5️⃣ Testar a Integração

#### Conectar Loja

1. Acesse: https://cartback.app
2. Vá em **Integrações**
3. Clique em **"Conectar Nuvemshop"**
4. Autorize na Nuvemshop

**O que acontece automaticamente:**
- ✅ Webhook `order/created` é criado
- ✅ Script é associado à loja (com `tenant_uuid`)
- ✅ Tudo pronto!

#### Testar Carrinho Abandonado

1. **Abra sua loja Nuvemshop**
2. **Adicione produtos** ao carrinho
3. **Vá para o checkout**
4. **Preencha:**
   - Nome: Teste CartBack
   - Email: teste@cartback.com
   - **Telefone: 5541999999999** (seu número real!)
   - CEP: 80000-000

5. **Abra DevTools** (F12)
   - Console deve mostrar: `[CartBack] Script iniciado - Tenant: abc-123`
   - Console deve mostrar: `[CartBack] Monitorando 3 campos`

6. **Feche a aba** (simula abandono)

7. **Verifique no CartBack** (https://cartback.app/carts)
   - Carrinho deve aparecer em **1-5 segundos**! ⚡
   - Mensagem WhatsApp será enviada conforme template

---

## 🔧 Como Funciona Internamente

### Fluxo Completo:

```
1. Cliente abre checkout da Nuvemshop
   ↓
2. Script JavaScript carrega automaticamente (onload)
   ↓
3. Script monitora campos: nome, email, telefone
   ↓
4. Cliente preenche dados e sai sem finalizar
   ↓
5. Script detecta beforeunload/visibilitychange
   ↓
6. Script envia POST para: /api/webhooks/nuvemshop-script/{tenant_uuid}
   ↓
7. CartBack valida tenant e integração
   ↓
8. Adiciona na fila: process-abandoned-cart
   ↓
9. Agenda mensagens WhatsApp conforme templates
   ↓
10. Cliente recebe primeira mensagem em ~1 minuto
```

### Detecção de Abandono:

O script envia dados quando:
- ✅ Usuário fecha a aba (`beforeunload`)
- ✅ Aba fica em background (`visibilitychange`)
- ✅ A cada 30 segundos (atualização)
- ✅ Quando campos perdem foco (`blur`)

### Prevenção de Duplicatas:

- Script usa debounce (2s)
- Compara dados antes de enviar
- Backend usa `externalCartId` para evitar duplicatas no banco

---

## 🐛 Troubleshooting

### Script não aparece no console

**Problema:** `[CartBack] Script iniciado` não aparece

**Verificar:**
1. Script está com status **Active** no Partner Portal?
2. Script está marcado como **Auto installed**?
3. Integração Nuvemshop está conectada no CartBack?
4. Você está no **checkout** (não na página de produto)?

**Solução:**
- Desconecte e reconecte a integração
- Verifique logs do Railway: `railway logs -s cartback-api | grep -i script`

---

### `tenant_uuid não encontrado`

**Problema:** Console mostra warning sobre tenant_uuid

**Causa:** Script não recebeu os query params

**Verificar:**
1. `NUVEMSHOP_SCRIPT_ID` está configurado no Railway?
2. OAuth callback executou `associateScript()` corretamente?
3. Logs mostram: `[Nuvemshop Callback] ✅ Script associado com sucesso!`?

**Solução:**
```bash
# Ver logs do callback OAuth
railway logs -s cartback-api | grep "Nuvemshop Callback"

# Se não tiver associado, desconecte e reconecte
```

---

### Carrinho não aparece no CartBack

**Problema:** Script executa mas carrinho não aparece no painel

**Verificar:**
1. Telefone foi preenchido? (mínimo 10 dígitos)
2. Webhook foi recebido? Ver logs:
   ```bash
   railway logs -s cartback-api | grep "Nuvemshop Script Webhook"
   ```
3. Job foi adicionado à fila?
   ```bash
   railway logs -s cartback-workers | grep "process-abandoned-cart"
   ```

**Causa comum:** Telefone muito curto ou vazio

---

### Script carrega mas dá erro 404

**Problema:** `Failed to load resource: net::ERR_NAME_NOT_RESOLVED`

**Causa:** URL do script está errada

**Verificar:**
1. Arquivo existe em: `/usr/local/var/www/vhosts/cartback/apps/api/public/nuvemshop-cart-tracker.js`
2. Railway serve arquivos da pasta `public/`?
3. URL acessível: `curl https://api.cartback.app/nuvemshop-cart-tracker.js`

**Solução:**
- Verificar se Railway expõe a pasta public
- Alternativamente, hospedar em CDN externo

---

## 📊 Monitoramento

### Ver logs do script (tempo real):

```bash
# Webhooks do script
railway logs -s cartback-api -f | grep "Script Webhook"

# Associação de scripts
railway logs -s cartback-api -f | grep "associateScript"

# Jobs processados
railway logs -s cartback-workers -f | grep "abandoned-cart"
```

### Métricas esperadas:

- **Taxa de detecção:** ~95% dos carrinhos com script, 100% com polling backup
- **Latência:** 1-5 segundos (script) vs. 6-12 horas (polling)
- **Taxa de envio:** Apenas carrinhos com telefone válido

---

## 🔐 Segurança

### Validações implementadas:

1. **Tenant UUID:** Valida que tenant existe e está ativo
2. **Integração:** Valida que Nuvemshop está conectada
3. **Telefone obrigatório:** Ignora carrinhos sem telefone
4. **Rate limiting:** Debounce de 2s, atualização máx a cada 25s
5. **Duplicatas:** ExternalCartId previne múltiplas criações

### Dados enviados:

- ✅ Nome, email, telefone (fornecidos pelo cliente)
- ✅ Items do carrinho (públicos)
- ✅ Total e moeda
- ✅ URL do checkout
- ❌ Não envia: dados de pagamento, CPF, endereço completo

---

## 📚 Referências

- **Nuvemshop Scripts:** https://tiendanube.github.io/api-documentation/resources/script
- **Partner Portal:** https://partners.nuvemshop.com.br
- **CartBack Script:** `/apps/api/public/nuvemshop-cart-tracker.js`
- **Webhook Controller:** `/apps/api/app/controllers/webhooks/nuvemshop_script_webhook_controller.ts`

---

## ✅ Checklist de Setup

- [ ] Script criado no Partner Portal com handle `cartback-cart-tracker`
- [ ] Where: `checkout` | Event: `onload` | Auto installed: `true`
- [ ] Script publicado (status: Active)
- [ ] Script ID copiado e adicionado ao Railway (`NUVEMSHOP_SCRIPT_ID`)
- [ ] Redeploy feito
- [ ] Integração Nuvemshop conectada via OAuth
- [ ] Logs mostram: "✅ Script associado com sucesso!"
- [ ] Teste no checkout: console mostra "[CartBack] Script iniciado"
- [ ] Carrinho de teste criado e apareceu no painel em segundos
- [ ] Mensagem WhatsApp recebida

---

**Pronto! Agora você tem detecção de carrinhos abandonados em TEMPO REAL! ⚡🚀**
