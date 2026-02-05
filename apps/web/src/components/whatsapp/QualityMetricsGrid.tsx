import { Card, CardContent, Box, Typography, Grid, useTheme, LinearProgress } from '@mui/material'
import {
  CheckCircle,
  Visibility,
  Error as ErrorIcon,
  ChatBubble,
  Send,
  Schedule,
} from '@mui/icons-material'

interface QualityMetricsGridProps {
  deliveryRate: number
  responseRate: number
  failureRate: number
  messagesDelivered: number
  messagesRead: number
  messagesFailed: number
  userResponses: number
  metricsLastMinute: number
  metricsLastHour: number
  metricsLast24h: number
  metricsLast7days: number
}

export default function QualityMetricsGrid({
  deliveryRate,
  responseRate,
  failureRate,
  messagesDelivered,
  messagesRead,
  messagesFailed,
  userResponses,
  metricsLastMinute,
  metricsLastHour,
  metricsLast24h,
  metricsLast7days,
}: QualityMetricsGridProps) {
  const theme = useTheme()

  const MetricCard = ({
    icon,
    label,
    value,
    subtitle,
    color,
    showProgress,
    progressValue,
  }: {
    icon: React.ReactNode
    label: string
    value: string | number
    subtitle?: string
    color: string
    showProgress?: boolean
    progressValue?: number
  }) => (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50',
        border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0px 8px 24px rgba(0, 0, 0, 0.4)'
            : '0px 8px 24px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box
          sx={{
            p: 0.5,
            borderRadius: 1,
            bgcolor: theme.palette.mode === 'dark' ? `${color}20` : `${color}10`,
            color: color,
            display: 'flex',
          }}
        >
          {icon}
        </Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          {label}
        </Typography>
      </Box>
      <Typography variant="h4" fontWeight={700} color="text.primary">
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
      {showProgress && progressValue !== undefined && (
        <Box sx={{ mt: 1 }}>
          <LinearProgress
            variant="determinate"
            value={progressValue}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              '& .MuiLinearProgress-bar': {
                bgcolor: color,
                borderRadius: 2,
              },
            }}
          />
        </Box>
      )}
    </Box>
  )

  const getDeliveryColor = () => {
    if (deliveryRate >= 95) return theme.palette.success.main
    if (deliveryRate >= 85) return theme.palette.info.main
    if (deliveryRate >= 70) return theme.palette.warning.main
    return theme.palette.error.main
  }

  const getResponseColor = () => {
    if (responseRate >= 40) return theme.palette.success.main
    if (responseRate >= 30) return theme.palette.info.main
    if (responseRate >= 20) return theme.palette.warning.main
    return theme.palette.error.main
  }

  const getFailureColor = () => {
    if (failureRate <= 5) return theme.palette.success.main
    if (failureRate <= 10) return theme.palette.warning.main
    return theme.palette.error.main
  }

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #3B82F6 0%, #6366F1 100%)',
        },
      }}
    >
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Métricas de Qualidade
        </Typography>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Taxas Principais */}
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              icon={<CheckCircle fontSize="small" />}
              label="Taxa de Entrega"
              value={`${deliveryRate}%`}
              subtitle={`${messagesDelivered} entregues`}
              color={getDeliveryColor()}
              showProgress
              progressValue={deliveryRate}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              icon={<ChatBubble fontSize="small" />}
              label="Taxa de Resposta"
              value={`${responseRate}%`}
              subtitle={`${userResponses} respostas`}
              color={getResponseColor()}
              showProgress
              progressValue={responseRate}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              icon={<ErrorIcon fontSize="small" />}
              label="Taxa de Falha"
              value={`${failureRate}%`}
              subtitle={`${messagesFailed} falhadas`}
              color={getFailureColor()}
              showProgress
              progressValue={failureRate}
            />
          </Grid>

          {/* Métricas de Leitura */}
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              icon={<Visibility fontSize="small" />}
              label="Mensagens Lidas"
              value={messagesRead}
              subtitle="Últimos 7 dias"
              color={theme.palette.info.main}
            />
          </Grid>

          {/* Volume de Envios */}
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              icon={<Schedule fontSize="small" />}
              label="Última Hora"
              value={metricsLastHour}
              subtitle="mensagens enviadas"
              color={theme.palette.primary.main}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              icon={<Send fontSize="small" />}
              label="Últimos 7 Dias"
              value={metricsLast7days}
              subtitle="mensagens enviadas"
              color={theme.palette.secondary.main}
            />
          </Grid>
        </Grid>

        {/* Mini Stats */}
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50',
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
            Volume de Envio
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">
                Último minuto
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {metricsLastMinute}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">
                Hoje (24h)
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {metricsLast24h}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">
                Esta semana
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {metricsLast7days}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  )
}
