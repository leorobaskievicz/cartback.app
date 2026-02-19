import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Skeleton,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
} from '@mui/material'
import {
  QrCode,
  CheckCircle,
  PhoneAndroid,
  Sync,
  VerifiedUser,
  Info,
} from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { whatsappApi } from '../services/api'
import type { WhatsAppInstance } from '../types'
import LoadingButton from '../components/common/LoadingButton'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import WhatsAppOfficialSetup from '../components/whatsapp/official/WhatsAppOfficialSetup'

type ApiMode = 'unofficial' | 'official'

const API_MODE_KEY = 'whatsapp_api_mode'

export default function WhatsApp() {
  const [apiMode, setApiMode] = useState<ApiMode>(() => {
    return (localStorage.getItem(API_MODE_KEY) as ApiMode) || 'unofficial'
  })

  const handleApiModeChange = (_: React.MouseEvent<HTMLElement>, newMode: ApiMode | null) => {
    if (newMode) {
      setApiMode(newMode)
      localStorage.setItem(API_MODE_KEY, newMode)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            WhatsApp
          </Typography>
          <Typography color="text.secondary">
            Configure seu WhatsApp para enviar mensagens de recuperação de carrinhos
          </Typography>
        </Box>
      </Box>

      {/* Seletor de API */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Escolha o tipo de integração:
          </Typography>

          <ToggleButtonGroup
            value={apiMode}
            exclusive
            onChange={handleApiModeChange}
            sx={{ mb: 2 }}
          >
            <ToggleButton value="unofficial" sx={{ px: 3, py: 1.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <QrCode fontSize="small" />
                  <Typography variant="body2" fontWeight={600}>API Não Oficial</Typography>
                  <Chip label="Evolution API" size="small" color="primary" />
                </Box>
                <Typography variant="caption" color="text.secondary" align="left">
                  Conecte via QR Code. Mais fácil, sem aprovação.
                </Typography>
              </Box>
            </ToggleButton>
            <ToggleButton value="official" sx={{ px: 3, py: 1.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VerifiedUser fontSize="small" />
                  <Typography variant="body2" fontWeight={600}>API Oficial</Typography>
                  <Chip label="Meta Business" size="small" color="success" />
                </Box>
                <Typography variant="caption" color="text.secondary" align="left">
                  Via Meta Business Platform. Mais confiável e escalável.
                </Typography>
              </Box>
            </ToggleButton>
          </ToggleButtonGroup>

          <Divider sx={{ my: 2 }} />

          {apiMode === 'unofficial' ? (
            <Alert severity="info" icon={<Info />}>
              <Typography variant="body2">
                <strong>API Não Oficial (Evolution API):</strong> Conecte um número WhatsApp pessoal ou comercial via QR Code.
                Ideal para quem está começando. Não requer conta na Meta Business Platform.
              </Typography>
            </Alert>
          ) : (
            <Alert severity="success" icon={<VerifiedUser />}>
              <Typography variant="body2">
                <strong>API Oficial (Meta Business):</strong> Integração direta com a Meta via WhatsApp Business Platform.
                Requer conta verificada no Meta Business e templates aprovados. Mais estável, sem risco de banimento.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Conteúdo da API selecionada */}
      {apiMode === 'unofficial' ? (
        <UnofficialApiSection />
      ) : (
        <WhatsAppOfficialSetup />
      )}
    </Box>
  )
}

// ==============================
// Seção da API Não Oficial (Evolution)
// ==============================

function UnofficialApiSection() {
  const [instance, setInstance] = useState<WhatsAppInstance | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrCodeWasShown, setQrCodeWasShown] = useState(false)
  const [loading, setLoading] = useState(true)
  const [disconnectLoading, setDisconnectLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    loadInstance()
  }, [])

  useEffect(() => {
    if (!instance || instance.status !== 'connected') {
      const interval = setInterval(() => {
        pollStatus()
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [instance])

  const loadInstance = async () => {
    setLoading(true)
    try {
      const res = await whatsappApi.status()
      const instanceData = res.data.data.instance
      setInstance(instanceData)
      if (instanceData && instanceData.status !== 'connected') {
        await loadQrCode()
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        enqueueSnackbar('Erro ao carregar instância do WhatsApp', { variant: 'error' })
      }
    } finally {
      setLoading(false)
    }
  }

  const loadQrCode = async () => {
    try {
      const res = await whatsappApi.qrcode()
      const newQrCode = res.data.data.qrCode
      setQrCode(newQrCode)
      if (newQrCode) {
        setQrCodeWasShown(true)
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error loading QR code:', error)
      }
    }
  }

  const handleConnect = async () => {
    setLoading(true)
    setQrCodeWasShown(false)
    try {
      const instanceName = `cartback_${Date.now()}`
      enqueueSnackbar('Criando instância do WhatsApp...', { variant: 'info' })
      await whatsappApi.connect({ instanceName })
      enqueueSnackbar('Instância criada! Aguarde enquanto geramos o QR Code...', {
        variant: 'success',
        autoHideDuration: 5000,
      })
      await loadInstance()
      await loadQrCode()
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || 'Erro ao conectar WhatsApp'
      const errorCode = error.response?.data?.error?.code
      if (errorCode === 'ALREADY_CONNECTED') {
        enqueueSnackbar('WhatsApp já está conectado', { variant: 'warning' })
      } else {
        enqueueSnackbar(errorMsg, { variant: 'error' })
      }
    } finally {
      setLoading(false)
    }
  }

  const pollStatus = async () => {
    try {
      const res = await whatsappApi.status()
      const newInstance = res.data.data.instance
      if (newInstance?.status === 'connected' && instance?.status !== 'connected') {
        enqueueSnackbar('WhatsApp conectado com sucesso!', { variant: 'success' })
      }
      setInstance(newInstance)
      if (newInstance && newInstance.status !== 'connected') {
        await loadQrCode()
      }
    } catch {
      // Silent fail for polling
    }
  }

  const handleDisconnect = async () => {
    setDisconnectLoading(true)
    try {
      await whatsappApi.disconnect()
      setInstance(null)
      setQrCode(null)
      setQrCodeWasShown(false)
      setConfirmOpen(false)
      enqueueSnackbar('WhatsApp desconectado', { variant: 'success' })
      await loadInstance()
    } catch {
      enqueueSnackbar('Erro ao desconectar', { variant: 'error' })
    } finally {
      setDisconnectLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
          <Skeleton variant="rectangular" width={256} height={256} sx={{ borderRadius: 2 }} />
          <Skeleton variant="text" width={200} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
          {instance?.status === 'connected' ? (
            <>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3,
                }}
              >
                <CheckCircle sx={{ fontSize: 48 }} />
              </Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                WhatsApp Conectado
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 3 }}>
                <PhoneAndroid sx={{ fontSize: 20 }} />
                <Typography variant="body1">
                  {instance.phoneNumber || 'Número não disponível'}
                </Typography>
              </Box>
              <Alert severity="success" sx={{ maxWidth: 500, mb: 2 }}>
                Seu WhatsApp está conectado e pronto para enviar mensagens de recuperação de carrinhos
                abandonados.
              </Alert>
              <LoadingButton
                variant="outlined"
                color="error"
                onClick={() => setConfirmOpen(true)}
                sx={{ mt: 2 }}
              >
                Desconectar
              </LoadingButton>
            </>
          ) : instance?.status === 'connecting' && qrCode ? (
            <>
              <Box
                sx={{
                  width: 256,
                  height: 256,
                  borderRadius: 2,
                  bgcolor: 'white',
                  p: 2,
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid',
                  borderColor: 'divider',
                }}
              >
                <img src={qrCode} alt="QR Code" style={{ width: '100%', height: '100%' }} />
              </Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Escaneie o QR Code
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 400, mb: 2 }}>
                Abra o WhatsApp no seu celular, vá em <strong>Dispositivos Vinculados</strong> e escaneie este
                QR Code
              </Typography>
              <Alert severity="info" sx={{ maxWidth: 500, mb: 2 }}>
                Aguardando conexão... O QR Code será atualizado automaticamente.
              </Alert>
              <Button variant="outlined" color="error" onClick={() => setConfirmOpen(true)} size="small">
                Cancelar
              </Button>
            </>
          ) : instance?.status === 'connecting' && !qrCode && qrCodeWasShown ? (
            <>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3,
                  animation: 'spin 2s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              >
                <Sync sx={{ fontSize: 48 }} />
              </Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Sincronizando...
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 400, mb: 2 }}>
                QR Code escaneado! Aguarde enquanto seu WhatsApp é autenticado e conectado.
              </Typography>
              <Alert severity="info" sx={{ maxWidth: 500, mb: 2 }}>
                Isso pode levar alguns segundos. Mantenha seu celular próximo.
              </Alert>
            </>
          ) : instance?.status === 'connecting' && !qrCode ? (
            <>
              <Skeleton variant="rectangular" width={256} height={256} sx={{ borderRadius: 2, mb: 3 }} />
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Gerando QR Code...
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 400, mb: 2 }}>
                Aguarde alguns instantes enquanto o QR Code é gerado
              </Typography>
              <Alert severity="info" sx={{ maxWidth: 500, mb: 2 }}>
                A instância foi criada e o QR Code será exibido em breve.
              </Alert>
            </>
          ) : (
            <EmptyState
              icon={<QrCode />}
              title="WhatsApp não conectado"
              description="Clique no botão abaixo para criar uma instância e conectar seu WhatsApp via Evolution API"
              action={{
                label: 'Conectar WhatsApp',
                onClick: handleConnect,
              }}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Desconectar WhatsApp?"
        message="Você tem certeza que deseja desconectar? Isso vai parar o envio de mensagens de recuperação."
        onConfirm={handleDisconnect}
        onCancel={() => setConfirmOpen(false)}
        loading={disconnectLoading}
        confirmText="Desconectar"
      />
    </>
  )
}
