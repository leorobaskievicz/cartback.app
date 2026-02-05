import { Box, Container, Typography, Grid, Card, CardContent, Chip, useTheme } from '@mui/material'
import { integrations } from '../data/testimonials'

export default function Integrations() {
  const theme = useTheme()

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        background: theme.palette.background.paper,
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
            Conecta com sua plataforma favorita
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Integração em 1 clique. Sem código. Sem dor de cabeça.
          </Typography>
        </Box>

        <Grid container spacing={4} justifyContent="center">
          {integrations.map((integration, index) => (
            <Grid item xs={6} sm={4} md={2.4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 4,
                  position: 'relative',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  opacity: integration.available ? 1 : 0.5,
                  '&:hover': {
                    transform: integration.available ? 'translateY(-8px)' : 'none',
                    boxShadow: integration.available ? theme.shadows[8] : theme.shadows[1],
                  },
                }}
              >
                {integration.comingSoon && (
                  <Chip
                    label="Em breve"
                    size="small"
                    color="primary"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      fontSize: '0.7rem',
                    }}
                  />
                )}
                <CardContent sx={{ textAlign: 'center', p: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {integration.name}
                  </Typography>
                  {integration.available && (
                    <Typography variant="caption" color="success.main" sx={{ fontWeight: 600, mt: 1, display: 'block' }}>
                      ✓ Disponível
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}
