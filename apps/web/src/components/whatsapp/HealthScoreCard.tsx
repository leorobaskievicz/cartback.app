import { Card, CardContent, Box, Typography, CircularProgress, Chip, useTheme } from '@mui/material'
import {
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  TrendingUp,
  WbSunny,
  Nightlight,
} from '@mui/icons-material'

interface HealthScoreCardProps {
  score: number
  qualityRating: 'high' | 'medium' | 'low' | 'flagged'
  isHealthy: boolean
  isWarmingUp: boolean
  daysSinceConnection: number
}

export default function HealthScoreCard({
  score,
  qualityRating,
  isHealthy,
  isWarmingUp,
  daysSinceConnection,
}: HealthScoreCardProps) {
  const theme = useTheme()

  const getScoreColor = () => {
    if (score >= 80) return theme.palette.success.main
    if (score >= 60) return theme.palette.info.main
    if (score >= 40) return theme.palette.warning.main
    return theme.palette.error.main
  }

  const getScoreGradient = () => {
    if (score >= 80) return 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
    if (score >= 60) return 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)'
    if (score >= 40) return 'linear-gradient(135deg, #F59E0B 0%, #EAB308 100%)'
    return 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
  }

  const getRatingConfig = () => {
    const configs = {
      high: {
        label: 'Excelente',
        color: 'success' as const,
        icon: <CheckCircle fontSize="small" />,
      },
      medium: {
        label: 'Boa',
        color: 'info' as const,
        icon: <TrendingUp fontSize="small" />,
      },
      low: {
        label: 'Baixa',
        color: 'warning' as const,
        icon: <Warning fontSize="small" />,
      },
      flagged: {
        label: 'Crítica',
        color: 'error' as const,
        icon: <ErrorIcon fontSize="small" />,
      },
    }
    return configs[qualityRating]
  }

  const ratingConfig = getRatingConfig()

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
          background: getScoreGradient(),
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Saúde da Integração
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip
                icon={ratingConfig.icon}
                label={`Qualidade ${ratingConfig.label}`}
                color={ratingConfig.color}
                size="small"
              />
              {isWarmingUp && (
                <Chip
                  icon={isWarmingUp ? <Nightlight fontSize="small" /> : <WbSunny fontSize="small" />}
                  label={`Aquecendo (${daysSinceConnection}/21 dias)`}
                  color="warning"
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={100}
              size={160}
              thickness={4}
              sx={{
                color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              }}
            />
            <CircularProgress
              variant="determinate"
              value={score}
              size={160}
              thickness={4}
              sx={{
                position: 'absolute',
                left: 0,
                color: getScoreColor(),
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                },
              }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}
            >
              <Typography
                variant="h2"
                fontWeight={800}
                sx={{
                  background: getScoreGradient(),
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {score}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                HEALTH SCORE
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 2,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50',
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            {isHealthy ? '✅ Status Saudável' : '⚠️ Atenção Necessária'}
          </Typography>
          <Typography variant="body2" color="text.primary">
            {isHealthy
              ? 'Sua integração está funcionando perfeitamente. Continue assim!'
              : 'Sua integração precisa de atenção. Verifique os alertas abaixo.'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}
