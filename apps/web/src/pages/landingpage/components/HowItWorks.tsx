import { Box, Container, Typography, Grid, Card, CardContent, useTheme, alpha } from '@mui/material'
import { Link as LinkIcon, Edit, FlashOn, CheckCircle } from '@mui/icons-material'

export default function HowItWorks() {
  const theme = useTheme()

  const steps = [
    {
      number: '1',
      icon: <LinkIcon sx={{ fontSize: 48 }} />,
      title: 'Conecte sua loja',
      description:
        'Integre com Nuvemshop, Yampi, Shopify ou WooCommerce em menos de 5 minutos. Zero código necessário.',
    },
    {
      number: '2',
      icon: <Edit sx={{ fontSize: 48 }} />,
      title: 'Configure suas mensagens',
      description:
        'Use nossos templates prontos ou personalize as mensagens com o tom da sua marca.',
    },
    {
      number: '3',
      icon: <FlashOn sx={{ fontSize: 48 }} />,
      title: 'Recupere no automático',
      description:
        'Quando um cliente abandona o carrinho, enviamos uma mensagem personalizada pelo WhatsApp dele.',
    },
  ]

  return (
    <Box
      id="how-it-works"
      sx={{
        py: { xs: 8, md: 12 },
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2rem', md: '3rem' },
              fontWeight: 700,
              mb: 2,
            }}
          >
            Recupere vendas em 3 passos
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Simples, rápido e eficiente
          </Typography>
        </Box>

        <Grid container spacing={4} sx={{ mb: 6 }}>
          {steps.map((step, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  position: 'relative',
                  overflow: 'visible',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                  },
                }}
              >
                {/* Number Badge */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -20,
                    left: 24,
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: theme.palette.gradient.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    boxShadow: theme.shadows[4],
                  }}
                >
                  {step.number}
                </Box>

                <CardContent sx={{ pt: 6, pb: 4, px: 3 }}>
                  <Box
                    sx={{
                      color: theme.palette.primary.main,
                      mb: 2,
                    }}
                  >
                    {step.icon}
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {step.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Result */}
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
            px: 4,
            borderRadius: 3,
            background: alpha(theme.palette.success.main, 0.1),
            border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <CheckCircle sx={{ color: theme.palette.success.main, fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Você recebe a notificação da venda recuperada 💰
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
