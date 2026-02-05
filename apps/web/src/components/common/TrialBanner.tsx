import { Alert, AlertTitle, Button, Box } from '@mui/material'
import { useNavigate } from 'react-router-dom'

interface TrialBannerProps {
  daysRemaining: number
  isExpired: boolean
}

export default function TrialBanner({ daysRemaining, isExpired }: TrialBannerProps) {
  const navigate = useNavigate()

  if (isExpired) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <AlertTitle>Período de teste expirado</AlertTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Escolha um plano para continuar usando o Cartback.</span>
          <Button variant="contained" color="error" onClick={() => navigate('/plans')}>
            Ver planos
          </Button>
        </Box>
      </Alert>
    )
  }

  if (daysRemaining <= 3) {
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        <AlertTitle>
          Seu trial expira em {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}
        </AlertTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Escolha um plano para não perder acesso.</span>
          <Button variant="contained" color="warning" onClick={() => navigate('/plans')}>
            Ver planos
          </Button>
        </Box>
      </Alert>
    )
  }

  return null
}
