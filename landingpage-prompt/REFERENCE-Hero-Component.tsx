/**
 * Cartback Landing Page - Hero Section Reference
 * 
 * Este é um componente de referência para o Claude Code.
 * Demonstra o padrão visual e estrutura esperada.
 */

import React from 'react';
import { Box, Container, Typography, Button, Stack, Chip, useTheme } from '@mui/material';
import { PlayArrow, ArrowForward, CheckCircle } from '@mui/icons-material';

// Dados que podem vir de um arquivo separado
const heroData = {
  headline: {
    line1: 'Pare de perder vendas.',
    line2: 'Recupere carrinhos abandonados pelo WhatsApp.',
  },
  subheadline: 'Envie mensagens automáticas pelo WhatsApp quando seus clientes abandonam o carrinho. Setup em 5 minutos, sem código.',
  cta: {
    primary: 'Começar Teste Grátis',
    secondary: 'Ver demonstração',
  },
  badges: [
    '7 dias grátis',
    'Sem cartão de crédito',
    'Cancele quando quiser',
  ],
  stats: {
    recovered: 'R$ 2.5M+',
    recoveredLabel: 'recuperados',
    stores: '500+',
    storesLabel: 'lojas ativas',
    rate: '30%',
    rateLabel: 'taxa média',
  },
};

const Hero = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      component="section"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        // Background gradient sutil
        background: isDark 
          ? 'linear-gradient(180deg, #0D0D14 0%, #1A1A2E 100%)'
          : 'linear-gradient(180deg, #FFFFFF 0%, #F8F9FA 100%)',
        // Padrão decorativo
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '80%',
          height: '150%',
          background: `radial-gradient(circle, ${theme.palette.primary.main}15 0%, transparent 60%)`,
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 6, md: 8 }}
          alignItems="center"
          sx={{ py: { xs: 8, md: 0 } }}
        >
          {/* Conteúdo */}
          <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
            {/* Badge de destaque */}
            <Chip
              label="🚀 Novo: Integração com Shopify"
              sx={{
                mb: 3,
                background: `${theme.palette.primary.main}20`,
                color: theme.palette.primary.main,
                fontWeight: 600,
                border: `1px solid ${theme.palette.primary.main}40`,
              }}
            />

            {/* Headline */}
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem', lg: '4rem' },
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                mb: 3,
              }}
            >
              {heroData.headline.line1}
              <br />
              <Box
                component="span"
                sx={{
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {heroData.headline.line2}
              </Box>
            </Typography>

            {/* Subheadline */}
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{
                fontSize: { xs: '1rem', md: '1.25rem' },
                lineHeight: 1.6,
                mb: 4,
                maxWidth: 540,
                mx: { xs: 'auto', md: 0 },
              }}
            >
              {heroData.subheadline}
            </Typography>

            {/* CTAs */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent={{ xs: 'center', md: 'flex-start' }}
              sx={{ mb: 4 }}
            >
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                sx={{
                  py: 1.5,
                  px: 4,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  boxShadow: '0 4px 20px rgba(37, 211, 102, 0.4)',
                  '&:hover': {
                    boxShadow: '0 6px 30px rgba(37, 211, 102, 0.5)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {heroData.cta.primary}
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<PlayArrow />}
                sx={{
                  py: 1.5,
                  px: 4,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    background: `${theme.palette.primary.main}10`,
                  },
                }}
              >
                {heroData.cta.secondary}
              </Button>
            </Stack>

            {/* Trust badges */}
            <Stack
              direction="row"
              spacing={3}
              flexWrap="wrap"
              justifyContent={{ xs: 'center', md: 'flex-start' }}
              sx={{ gap: 2 }}
            >
              {heroData.badges.map((badge, index) => (
                <Stack
                  key={index}
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                >
                  <CheckCircle 
                    sx={{ 
                      fontSize: 18, 
                      color: theme.palette.primary.main 
                    }} 
                  />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                  >
                    {badge}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Mockup / Visual */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            {/* Placeholder para mockup do produto */}
            <Box
              sx={{
                width: '100%',
                maxWidth: 500,
                aspectRatio: '4/3',
                borderRadius: '24px',
                background: isDark 
                  ? 'linear-gradient(135deg, #1A1A2E 0%, #252538 100%)'
                  : 'linear-gradient(135deg, #F8F9FA 0%, #FFFFFF 100%)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                boxShadow: isDark
                  ? '0 20px 60px rgba(0,0,0,0.5)'
                  : '0 20px 60px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Placeholder text - substituir por screenshot real */}
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'center', p: 4 }}
              >
                [Screenshot do Dashboard]
                <br />
                Ou mockup do WhatsApp com mensagem de recuperação
              </Typography>

              {/* Badge de conversão flutuante */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -20,
                  right: -10,
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  color: 'white',
                  py: 1.5,
                  px: 3,
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(37, 211, 102, 0.4)',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  💰 +R$ 847 recuperados hoje
                </Typography>
              </Box>
            </Box>
          </Box>
        </Stack>

        {/* Stats bar (opcional, pode ficar em seção separada) */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 4, sm: 8 }}
          justifyContent="center"
          alignItems="center"
          sx={{
            mt: { xs: 8, md: 12 },
            pt: 6,
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          }}
        >
          {Object.entries(heroData.stats).map(([key, value], index) => {
            if (key.includes('Label')) return null;
            const labelKey = `${key}Label`;
            return (
              <Box key={key} sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {heroData.stats[labelKey]}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </Container>
    </Box>
  );
};

export default Hero;
