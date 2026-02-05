import { Box, Container, Typography, Grid, Card, CardContent, useTheme } from '@mui/material'
import { TrendingDown, AttachMoney, AccessTime } from '@mui/icons-material'

export default function ProblemSection() {
  const theme = useTheme()

  const stats = [
    {
      icon: <TrendingDown sx={{ fontSize: 40 }} />,
      value: '70%',
      label: 'Taxa média de abandono',
    },
    {
      icon: <AttachMoney sx={{ fontSize: 40 }} />,
      value: 'R$ 3.500',
      label: 'Perdidos por mês (loja média)',
    },
    {
      icon: <AccessTime sx={{ fontSize: 40 }} />,
      value: '48h',
      label: 'Janela ideal para recuperação',
    },
  ]

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
              mb: 3,
            }}
          >
            70% dos carrinhos são abandonados
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              maxWidth: '700px',
              mx: 'auto',
              lineHeight: 1.8,
              fontSize: { xs: '1rem', md: '1.2rem' },
            }}
          >
            A cada 10 clientes que adicionam produtos ao carrinho, 7 nunca finalizam a compra.
            <br />
            <br />
            Isso significa milhares de reais deixados na mesa todos os meses.
            <br />
            <br />
            E o pior? A maioria desses clientes <strong>QUER</strong> comprar - eles só precisam
            de um lembrete no momento certo.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {stats.map((stat, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                  },
                }}
              >
                <CardContent sx={{ py: 4 }}>
                  <Box
                    sx={{
                      color: theme.palette.primary.main,
                      mb: 2,
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      background: theme.palette.gradient.primary,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}
