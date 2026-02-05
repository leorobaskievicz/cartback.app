import { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  useTheme,
  alpha,
} from '@mui/material'
import { Check as CheckIcon, Star as StarIcon } from '@mui/icons-material'
import { plans } from '../data/pricing'

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const theme = useTheme()

  return (
    <Box
      id="pricing"
      sx={{
        py: { xs: 8, md: 12 },
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2rem', md: '3rem' },
              fontWeight: 700,
              mb: 2,
            }}
          >
            Planos que cabem no seu bolso
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Comece grátis. Cancele quando quiser.
          </Typography>

          {/* Billing Toggle */}
          <ToggleButtonGroup
            value={billingPeriod}
            exclusive
            onChange={(_, value) => value && setBillingPeriod(value)}
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: 2,
              p: 0.5,
            }}
          >
            <ToggleButton
              value="monthly"
              sx={{
                px: 4,
                py: 1.5,
                fontWeight: 600,
                border: 'none',
                '&.Mui-selected': {
                  background: theme.palette.gradient.primary,
                  color: '#FFFFFF',
                  '&:hover': {
                    background: theme.palette.gradient.primary,
                  },
                },
              }}
            >
              Mensal
            </ToggleButton>
            <ToggleButton
              value="yearly"
              sx={{
                px: 4,
                py: 1.5,
                fontWeight: 600,
                border: 'none',
                '&.Mui-selected': {
                  background: theme.palette.gradient.primary,
                  color: '#FFFFFF',
                  '&:hover': {
                    background: theme.palette.gradient.primary,
                  },
                },
              }}
            >
              Anual
              <Chip
                label="-20%"
                size="small"
                sx={{
                  ml: 1,
                  bgcolor: theme.palette.success.main,
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                }}
              />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Grid container spacing={4} alignItems="stretch">
          {plans.map((plan, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: plan.recommended
                    ? `2px solid ${theme.palette.primary.main}`
                    : `1px solid ${theme.palette.divider}`,
                  background: plan.recommended
                    ? alpha(theme.palette.primary.main, 0.02)
                    : theme.palette.background.paper,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.shadows[12],
                  },
                }}
              >
                {plan.recommended && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      px: 3,
                      py: 0.5,
                      borderRadius: 2,
                      background: theme.palette.gradient.primary,
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      boxShadow: theme.shadows[4],
                    }}
                  >
                    <StarIcon sx={{ fontSize: 16 }} />
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      Recomendado
                    </Typography>
                  </Box>
                )}

                <CardContent sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                    {plan.name}
                  </Typography>

                  <Box sx={{ mb: 4 }}>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 800,
                        display: 'inline-block',
                      }}
                    >
                      R$ {billingPeriod === 'monthly' ? plan.price.monthly : plan.price.yearly}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ display: 'inline-block', ml: 1 }}
                    >
                      /mês
                    </Typography>
                    {billingPeriod === 'yearly' && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Faturado anualmente
                      </Typography>
                    )}
                  </Box>

                  <List sx={{ mb: 4, flexGrow: 1 }}>
                    {plan.features.map((feature, idx) => (
                      <ListItem key={idx} disablePadding sx={{ mb: 1.5 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={feature}
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: 'text.secondary',
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>

                  <Button
                    variant={plan.recommended ? 'contained' : 'outlined'}
                    size="large"
                    fullWidth
                    onClick={() => (window.location.href = '/register')}
                    sx={{
                      py: 1.5,
                      fontWeight: 600,
                    }}
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mt: 4, fontStyle: 'italic' }}
        >
          Todos os planos incluem 7 dias grátis. Sem cartão de crédito necessário.
        </Typography>
      </Container>
    </Box>
  )
}
