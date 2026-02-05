import { Box, LinearProgress, Typography, Chip } from '@mui/material'
import { Warning as WarningIcon } from '@mui/icons-material'

interface UsageBarProps {
  used: number
  limit: number
  label?: string
  showWarning?: boolean
}

export default function UsageBar({
  used,
  limit,
  label = 'mensagens',
  showWarning = true,
}: UsageBarProps) {
  const percentage = Math.min(100, Math.round((used / limit) * 100))

  const getColor = () => {
    if (percentage >= 90) return 'error'
    if (percentage >= 70) return 'warning'
    return 'primary'
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {used.toLocaleString()} de {limit.toLocaleString()} {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {percentage}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        color={getColor()}
        sx={{ height: 8, borderRadius: 4 }}
      />
      {showWarning && percentage >= 80 && (
        <Chip
          icon={<WarningIcon />}
          label={percentage >= 100 ? 'Limite atingido' : 'Quase no limite'}
          color={percentage >= 100 ? 'error' : 'warning'}
          size="small"
          sx={{ mt: 1 }}
        />
      )}
    </Box>
  )
}
