import { Box, Container, Typography, Grid, Card, CardContent, useTheme } from '@mui/material'
import {
  WhatsApp,
  Message,
  AccessTime,
  AutoAwesome,
  BarChart,
  Headphones,
} from '@mui/icons-material'
import { features } from '../data/features'

const iconMap: Record<string, React.ReactElement> = {
  WhatsApp: <WhatsApp sx={{ fontSize: 40 }} />,
  MessageSquare: <Message sx={{ fontSize: 40 }} />,
  Clock: <AccessTime sx={{ fontSize: 40 }} />,
  Sparkles: <AutoAwesome sx={{ fontSize: 40 }} />,
  BarChart3: <BarChart sx={{ fontSize: 40 }} />,
  HeadphonesIcon: <Headphones sx={{ fontSize: 40 }} />,
}

export default function Features() {
  const theme = useTheme()

  return (
    <Box
      id="features"
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
            Tudo que você precisa para recuperar vendas
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Poderoso, mas simples de usar
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box
                    sx={{
                      color: theme.palette.primary.main,
                      mb: 3,
                    }}
                  >
                    {iconMap[feature.icon]}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {feature.description}
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
