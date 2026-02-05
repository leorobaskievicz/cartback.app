/**
 * Cartback Landing Page - Pricing Section Reference
 * 
 * Seção crítica para conversão. Toggle mensal/anual funcional.
 */

import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Stack, 
  Card,
  Chip,
  Switch,
  useTheme,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Check, Close, Star } from '@mui/icons-material';

// Dados dos planos
const pricingData = {
  plans: [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Para lojas começando',
      priceMonthly: 59,
      priceAnnual: 47, // 20% desconto
      features: [
        { text: '500 mensagens/mês', included: true },
        { text: '1 loja conectada', included: true },
        { text: '3 templates de mensagem', included: true },
        { text: 'Dashboard básico', included: true },
        { text: 'Suporte por email', included: true },
        { text: 'Relatórios avançados', included: false },
        { text: 'API de integração', included: false },
      ],
      cta: 'Começar Grátis',
      highlighted: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Mais popular',
      priceMonthly: 99,
      priceAnnual: 79,
      features: [
        { text: '2.000 mensagens/mês', included: true },
        { text: '3 lojas conectadas', included: true },
        { text: '10 templates de mensagem', included: true },
        { text: 'Dashboard completo', included: true },
        { text: 'Suporte via WhatsApp', included: true },
        { text: 'Relatórios avançados', included: true },
        { text: 'API de integração', included: false },
      ],
      cta: 'Começar Grátis',
      highlighted: true,
      badge: 'Mais Popular',
    },
    {
      id: 'business',
      name: 'Business',
      description: 'Para escalar',
      priceMonthly: 199,
      priceAnnual: 159,
      features: [
        { text: '10.000 mensagens/mês', included: true },
        { text: 'Lojas ilimitadas', included: true },
        { text: 'Templates ilimitados', included: true },
        { text: 'Dashboard completo', included: true },
        { text: 'Suporte prioritário', included: true },
        { text: 'Relatórios avançados', included: true },
        { text: 'API de integração', included: true },
      ],
      cta: 'Começar Grátis',
      highlighted: false,
    },
  ],
};

const Pricing = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <Box
      component="section"
      id="pricing"
      sx={{
        py: { xs: 10, md: 16 },
        background: isDark 
          ? 'linear-gradient(180deg, #1A1A2E 0%, #0D0D14 100%)'
          : 'linear-gradient(180deg, #F8F9FA 0%, #FFFFFF 100%)',
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Chip
            label="Preços"
            sx={{
              mb: 2,
              background: `${theme.palette.primary.main}20`,
              color: theme.palette.primary.main,
              fontWeight: 600,
            }}
          />
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 800,
              mb: 2,
            }}
          >
            Planos que cabem no seu bolso
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 500, mx: 'auto', mb: 4 }}
          >
            Comece grátis por 7 dias. Sem cartão de crédito. 
            Cancele quando quiser.
          </Typography>

          {/* Toggle Mensal/Anual */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="center"
          >
            <Typography
              variant="body1"
              sx={{
                fontWeight: isAnnual ? 400 : 600,
                color: isAnnual ? 'text.secondary' : 'text.primary',
              }}
            >
              Mensal
            </Typography>
            <Switch
              checked={isAnnual}
              onChange={(e) => setIsAnnual(e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: theme.palette.primary.main,
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: theme.palette.primary.main,
                },
              }}
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                variant="body1"
                sx={{
                  fontWeight: isAnnual ? 600 : 400,
                  color: isAnnual ? 'text.primary' : 'text.secondary',
                }}
              >
                Anual
              </Typography>
              <Chip
                label="Economize 20%"
                size="small"
                sx={{
                  background: `${theme.palette.primary.main}`,
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                }}
              />
            </Stack>
          </Stack>
        </Box>

        {/* Pricing Cards */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          alignItems="stretch"
          justifyContent="center"
        >
          {pricingData.plans.map((plan) => (
            <Card
              key={plan.id}
              sx={{
                flex: 1,
                maxWidth: { md: 360 },
                borderRadius: '24px',
                border: plan.highlighted 
                  ? `2px solid ${theme.palette.primary.main}`
                  : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                background: isDark ? '#1A1A2E' : '#FFFFFF',
                position: 'relative',
                overflow: 'visible',
                transform: plan.highlighted ? 'scale(1.05)' : 'scale(1)',
                boxShadow: plan.highlighted
                  ? '0 20px 60px rgba(37, 211, 102, 0.2)'
                  : '0 4px 20px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: plan.highlighted ? 'scale(1.07)' : 'scale(1.02)',
                  boxShadow: plan.highlighted
                    ? '0 24px 70px rgba(37, 211, 102, 0.25)'
                    : '0 8px 30px rgba(0,0,0,0.15)',
                },
              }}
            >
              {/* Badge "Mais Popular" */}
              {plan.badge && (
                <Chip
                  icon={<Star sx={{ fontSize: 16 }} />}
                  label={plan.badge}
                  sx={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                    color: 'white',
                    fontWeight: 700,
                    px: 1,
                  }}
                />
              )}

              <Box sx={{ p: 4 }}>
                {/* Plan header */}
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, mb: 0.5 }}
                >
                  {plan.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  {plan.description}
                </Typography>

                {/* Price */}
                <Box sx={{ mb: 4 }}>
                  <Stack direction="row" alignItems="baseline" spacing={0.5}>
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      sx={{ fontWeight: 400 }}
                    >
                      R$
                    </Typography>
                    <Typography
                      variant="h2"
                      sx={{
                        fontWeight: 800,
                        background: plan.highlighted
                          ? 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)'
                          : 'none',
                        backgroundClip: plan.highlighted ? 'text' : 'unset',
                        WebkitBackgroundClip: plan.highlighted ? 'text' : 'unset',
                        WebkitTextFillColor: plan.highlighted ? 'transparent' : 'inherit',
                      }}
                    >
                      {isAnnual ? plan.priceAnnual : plan.priceMonthly}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                    >
                      /mês
                    </Typography>
                  </Stack>
                  {isAnnual && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      Cobrado anualmente (R$ {plan.priceAnnual * 12}/ano)
                    </Typography>
                  )}
                </Box>

                {/* CTA */}
                <Button
                  variant={plan.highlighted ? 'contained' : 'outlined'}
                  fullWidth
                  size="large"
                  sx={{
                    py: 1.5,
                    borderRadius: '12px',
                    fontWeight: 600,
                    mb: 4,
                    ...(plan.highlighted && {
                      background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                      boxShadow: '0 4px 20px rgba(37, 211, 102, 0.4)',
                      '&:hover': {
                        boxShadow: '0 6px 30px rgba(37, 211, 102, 0.5)',
                      },
                    }),
                    ...(!plan.highlighted && {
                      borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        background: `${theme.palette.primary.main}10`,
                      },
                    }),
                  }}
                >
                  {plan.cta}
                </Button>

                {/* Features list */}
                <List disablePadding>
                  {plan.features.map((feature, index) => (
                    <ListItem
                      key={index}
                      disablePadding
                      sx={{ py: 0.75 }}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {feature.included ? (
                          <Check
                            sx={{
                              color: theme.palette.primary.main,
                              fontSize: 20,
                            }}
                          />
                        ) : (
                          <Close
                            sx={{
                              color: 'text.disabled',
                              fontSize: 20,
                            }}
                          />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={feature.text}
                        primaryTypographyProps={{
                          variant: 'body2',
                          color: feature.included ? 'text.primary' : 'text.disabled',
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Card>
          ))}
        </Stack>

        {/* Garantia */}
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="body1" color="text.secondary">
            🔒 Garantia de 7 dias. Se não gostar, devolvemos seu dinheiro.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Pricing;
