import { Box, Container, Typography, Button, Chip, useTheme, alpha } from '@mui/material'
import { PlayCircle as PlayCircleIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material'

export default function Hero() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box
      id="home"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        pt: { xs: 12, md: 16 },
        pb: { xs: 8, md: 12 },
        background: isDark
          ? `linear-gradient(135deg, ${alpha('#0D0D14', 0.98)} 0%, ${alpha('#1A1A2E', 0.95)} 100%)`
          : `linear-gradient(135deg, ${alpha('#FFFFFF', 0.98)} 0%, ${alpha('#F8F9FA', 0.95)} 100%)`,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: isDark
            ? 'radial-gradient(circle at 20% 20%, rgba(37, 211, 102, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(18, 140, 126, 0.08) 0%, transparent 50%)'
            : 'radial-gradient(circle at 20% 20%, rgba(37, 211, 102, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(18, 140, 126, 0.12) 0%, transparent 50%)',
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='${isDark ? '%23ffffff' : '%231a1a2e'}' fill-opacity='${isDark ? '0.02' : '0.04'}'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.4,
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', maxWidth: '900px', mx: 'auto' }}>
          {/* Badge */}
          <Chip
            icon={<CheckCircleIcon />}
            label="✓ 7 dias grátis • Sem cartão de crédito"
            color="success"
            sx={{
              mb: 4,
              fontWeight: 600,
              fontSize: '0.9rem',
              py: 2.5,
              px: 1,
            }}
          />

          {/* Headline */}
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
              fontWeight: 800,
              mb: 3,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              background: theme.palette.gradient.primary,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Pare de perder vendas.
            <br />
            Recupere carrinhos pelo WhatsApp.
          </Typography>

          {/* Subheadline */}
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{
              mb: 5,
              lineHeight: 1.6,
              fontSize: { xs: '1.1rem', md: '1.3rem' },
              maxWidth: '700px',
              mx: 'auto',
              fontWeight: 500,
            }}
          >
            Envie mensagens automáticas pelo WhatsApp quando seus clientes abandonam o carrinho.
            Setup em 5 minutos, sem código.
          </Typography>

          {/* CTAs */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
              mb: 6,
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => (window.location.href = '/register')}
              sx={{
                py: 2,
                px: 4,
                fontSize: '1.1rem',
                fontWeight: 600,
                minWidth: 200,
              }}
            >
              Começar Teste Grátis
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<PlayCircleIcon />}
              onClick={() => {
                const element = document.querySelector('#how-it-works')
                if (element) element.scrollIntoView({ behavior: 'smooth' })
              }}
              sx={{
                py: 2,
                px: 4,
                fontSize: '1.1rem',
                fontWeight: 600,
                minWidth: 200,
              }}
            >
              Ver Demonstração
            </Button>
          </Box>

          {/* Dashboard Screenshot */}
          <Box
            sx={{
              width: '100%',
              maxWidth: '1100px',
              mx: 'auto',
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: isDark
                ? '0 30px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                : '0 30px 80px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              transform: 'perspective(1000px) rotateX(2deg)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'perspective(1000px) rotateX(0deg) translateY(-4px)',
                boxShadow: isDark
                  ? '0 40px 100px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)'
                  : '0 40px 100px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.08)',
              },
            }}
          >
            <Box
              component="img"
              src="/assets/dashboard-preview.png"
              alt="CartBack Dashboard - Recuperação de Carrinhos Abandonados"
              sx={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
