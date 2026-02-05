import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Store,
  Link as LinkIcon,
  Webhook,
  ContentCopy,
  Refresh,
  Code,
} from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { integrationsApi } from '../services/api'
import type { StoreIntegration } from '../types'
import LoadingButton from '../components/common/LoadingButton'
import ConfirmDialog from '../components/common/ConfirmDialog'

export default function Integrations() {
  const [integrations, setIntegrations] = useState<StoreIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [disconnectLoading, setDisconnectLoading] = useState(false)
  const [createWebhookLoading, setCreateWebhookLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<StoreIntegration | null>(null)

  // Custom webhook states
  const [createWebhookOpen, setCreateWebhookOpen] = useState(false)
  const [webhookDetailsOpen, setWebhookDetailsOpen] = useState(false)
  const [webhookData, setWebhookData] = useState<any>(null)
  const [newApiKey, setNewApiKey] = useState<string | null>(null)
  const [webhookForm, setWebhookForm] = useState({
    name: '',
    platformUrl: '',
  })

  const { enqueueSnackbar } = useSnackbar()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    loadIntegrations()

    // Check for successful OAuth callback
    if (searchParams.get('connected') === 'nuvemshop') {
      enqueueSnackbar('Nuvemshop conectado com sucesso!', { variant: 'success' })
      window.history.replaceState({}, '', '/integrations')
    }
  }, [searchParams])

  const loadIntegrations = async () => {
    setLoading(true)
    try {
      const res = await integrationsApi.list()
      setIntegrations(res.data.data)
    } catch (error: any) {
      if (error.response?.status !== 404) {
        enqueueSnackbar('Erro ao carregar integrações', { variant: 'error' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConnectNuvemshop = async () => {
    try {
      const res = await integrationsApi.connectNuvemshop()
      window.location.href = res.data.data.authUrl
    } catch (error: any) {
      enqueueSnackbar('Erro ao conectar com Nuvemshop', { variant: 'error' })
    }
  }

  const handleCreateCustomWebhook = async () => {
    if (!webhookForm.name.trim()) {
      enqueueSnackbar('Nome é obrigatório', { variant: 'error' })
      return
    }

    setCreateWebhookLoading(true)
    try {
      const res = await integrationsApi.createCustomWebhook({
        name: webhookForm.name,
        platformUrl: webhookForm.platformUrl || undefined,
      })

      setWebhookData(res.data.data.integration)
      setNewApiKey(res.data.data.integration.apiKey)
      setCreateWebhookOpen(false)
      setWebhookDetailsOpen(true)
      setWebhookForm({ name: '', platformUrl: '' })
      await loadIntegrations()
      enqueueSnackbar('Webhook personalizado criado!', { variant: 'success' })
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Erro ao criar webhook'
      enqueueSnackbar(message, { variant: 'error' })
    } finally {
      setCreateWebhookLoading(false)
    }
  }

  const handleViewWebhookDetails = async (integration: StoreIntegration) => {
    try {
      const res = await integrationsApi.getCustomWebhook(integration.id)
      setWebhookData(res.data.data)
      setNewApiKey(null)
      setWebhookDetailsOpen(true)
    } catch (error: any) {
      enqueueSnackbar('Erro ao carregar detalhes', { variant: 'error' })
    }
  }

  const handleRegenerateKey = async () => {
    if (!webhookData) return

    try {
      const res = await integrationsApi.regenerateCustomWebhookKey(webhookData.id)
      setNewApiKey(res.data.data.apiKey)
      enqueueSnackbar('Nova API Key gerada!', { variant: 'success' })
    } catch (error: any) {
      enqueueSnackbar('Erro ao regenerar chave', { variant: 'error' })
    }
  }

  const handleDisconnect = async () => {
    if (!selectedIntegration) return

    setDisconnectLoading(true)
    try {
      await integrationsApi.disconnect(selectedIntegration.id)
      await loadIntegrations()
      setConfirmOpen(false)
      setSelectedIntegration(null)
      enqueueSnackbar('Integração desconectada', { variant: 'success' })
    } catch (error: any) {
      enqueueSnackbar('Erro ao desconectar', { variant: 'error' })
    } finally {
      setDisconnectLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    enqueueSnackbar(`${label} copiado!`, { variant: 'success' })
  }

  const openDocsInNewTab = async () => {
    try {
      const res = await integrationsApi.getWebhookDocs()
      const docs = res.data.data

      // Create a formatted documentation page
      const docsHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>CartBack Custom Webhook Documentation</title>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 1000px;
      margin: 40px auto;
      padding: 20px;
      background: #fafafa;
      color: #333;
    }
    pre {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 15px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 14px;
      line-height: 1.5;
    }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      color: #d63384;
      font-family: 'Courier New', monospace;
    }
    h1 {
      color: #1976d2;
      border-bottom: 3px solid #1976d2;
      padding-bottom: 10px;
    }
    h2 {
      color: #2c3e50;
      margin-top: 40px;
      border-left: 4px solid #1976d2;
      padding-left: 15px;
    }
    h3 {
      color: #34495e;
      margin-top: 25px;
    }
    .warning {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .success {
      background: #d4edda;
      border-left: 4px solid #28a745;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .section {
      background: white;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background: #f8f9fa;
      font-weight: 600;
    }
    .tabs {
      display: flex;
      gap: 10px;
      margin: 20px 0;
      border-bottom: 2px solid #ddd;
    }
    .tab {
      padding: 10px 20px;
      cursor: pointer;
      border: none;
      background: none;
      font-size: 14px;
      font-weight: 500;
      color: #666;
      border-bottom: 3px solid transparent;
      transition: all 0.3s;
    }
    .tab:hover {
      color: #1976d2;
    }
    .tab.active {
      color: #1976d2;
      border-bottom-color: #1976d2;
    }
    .tab-content {
      display: none;
    }
    .tab-content.active {
      display: block;
    }
  </style>
</head>
<body>
  <h1>📡 CartBack - Documentação Webhook Personalizado</h1>

  <div class="warning">
    <strong>⚠️ IMPORTANTE:</strong> Esta integração requer <strong>2 webhooks obrigatórios</strong> para funcionar corretamente.
  </div>

  <div class="section">
    <h2>1️⃣ ${docs.abandoned_cart.title}</h2>
    <p><strong>${docs.abandoned_cart.description}</strong></p>

    <h3>Endpoint</h3>
    <pre>${docs.abandoned_cart.endpoint.replace('{tenantUuid}', 'SEU_UUID')}</pre>
    <p>URL Completa: <code>${webhookData?.webhookUrl || 'https://api.cartback.app/api/webhooks/custom/SEU_UUID'}</code></p>

    <h3>Headers Obrigatórios</h3>
    <table>
      <tr><th>Header</th><th>Valor</th></tr>
      ${Object.entries(docs.abandoned_cart.headers).map(([k, v]) =>
        `<tr><td><code>${k}</code></td><td>${v === 'cwh_your_api_key_here' ? (newApiKey || 'SUA_API_KEY') : v}</td></tr>`
      ).join('')}
    </table>

    <h3>Campos Obrigatórios</h3>
    <table>
      <tr><th>Campo</th><th>Descrição</th></tr>
      ${Object.entries(docs.abandoned_cart.required_fields).map(([k, v]) =>
        `<tr><td><code>${k}</code></td><td>${v}</td></tr>`
      ).join('')}
    </table>

    <h3>Exemplo de Payload</h3>
    <pre>${JSON.stringify(docs.abandoned_cart.example_payload, null, 2)}</pre>
  </div>

  <div class="section">
    <h2>2️⃣ ${docs.order_created.title}</h2>
    <div class="warning">
      <strong>🚨 ${docs.order_created.description}</strong>
      <p style="margin-top: 10px;">Sem este webhook, o cliente continuará recebendo mensagens mesmo após comprar!</p>
    </div>

    <h3>Endpoint</h3>
    <pre>${docs.order_created.endpoint.replace('{tenantUuid}', 'SEU_UUID')}</pre>
    <p>URL Completa: <code>${webhookData?.webhookUrl || 'https://api.cartback.app/api/webhooks/custom/SEU_UUID'}/order</code></p>

    <h3>Headers Obrigatórios</h3>
    <table>
      <tr><th>Header</th><th>Valor</th></tr>
      ${Object.entries(docs.order_created.headers).map(([k, v]) =>
        `<tr><td><code>${k}</code></td><td>${v === 'cwh_your_api_key_here' ? (newApiKey || 'SUA_API_KEY') : v}</td></tr>`
      ).join('')}
    </table>

    <h3>Campos Obrigatórios</h3>
    <table>
      <tr><th>Campo</th><th>Descrição</th></tr>
      ${Object.entries(docs.order_created.required_fields).map(([k, v]) =>
        `<tr><td><code>${k}</code></td><td>${v}</td></tr>`
      ).join('')}
    </table>

    <h3>Exemplo de Payload</h3>
    <pre>${JSON.stringify(docs.order_created.example_payload, null, 2)}</pre>
  </div>

  <div class="section">
    <h2>💻 Exemplos de Implementação</h2>

    <div class="tabs">
      <button class="tab active" onclick="showTab('nodejs')">Node.js</button>
      <button class="tab" onclick="showTab('php')">PHP</button>
      <button class="tab" onclick="showTab('python')">Python</button>
      <button class="tab" onclick="showTab('curl')">cURL</button>
    </div>

    <div id="nodejs" class="tab-content active">
      <h3>Node.js / JavaScript</h3>
      <pre>${docs.examples.nodejs.replace('YOUR_UUID', webhookData?.webhookUrl?.split('/').pop() || 'SEU_UUID')}</pre>
    </div>

    <div id="php" class="tab-content">
      <h3>PHP / Laravel</h3>
      <pre>${docs.examples.php.replace('YOUR_UUID', webhookData?.webhookUrl?.split('/').pop() || 'SEU_UUID')}</pre>
    </div>

    <div id="python" class="tab-content">
      <h3>Python / FastAPI</h3>
      <pre>${docs.examples.python.replace('YOUR_UUID', webhookData?.webhookUrl?.split('/').pop() || 'SEU_UUID')}</pre>
    </div>

    <div id="curl" class="tab-content">
      <h3>cURL (Teste Manual)</h3>
      <pre>${docs.examples.curl.replace(/YOUR_UUID/g, webhookData?.webhookUrl?.split('/').pop() || 'SEU_UUID').replace(/YOUR_API_KEY/g, newApiKey || 'SUA_API_KEY')}</pre>
    </div>
  </div>

  <div class="success">
    <h3>✅ Resumo do Fluxo Completo</h3>
    <ol>
      <li>Cliente abandona carrinho → <strong>Webhook #1</strong> (carrinho abandonado)</li>
      <li>CartBack envia mensagem WhatsApp</li>
      <li>Cliente finaliza compra → <strong>Webhook #2</strong> (pedido criado) 🚨</li>
      <li>CartBack cancela mensagens pendentes ✅</li>
    </ol>
  </div>

  <script>
    function showTab(tabId) {
      // Hide all tabs
      document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active')
      })
      document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active')
      })

      // Show selected tab
      document.getElementById(tabId).classList.add('active')
      event.target.classList.add('active')
    }
  </script>
</body>
</html>
      `

      const newWindow = window.open()
      if (newWindow) {
        newWindow.document.write(docsHtml)
        newWindow.document.close()
      }
    } catch (error) {
      enqueueSnackbar('Erro ao carregar documentação', { variant: 'error' })
    }
  }

  const nuvemshopIntegration = integrations.find((i) => i.platform === 'nuvemshop' && i.isActive)
  const customWebhookIntegration = integrations.find((i) => i.platform === 'webhook' && i.isActive)

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Integrações
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Conecte sua loja para começar a recuperar carrinhos abandonados
      </Typography>

      <Grid container spacing={3}>
        {/* Nuvemshop Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                  }}
                >
                  <Store />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Nuvemshop
                  </Typography>
                  <Chip
                    label={nuvemshopIntegration ? 'Conectado' : 'Desconectado'}
                    color={nuvemshopIntegration ? 'success' : 'default'}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Box>

              {nuvemshopIntegration && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Loja conectada:
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {nuvemshopIntegration.storeName || 'Sem nome'}
                  </Typography>
                  {nuvemshopIntegration.storeUrl && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <LinkIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography
                        variant="body2"
                        color="primary"
                        component="a"
                        href={nuvemshopIntegration.storeUrl}
                        target="_blank"
                        sx={{ textDecoration: 'none' }}
                      >
                        {nuvemshopIntegration.storeUrl}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {!nuvemshopIntegration && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Conecte sua loja Nuvemshop para começar a rastrear carrinhos abandonados e enviar
                  mensagens de recuperação via WhatsApp.
                </Typography>
              )}
            </CardContent>

            <CardActions sx={{ px: 2, pb: 2 }}>
              {nuvemshopIntegration ? (
                <LoadingButton
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    setSelectedIntegration(nuvemshopIntegration)
                    setConfirmOpen(true)
                  }}
                  loading={loading}
                  fullWidth
                >
                  Desconectar
                </LoadingButton>
              ) : (
                <LoadingButton
                  variant="contained"
                  onClick={handleConnectNuvemshop}
                  loading={loading}
                  fullWidth
                >
                  Conectar
                </LoadingButton>
              )}
            </CardActions>
          </Card>
        </Grid>

        {/* Custom Webhook Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'secondary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                  }}
                >
                  <Webhook />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Webhook Personalizado
                  </Typography>
                  <Chip
                    label={customWebhookIntegration ? 'Configurado' : 'Não configurado'}
                    color={customWebhookIntegration ? 'success' : 'default'}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Box>

              {customWebhookIntegration && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Nome:
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {customWebhookIntegration.storeName || 'Webhook Personalizado'}
                  </Typography>
                </Box>
              )}

              {!customWebhookIntegration && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Configure um webhook personalizado para integrar sua própria plataforma com o CartBack.
                  Ideal para desenvolvedores que querem implementar a integração manualmente.
                </Typography>
              )}
            </CardContent>

            <CardActions sx={{ px: 2, pb: 2 }}>
              {customWebhookIntegration ? (
                <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                  <Button
                    variant="outlined"
                    onClick={() => handleViewWebhookDetails(customWebhookIntegration)}
                    fullWidth
                  >
                    Ver Detalhes
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      setSelectedIntegration(customWebhookIntegration)
                      setConfirmOpen(true)
                    }}
                  >
                    Remover
                  </Button>
                </Box>
              ) : (
                <LoadingButton
                  variant="contained"
                  color="secondary"
                  onClick={() => setCreateWebhookOpen(true)}
                  loading={loading}
                  fullWidth
                >
                  Configurar
                </LoadingButton>
              )}
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Create Custom Webhook Dialog */}
      <Dialog open={createWebhookOpen} onClose={() => setCreateWebhookOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Criar Webhook Personalizado</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Nome da Integração"
              placeholder="Minha Loja Custom"
              value={webhookForm.name}
              onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="URL da Plataforma (opcional)"
              placeholder="https://minhaloja.com"
              value={webhookForm.platformUrl}
              onChange={(e) => setWebhookForm({ ...webhookForm, platformUrl: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateWebhookOpen(false)}>Cancelar</Button>
          <LoadingButton
            onClick={handleCreateCustomWebhook}
            variant="contained"
            loading={createWebhookLoading}
          >
            Criar
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Webhook Details Dialog */}
      <Dialog open={webhookDetailsOpen} onClose={() => setWebhookDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalhes do Webhook Personalizado
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {newApiKey && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <strong>Importante:</strong> Esta é a única vez que a API Key será exibida. Salve-a em local seguro!
              </Alert>
            )}

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Nome
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {webhookData?.name}
              </Typography>
            </Box>

            {webhookData?.platformUrl && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  URL da Plataforma
                </Typography>
                <Typography variant="body1" color="primary">
                  {webhookData.platformUrl}
                </Typography>
              </Box>
            )}

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  URL do Webhook
                </Typography>
                <Tooltip title="Copiar">
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(webhookData?.webhookUrl || '', 'URL')}
                  >
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  bgcolor: 'action.hover',
                  color: 'text.primary',
                  p: 1.5,
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {webhookData?.webhookUrl}
              </Typography>
            </Box>

            {newApiKey && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    API Key
                  </Typography>
                  <Tooltip title="Copiar">
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(newApiKey, 'API Key')}
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    bgcolor: 'warning.dark',
                    color: 'warning.contrastText',
                    p: 1.5,
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    border: '2px solid',
                    borderColor: 'warning.main',
                  }}
                >
                  {newApiKey}
                </Typography>
              </Box>
            )}

            {!newApiKey && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    API Key
                  </Typography>
                  <Tooltip title="Regenerar chave">
                    <IconButton size="small" onClick={handleRegenerateKey}>
                      <Refresh fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  A API Key atual está oculta por segurança. Clique em regenerar para criar uma nova.
                </Typography>
              </Box>
            )}

            <Button
              variant="outlined"
              startIcon={<Code />}
              onClick={openDocsInNewTab}
              fullWidth
            >
              Ver Documentação da API
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWebhookDetailsOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Disconnect Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title={`Desconectar ${selectedIntegration?.platform === 'nuvemshop' ? 'Nuvemshop' : 'Webhook'}?`}
        message="Você tem certeza que deseja desconectar? Isso vai parar o rastreamento de carrinhos abandonados."
        onConfirm={handleDisconnect}
        onCancel={() => {
          setConfirmOpen(false)
          setSelectedIntegration(null)
        }}
        loading={disconnectLoading}
        confirmText="Desconectar"
      />
    </Box>
  )
}
