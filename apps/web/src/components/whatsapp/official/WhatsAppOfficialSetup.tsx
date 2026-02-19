import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Chip,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material'
import {
  CheckCircle,
  Error as ErrorIcon,
  Visibility,
  VisibilityOff,
  Refresh,
  Delete,
  PhoneAndroid,
  ContentCopy,
} from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { whatsappOfficialApi } from '../../../services/api'
import type { WhatsAppOfficialCredential } from '../../../types'
import { useAuth } from '../../../contexts/AuthContext'
import LoadingButton from '../../common/LoadingButton'
import ConfirmDialog from '../../common/ConfirmDialog'
import WhatsAppOfficialLogs from './WhatsAppOfficialLogs'
import { useNavigate } from 'react-router-dom'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
      {value === index && children}
    </Box>
  )
}

export default function WhatsAppOfficialSetup() {
  const [tab, setTab] = useState(0)
  const [credential, setCredential] = useState<WhatsAppOfficialCredential | null>(null)
  const [configured, setConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showToken, setShowToken] = useState(false)

  // Campos do formulário
  const [form, setForm] = useState({
    phoneNumberId: '',
    wabaId: '',
    accessToken: '',
    webhookVerifyToken: '',
  })

  const { enqueueSnackbar } = useSnackbar()
  const { tenant } = useAuth()
  const navigate = useNavigate()

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333/api'
  const webhookUrl = `${apiUrl}/webhooks/whatsapp-official/${tenant?.uuid ?? ''}`

  useEffect(() => {
    loadCredentials()
  }, [])

  const loadCredentials = async () => {
    setLoading(true)
    try {
      const res = await whatsappOfficialApi.getCredentials()
      setConfigured(res.data.data.configured)
      setCredential(res.data.data.credential)

      if (res.data.data.credential) {
        const c = res.data.data.credential
        setForm({
          phoneNumberId: c.phoneNumberId,
          wabaId: c.wabaId,
          accessToken: '',
          webhookVerifyToken: c.webhookVerifyToken,
        })
      }
    } catch (error: any) {
      enqueueSnackbar('Erro ao carregar credenciais', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!form.phoneNumberId || !form.wabaId || !form.accessToken || !form.webhookVerifyToken) {
      enqueueSnackbar('Preencha todos os campos obrigatórios', { variant: 'warning' })
      return
    }

    setSaving(true)
    try {
      const res = await whatsappOfficialApi.saveCredentials(form)
      enqueueSnackbar(res.data.data?.message || 'Credenciais salvas com sucesso!', { variant: 'success' })
      await loadCredentials()
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || 'Erro ao salvar credenciais'
      enqueueSnackbar(msg, { variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleVerify = async () => {
    setVerifying(true)
    try {
      const res = await whatsappOfficialApi.verifyCredentials()
      if (res.data.data.valid) {
        enqueueSnackbar(`Credenciais válidas! Número: ${res.data.data.phoneNumber || 'N/A'}`, { variant: 'success' })
        await loadCredentials()
      } else {
        enqueueSnackbar(`Credenciais inválidas: ${res.data.data.error}`, { variant: 'error' })
      }
    } catch (error: any) {
      enqueueSnackbar('Erro ao verificar credenciais', { variant: 'error' })
    } finally {
      setVerifying(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await whatsappOfficialApi.deleteCredentials()
      enqueueSnackbar('Credenciais removidas', { variant: 'success' })
      setConfigured(false)
      setCredential(null)
      setForm({ phoneNumberId: '', wabaId: '', accessToken: '', webhookVerifyToken: '' })
      setConfirmDelete(false)
    } catch (error: any) {
      enqueueSnackbar('Erro ao remover credenciais', { variant: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    enqueueSnackbar('Copiado para a área de transferência!', { variant: 'info' })
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Status da Conexão */}
      {configured && credential && (
        <>
          <Card sx={{ mb: 3, border: '1px solid', borderColor: credential.status === 'active' ? 'success.main' : 'error.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {credential.status === 'active' ? (
                    <CheckCircle color="success" sx={{ fontSize: 40 }} />
                  ) : (
                    <ErrorIcon color="error" sx={{ fontSize: 40 }} />
                  )}
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {credential.displayName || 'API Oficial Configurada'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <PhoneAndroid sx={{ fontSize: 16 }} />
                      <Typography variant="body2" color="text.secondary">
                        {credential.phoneNumber || 'Número não disponível'}
                      </Typography>
                      <Chip
                        label={credential.status === 'active' ? 'Ativo' : credential.status === 'error' ? 'Erro' : 'Inativo'}
                        color={credential.status === 'active' ? 'success' : credential.status === 'error' ? 'error' : 'default'}
                        size="small"
                      />
                    </Box>
                    {credential.lastError && (
                      <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block' }}>
                        Erro: {credential.lastError}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <LoadingButton
                    variant="outlined"
                    size="small"
                    startIcon={<Refresh />}
                    onClick={handleVerify}
                    loading={verifying}
                  >
                    Verificar
                  </LoadingButton>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<Delete />}
                    onClick={() => setConfirmDelete(true)}
                  >
                    Remover
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Token Expiration Warning */}
          {credential.tokenExpiresAt && (() => {
            const expiresAt = new Date(credential.tokenExpiresAt)
            const now = new Date()
            const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            const isExpired = daysUntilExpiry <= 0
            const isNearExpiry = daysUntilExpiry > 0 && daysUntilExpiry <= 7

            if (isExpired) {
              return (
                <Alert severity="error" sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    ⚠️ Token de Acesso Expirado
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Seu token de acesso expirou em {expiresAt.toLocaleDateString('pt-BR')}.
                    Gere um novo token permanente (System User) no Meta Business Manager e atualize suas credenciais.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    href="https://business.facebook.com/settings/system-users"
                    target="_blank"
                    sx={{ mt: 1 }}
                  >
                    Gerar Token Permanente
                  </Button>
                </Alert>
              )
            }

            if (isNearExpiry) {
              return (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    ⚠️ Token de Acesso Próximo da Expiração
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Seu token expira em {daysUntilExpiry} dia(s) ({expiresAt.toLocaleDateString('pt-BR')}).
                    Recomendamos gerar um token permanente (System User) para evitar interrupções.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    color="warning"
                    href="https://business.facebook.com/settings/system-users"
                    target="_blank"
                    sx={{ mt: 1 }}
                  >
                    Gerar Token Permanente
                  </Button>
                </Alert>
              )
            }

            return null
          })()}

          {!credential.tokenExpiresAt && credential.status === 'active' && (
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body2">
                ✅ Token Permanente Detectado - Seu token não possui data de expiração (System User Token).
              </Typography>
            </Alert>
          )}
        </>
      )}

      {/* Abas quando configurado */}
      {configured && (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab label="Configurações" />
              <Tab label="Logs de Disparos" />
            </Tabs>
          </Box>

          <TabPanel value={tab} index={0}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                📝 Templates Unificados
              </Typography>
              <Typography variant="body2" gutterBottom>
                Os templates agora são gerenciados em uma interface única que funciona tanto para
                Evolution API quanto para Meta WhatsApp API Oficial.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/templates')}
                sx={{ mt: 1 }}
              >
                Ir para Templates
              </Button>
            </Alert>

            <CredentialsForm
              form={form}
              setForm={setForm}
              showToken={showToken}
              setShowToken={setShowToken}
              saving={saving}
              configured={configured}
              onSave={handleSave}
              webhookUrl={webhookUrl}
              onCopy={copyToClipboard}
            />
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <WhatsAppOfficialLogs />
          </TabPanel>
        </>
      )}

      {/* Formulário quando não configurado */}
      {!configured && (
        <CredentialsForm
          form={form}
          setForm={setForm}
          showToken={showToken}
          setShowToken={setShowToken}
          saving={saving}
          configured={configured}
          onSave={handleSave}
          webhookUrl={webhookUrl}
          onCopy={copyToClipboard}
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Remover credenciais?"
        message="Isso irá remover as credenciais da API Oficial. Os templates e logs serão mantidos. Deseja continuar?"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={deleting}
        confirmText="Remover"
      />
    </Box>
  )
}

interface CredentialsFormProps {
  form: { phoneNumberId: string; wabaId: string; accessToken: string; webhookVerifyToken: string }
  setForm: (f: any) => void
  showToken: boolean
  setShowToken: (v: boolean) => void
  saving: boolean
  configured: boolean
  onSave: () => void
  webhookUrl: string
  onCopy: (text: string) => void
}

function CredentialsForm({
  form,
  setForm,
  showToken,
  setShowToken,
  saving,
  configured,
  onSave,
  webhookUrl,
  onCopy,
}: CredentialsFormProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {configured ? 'Atualizar Credenciais' : 'Configurar API Oficial do WhatsApp'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Insira as credenciais da sua conta no Meta Business Platform. Acesse{' '}
          <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer">
            developers.facebook.com
          </a>{' '}
          para obter as credenciais.
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            URL do Webhook para configurar no Meta:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', flexGrow: 1 }}>
              {webhookUrl}
            </Typography>
            <IconButton size="small" onClick={() => onCopy(webhookUrl)}>
              <ContentCopy fontSize="small" />
            </IconButton>
          </Box>
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone Number ID"
              value={form.phoneNumberId}
              onChange={(e) => setForm((f: any) => ({ ...f, phoneNumberId: e.target.value }))}
              placeholder="Ex: 123456789012345"
              helperText="ID do número de telefone no Meta Developer"
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="WhatsApp Business Account ID (WABA ID)"
              value={form.wabaId}
              onChange={(e) => setForm((f: any) => ({ ...f, wabaId: e.target.value }))}
              placeholder="Ex: 123456789012345"
              helperText="ID da sua conta WhatsApp Business"
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Access Token (Token de Acesso)"
              value={form.accessToken}
              onChange={(e) => setForm((f: any) => ({ ...f, accessToken: e.target.value }))}
              type={showToken ? 'text' : 'password'}
              placeholder={configured ? 'Deixe em branco para manter o token atual' : 'Cole o token de acesso permanente'}
              helperText={
                configured
                  ? 'Deixe em branco para não alterar o token atual'
                  : 'Token de acesso permanente (permanent token) da sua App no Meta'
              }
              required={!configured}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowToken(!showToken)} edge="end">
                      {showToken ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Webhook Verify Token"
              value={form.webhookVerifyToken}
              onChange={(e) => setForm((f: any) => ({ ...f, webhookVerifyToken: e.target.value }))}
              placeholder="Ex: meu_token_secreto_123"
              helperText="Token secreto para verificação do webhook. Use o mesmo valor configurado no Meta Developer."
              required
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <LoadingButton
            variant="contained"
            onClick={onSave}
            loading={saving}
            size="large"
          >
            {configured ? 'Atualizar Credenciais' : 'Salvar e Verificar Credenciais'}
          </LoadingButton>
        </Box>
      </CardContent>
    </Card>
  )
}
