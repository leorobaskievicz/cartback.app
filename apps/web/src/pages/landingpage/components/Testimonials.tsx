import { Box, Container, Typography, Grid, Card, CardContent, Avatar, useTheme } from '@mui/material'
import { FormatQuote } from '@mui/icons-material'
import { testimonials } from '../data/testimonials'

export default function Testimonials() {
  const theme = useTheme()

  const metrics = [
    { value: '+30%', label: 'Taxa de Recuperação' },
    { value: 'R$ 15', label: 'Retorno por R$1' },
    { value: '< 5min', label: 'Tempo de Setup' },
  ]

  return (
    <Box
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
            Resultados que falam por si
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Números reais de clientes que confiam no Cartback
          </Typography>
        </Box>

        {/* Metrics */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {metrics.map((metric, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '3rem', md: '4rem' },
                    background: theme.palette.gradient.primary,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                  }}
                >
                  {metric.value}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {metric.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Testimonials */}
        <Grid container spacing={4}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  position: 'relative',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                  },
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <FormatQuote
                    sx={{
                      fontSize: 48,
                      color: theme.palette.primary.main,
                      opacity: 0.2,
                      mb: 2,
                    }}
                  />
                  <Typography
                    variant="body1"
                    sx={{
                      mb: 3,
                      lineHeight: 1.7,
                      fontStyle: 'italic',
                    }}
                  >
                    "{testimonial.content}"
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        width: 48,
                        height: 48,
                      }}
                    >
                      {testimonial.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {testimonial.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {testimonial.role} • {testimonial.business}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}
