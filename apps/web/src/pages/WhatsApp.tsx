import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Skeleton,
  Grid,
  LinearProgress,
  Chip,
} from '@mui/material'
import {
  QrCode,
  CheckCircle,
  PhoneAndroid,
  Sync,
  Warning,
  Error as ErrorIcon,
  CheckCircleOutline,
  TrendingUp,
} from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { whatsappApi } from '../services/api'
import type { WhatsAppInstance, WhatsAppHealthMetrics } from '../types'
import LoadingButton from '../components/common/LoadingButton'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import HealthScoreCard from '../components/whatsapp/HealthScoreCard'
import TierUsageCard from '../components/whatsapp/TierUsageCard'
import AlertsList from '../components/whatsapp/AlertsList'
import QualityMetricsGrid from '../components/whatsapp/QualityMetricsGrid'

export default function WhatsApp() {
  const [instance, setInstance] = useState<WhatsAppInstance | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrCodeWasShown, setQrCodeWasShown] = useState(false)
  const [loading, setLoading] = useState(true)
  const [disconnectLoading, setDisconnectLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [healthMetrics, setHealthMetrics] = useState<WhatsAppHealthMetrics | null>(null)
  const [healthLoading, setHealthLoading] = useState(false)
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
    } else {
      // Carregar health metrics quando conectado
      loadHealthMetrics()

      // Atualizar a cada 30 segundos
      const interval = setInterval(() => {
        loadHealthMetrics()
      }, 30000)
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
      // Se não tem instância ainda, ignorar erro silenciosamente
      if (error.response?.status !== 404) {
        console.error('Error loading QR code:', error)
      }
    }
  }

  const loadHealthMetrics = async () => {
    if (healthLoading) return

    setHealthLoading(true)
    try {
      console.log('🔍 Loading health metrics...')
      const res = await whatsappApi.health()
      console.log('📊 Health metrics response:', res.data.data)

      // Se não tem hasInstance, significa que retornou os dados completos
      if (!('hasInstance' in res.data.data)) {
        setHealthMetrics(res.data.data as WhatsAppHealthMetrics)
        console.log('✅ Health metrics loaded successfully')
      } else {
        console.log('⚠️ No instance found')
      }
    } catch (error: any) {
      console.error('❌ Error loading health metrics:', error)
    } finally {
      setHealthLoading(false)
    }
  }

  const handleConnect = async () => {
    setLoading(true)
    setQrCodeWasShown(false)
    try {
      // Gerar um nome de instância único baseado no tenant
      const instanceName = `cartback_${Date.now()}`

      enqueueSnackbar('Criando instância do WhatsApp...', { variant: 'info' })

      await whatsappApi.connect({ instanceName })

      enqueueSnackbar(
        'Instância criada! Aguarde enquanto geramos o QR Code...',
        { variant: 'success', autoHideDuration: 5000 }
      )

      // Recarregar instância após conectar
      await loadInstance()

      // Forçar busca imediata do QR Code
      await loadQrCode()
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || 'Erro ao conectar WhatsApp'
      const errorCode = error.response?.data?.error?.code

      if (errorCode === 'ALREADY_CONNECTED') {
        enqueueSnackbar('WhatsApp já está conectado', { variant: 'warning' })
      } else {
        enqueueSnackbar(errorMsg, { variant: 'error' })
      }

      console.error('Connect error:', error.response?.data)
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
    } catch (error: any) {
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
    } catch (error: any) {
      enqueueSnackbar('Erro ao desconectar', { variant: 'error' })
    } finally {
      setDisconnectLoading(false)
    }
  }

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          WhatsApp
        </Typography>
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
            <Skeleton variant="rectangular" width={256} height={256} sx={{ borderRadius: 2 }} />
            <Skeleton variant="text" width={200} sx={{ mt: 2 }} />
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        WhatsApp
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Conecte seu WhatsApp para enviar mensagens de recuperação
      </Typography>

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
                Seu WhatsApp está conectado e pronto para enviar mensagens de recuperação de
                carrinhos abandonados.
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
              description="Clique no botão abaixo para criar uma instância e conectar seu WhatsApp via Evolution Manager"
              action={{
                label: 'Conectar WhatsApp',
                onClick: handleConnect,
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Health Metrics - Só aparece quando conectado */}
      {instance?.status === 'connected' && healthMetrics && (
        <Box sx={{ mt: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Monitoramento de Saúde
            </Typography>
            <Typography color="text.secondary">
              Acompanhe a saúde da sua integração e evite bloqueios
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Health Score */}
            <Grid item xs={12} md={6}>
              <HealthScoreCard
                score={healthMetrics.health.score}
                qualityRating={healthMetrics.health.qualityRating}
                isHealthy={healthMetrics.health.isHealthy}
                isWarmingUp={healthMetrics.health.isWarmingUp}
                daysSinceConnection={healthMetrics.health.daysSinceConnection}
              />
            </Grid>

            {/* Tier Usage */}
            <Grid item xs={12} md={6}>
              <TierUsageCard
                current={healthMetrics.tier.current}
                dailyLimit={healthMetrics.tier.dailyLimit}
                usageToday={healthMetrics.tier.usageToday}
                usagePercent={healthMetrics.tier.usagePercent}
                nearLimit={healthMetrics.tier.nearLimit}
              />
            </Grid>

            {/* Alerts */}
            <Grid item xs={12}>
              <AlertsList alerts={healthMetrics.alerts} />
            </Grid>

            {/* Quality Metrics */}
            <Grid item xs={12}>
              <QualityMetricsGrid
                deliveryRate={healthMetrics.quality.deliveryRate}
                responseRate={healthMetrics.quality.responseRate}
                failureRate={healthMetrics.quality.failureRate}
                messagesDelivered={healthMetrics.quality.messagesDelivered}
                messagesRead={healthMetrics.quality.messagesRead}
                messagesFailed={healthMetrics.quality.messagesFailed}
                userResponses={healthMetrics.quality.userResponses}
                metricsLastMinute={healthMetrics.metrics.lastMinute}
                metricsLastHour={healthMetrics.metrics.lastHour}
                metricsLast24h={healthMetrics.metrics.last24h}
                metricsLast7days={healthMetrics.metrics.last7days}
              />
            </Grid>
          </Grid>

          {/* Last Update */}
          {healthMetrics.lastUpdate && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Última atualização: {new Date(healthMetrics.lastUpdate).toLocaleString('pt-BR')}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Desconectar WhatsApp?"
        message="Você tem certeza que deseja desconectar? Isso vai parar o envio de mensagens de recuperação."
        onConfirm={handleDisconnect}
        onCancel={() => setConfirmOpen(false)}
        loading={disconnectLoading}
        confirmText="Desconectar"
      />
    </Box>
  )
}
