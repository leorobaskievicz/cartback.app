import { Box, Container, Typography, useTheme } from '@mui/material'

export default function SocialProofBar() {
  const theme = useTheme()

  return (
    <Box
      sx={{
        py: 6,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mb: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}
        >
          Integra com as principais plataformas
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: { xs: 4, md: 8 },
            flexWrap: 'wrap',
            opacity: 0.6,
          }}
        >
          {['Nuvemshop', 'Yampi', 'Shopify', 'WooCommerce'].map((platform) => (
            <Typography
              key={platform}
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1rem', md: '1.2rem' },
                color: 'text.secondary',
              }}
            >
              {platform}
            </Typography>
          ))}
        </Box>
      </Container>
    </Box>
  )
}
