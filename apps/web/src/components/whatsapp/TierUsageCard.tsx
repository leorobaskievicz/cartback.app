import { Card, CardContent, Box, Typography, LinearProgress, Chip, useTheme } from '@mui/material'
import { TrendingUp, Speed, EmojiEvents } from '@mui/icons-material'

interface TierUsageCardProps {
  current: 'unverified' | 'tier1' | 'tier2' | 'tier3' | 'tier4'
  dailyLimit: number
  usageToday: number
  usagePercent: number
  nearLimit: boolean
}

export default function TierUsageCard({
  current,
  dailyLimit,
  usageToday,
  usagePercent,
  nearLimit,
}: TierUsageCardProps) {
  const theme = useTheme()

  const getTierConfig = () => {
    const configs = {
      unverified: {
        label: 'Não Verificado',
        color: 'default' as const,
        nextLimit: 1000,
        nextTier: 'Tier 1',
      },
      tier1: {
        label: 'Tier 1',
        color: 'info' as const,
        nextLimit: 10000,
        nextTier: 'Tier 2',
      },
      tier2: {
        label: 'Tier 2',
        color: 'primary' as const,
        nextLimit: 100000,
        nextTier: 'Tier 3',
      },
      tier3: {
        label: 'Tier 3',
        color: 'secondary' as const,
        nextLimit: 999999,
        nextTier: 'Tier 4',
      },
      tier4: {
        label: 'Tier 4 (Ilimitado)',
        color: 'success' as const,
        nextLimit: null,
        nextTier: null,
      },
    }
    return configs[current]
  }

  const getProgressColor = () => {
    if (usagePercent >= 90) return theme.palette.error.main
    if (usagePercent >= 75) return theme.palette.warning.main
    return theme.palette.success.main
  }

  const getProgressGradient = () => {
    if (usagePercent >= 90) return 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)'
    if (usagePercent >= 75) return 'linear-gradient(90deg, #F59E0B 0%, #EAB308 100%)'
    return 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
  }

  const tierConfig = getTierConfig()

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
          background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Limite Diário
            </Typography>
            <Chip
              icon={<EmojiEvents fontSize="small" />}
              label={tierConfig.label}
              color={tierConfig.color}
              size="small"
            />
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{
                background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {usageToday}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              de {dailyLimit.toLocaleString('pt-BR')}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Uso hoje
            </Typography>
            <Typography variant="body2" fontWeight={700} color={getProgressColor()}>
              {usagePercent}%
            </Typography>
          </Box>
          <Box
            sx={{
              position: 'relative',
              height: 8,
              borderRadius: 4,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${Math.min(usagePercent, 100)}%`,
                background: getProgressGradient(),
                borderRadius: 4,
                transition: 'width 0.3s ease',
              }}
            />
          </Box>
        </Box>

        {nearLimit && (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
              border: `1px solid ${theme.palette.error.main}`,
              mb: 2,
            }}
          >
            <Typography variant="caption" color="error.main" fontWeight={600}>
              ⚠️ Próximo do limite! Mensagens podem ser reagendadas automaticamente.
            </Typography>
          </Box>
        )}

        {tierConfig.nextTier && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <TrendingUp fontSize="small" color="primary" />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Próximo Tier
              </Typography>
            </Box>
            <Typography variant="body2" color="text.primary">
              <strong>{tierConfig.nextTier}</strong> - {tierConfig.nextLimit?.toLocaleString('pt-BR')} msgs/dia
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              Mantenha qualidade alta e use 50% do limite atual
            </Typography>
          </Box>
        )}

        {current === 'tier4' && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
              border: `1px solid ${theme.palette.success.main}`,
            }}
          >
            <Typography variant="body2" color="success.main" fontWeight={600}>
              🎉 Parabéns! Você atingiu o tier máximo com envios ilimitados!
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
