import { Box, Container, Typography, Grid, Link, IconButton, useTheme, alpha } from '@mui/material'
import {
  Instagram as InstagramIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  YouTube as YouTubeIcon,
} from '@mui/icons-material'
import Logo from '../../../components/common/Logo'

export default function Footer() {
  const theme = useTheme()
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    Produto: [
      { label: 'Recursos', href: '#features' },
      { label: 'Preços', href: '#pricing' },
      { label: 'Integrações', href: '#integrations' },
      { label: 'FAQ', href: '#faq' },
    ],
    Empresa: [
      { label: 'Sobre', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Contato', href: '#' },
    ],
    Legal: [
      { label: 'Termos de Uso', href: '#' },
      { label: 'Política de Privacidade', href: '#' },
      { label: 'LGPD', href: '#' },
    ],
  }

  const socialLinks = [
    { icon: <InstagramIcon />, href: '#', label: 'Instagram' },
    { icon: <TwitterIcon />, href: '#', label: 'Twitter' },
    { icon: <LinkedInIcon />, href: '#', label: 'LinkedIn' },
    { icon: <YouTubeIcon />, href: '#', label: 'YouTube' },
  ]

  return (
    <Box
      component="footer"
      sx={{
        py: 8,
        borderTop: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Logo and Description */}
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 3 }}>
              <Logo size="sm" variant="full" />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
              Recupere até 30% dos carrinhos abandonados automaticamente via WhatsApp.
              A plataforma que seus clientes já usam.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {socialLinks.map((social, index) => (
                <IconButton
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      color: theme.palette.primary.main,
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  {social.icon}
                </IconButton>
              ))}
            </Box>
          </Grid>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <Grid item xs={12} sm={4} md={2.67} key={category}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  color: 'text.primary',
                }}
              >
                {category}
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {links.map((link, index) => (
                  <Box component="li" key={index} sx={{ mb: 1.5 }}>
                    <Link
                      href={link.href}
                      underline="none"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.875rem',
                        transition: 'color 0.2s',
                        '&:hover': {
                          color: theme.palette.primary.main,
                        },
                      }}
                    >
                      {link.label}
                    </Link>
                  </Box>
                ))}
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Bottom Bar */}
        <Box
          sx={{
            mt: 6,
            pt: 4,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {currentYear} Cartback. Todos os direitos reservados.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            CNPJ: 00.000.000/0001-00
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}
