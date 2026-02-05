import { Card, CardContent, Box, Typography, Alert, AlertTitle, Chip, useTheme } from '@mui/material'
import {
  Warning,
  Error as ErrorIcon,
  Speed,
  TrendingDown,
  Block,
  AccessTime,
} from '@mui/icons-material'
import type { HealthAlert } from '../../types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

interface AlertsListProps {
  alerts: HealthAlert[]
}

export default function AlertsList({ alerts }: AlertsListProps) {
  const theme = useTheme()

  const getAlertIcon = (type: HealthAlert['type']) => {
    const icons = {
      rate_limit: <Speed fontSize="small" />,
      quality_low: <TrendingDown fontSize="small" />,
      warmup_exceeded: <AccessTime fontSize="small" />,
      response_rate_low: <TrendingDown fontSize="small" />,
      too_many_failures: <ErrorIcon fontSize="small" />,
    }
    return icons[type]
  }

  const getAlertTitle = (type: HealthAlert['type']) => {
    const titles = {
      rate_limit: 'Limite de Envio',
      quality_low: 'Qualidade Baixa',
      warmup_exceeded: 'Aquecimento Excedido',
      response_rate_low: 'Taxa de Resposta Baixa',
      too_many_failures: 'Muitas Falhas',
    }
    return titles[type]
  }

  const getSuggestion = (type: HealthAlert['type']) => {
    const suggestions = {
      rate_limit: 'Mensagens serão reagendadas automaticamente. Considere distribuir envios ao longo do dia.',
      quality_low: 'Melhore a personalização das mensagens e evite envios genéricos.',
      warmup_exceeded: 'Reduza o volume de envios para respeitar o período de aquecimento do número.',
      response_rate_low: 'Revise seus templates e certifique-se de que sejam relevantes para os clientes.',
      too_many_failures: 'Verifique os números de telefone e a estabilidade da conexão com o WhatsApp.',
    }
    return suggestions[type]
  }

  if (alerts.length === 0) {
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
            background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
          },
        }}
      >
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Alertas
          </Typography>
          <Box
            sx={{
              p: 3,
              textAlign: 'center',
              borderRadius: 2,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
              border: `1px solid ${theme.palette.success.main}`,
            }}
          >
            <Typography variant="h3" sx={{ mb: 1 }}>
              ✅
            </Typography>
            <Typography variant="body1" fontWeight={600} color="success.main">
              Tudo certo!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Nenhum alerta ativo no momento
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length
  const warningCount = alerts.filter((a) => a.severity === 'warning').length

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
          background:
            criticalCount > 0
              ? 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)'
              : 'linear-gradient(90deg, #F59E0B 0%, #EAB308 100%)',
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Alertas Ativos
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {criticalCount > 0 && (
              <Chip
                icon={<ErrorIcon fontSize="small" />}
                label={`${criticalCount} Crítico${criticalCount > 1 ? 's' : ''}`}
                color="error"
                size="small"
              />
            )}
            {warningCount > 0 && (
              <Chip
                icon={<Warning fontSize="small" />}
                label={`${warningCount} Aviso${warningCount > 1 ? 's' : ''}`}
                color="warning"
                size="small"
              />
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {alerts.map((alert, index) => (
            <Alert
              key={index}
              severity={alert.severity === 'critical' ? 'error' : 'warning'}
              icon={getAlertIcon(alert.type)}
              sx={{
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  fontSize: 24,
                },
              }}
            >
              <AlertTitle sx={{ fontWeight: 700 }}>{getAlertTitle(alert.type)}</AlertTitle>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {alert.message}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                {dayjs(alert.timestamp).fromNow()}
              </Typography>
              <Box
                sx={{
                  mt: 1,
                  p: 1,
                  borderRadius: 1,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  💡 <strong>Sugestão:</strong> {getSuggestion(alert.type)}
                </Typography>
              </Box>
            </Alert>
          ))}
        </Box>
      </CardContent>
    </Card>
  )
}
