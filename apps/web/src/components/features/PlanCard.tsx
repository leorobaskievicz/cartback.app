import {
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Box,
} from '@mui/material'
import { Check as CheckIcon, Star as StarIcon } from '@mui/icons-material'
import { Plan } from '../../types'

interface PlanCardProps {
  plan: Plan
  currentPlan: string
  recommended?: boolean
  onSelect: (planId: string) => void
  loading?: boolean
}

export default function PlanCard({
  plan,
  currentPlan,
  recommended,
  onSelect,
  loading,
}: PlanCardProps) {
  const isCurrent = plan.id === currentPlan
  const isUpgrade = !isCurrent && plan.price > 0

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: recommended ? '2px solid' : '1px solid',
        borderColor: recommended ? 'primary.main' : 'divider',
        position: 'relative',
      }}
    >
      {recommended && (
        <Chip
          icon={<StarIcon />}
          label="Mais popular"
          color="primary"
          size="small"
          sx={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}
        />
      )}
      <CardContent sx={{ flexGrow: 1, pt: recommended ? 4 : 2 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          {plan.name}
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h4" fontWeight={700} component="span">
            {plan.priceFormatted}
          </Typography>
          <Typography variant="body2" color="text.secondary" component="span">
            /mês
          </Typography>
        </Box>
        <List dense>
          {plan.features.map((feature, index) => (
            <ListItem key={index} disableGutters>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <CheckIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={feature} />
            </ListItem>
          ))}
        </List>
      </CardContent>
      <Box sx={{ p: 2, pt: 0 }}>
        <Button
          variant={isCurrent ? 'outlined' : 'contained'}
          fullWidth
          disabled={isCurrent || loading}
          onClick={() => onSelect(plan.id)}
          color={recommended ? 'primary' : 'inherit'}
        >
          {isCurrent ? 'Plano atual' : isUpgrade ? 'Fazer upgrade' : 'Selecionar'}
        </Button>
      </Box>
    </Card>
  )
}
