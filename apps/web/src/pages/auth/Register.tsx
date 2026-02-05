import { useState, useEffect } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { Box, Card, TextField, Typography, Link, useTheme, alpha, Container } from '@mui/material'
import { useSnackbar } from 'notistack'
import { useAuth } from '../../contexts/AuthContext'
import LoadingButton from '../../components/common/LoadingButton'
import Logo from '../../components/common/Logo'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    tenantName: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const { register, user } = useAuth()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password.length < 6) {
      enqueueSnackbar('A senha deve ter no mínimo 6 caracteres', { variant: 'error' })
      return
    }

    setLoading(true)

    try {
      await register(formData)
      enqueueSnackbar('Conta criada com sucesso!', { variant: 'success' })
      navigate('/dashboard')
    } catch (error: any) {
      enqueueSnackbar(
        error.response?.data?.error?.message || 'Erro ao criar conta. Tente novamente.',
        { variant: 'error' }
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark
          ? `linear-gradient(135deg, ${alpha('#0D0D14', 0.95)} 0%, ${alpha('#1A1A2E', 0.95)} 100%)`
          : `linear-gradient(135deg, ${alpha('#FFFFFF', 0.95)} 0%, ${alpha('#F8F9FA', 0.95)} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: isDark
            ? 'radial-gradient(circle at 25% 25%, rgba(37, 211, 102, 0.05) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(18, 140, 126, 0.05) 0%, transparent 50%)'
            : 'radial-gradient(circle at 25% 25%, rgba(37, 211, 102, 0.08) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(18, 140, 126, 0.08) 0%, transparent 50%)',
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='${isDark ? '%23ffffff' : '%231a1a2e'}' fill-opacity='${isDark ? '0.02' : '0.03'}'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.5,
          pointerEvents: 'none',
        },
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Logo */}
          <Box sx={{ mb: 4 }}>
            <Logo size="md" variant="full" />
          </Box>

          {/* Card */}
          <Card
            elevation={0}
            sx={{
              p: 5,
              maxWidth: 520,
              width: '100%',
              backdropFilter: 'blur(20px)',
              backgroundColor: isDark ? alpha('#1A1A2E', 0.8) : alpha('#FFFFFF', 0.9),
              border: `1px solid ${isDark ? alpha('#B0B0C0', 0.1) : alpha('#4A4A5A', 0.1)}`,
              boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 8px 32px rgba(0, 0, 0, 0.08)',
            }}
          >
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography variant="h4" gutterBottom fontWeight={700}>
                Crie sua conta
              </Typography>
              <Typography color="text.secondary" fontWeight={500}>
                Comece a recuperar carrinhos abandonados hoje
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <TextField
                label="Seu nome"
                name="name"
                value={formData.name}
                onChange={handleChange}
                margin="normal"
                required
                autoFocus
                fullWidth
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                required
                fullWidth
              />
              <TextField
                label="Senha"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                margin="normal"
                required
                helperText="Mínimo 6 caracteres"
                fullWidth
              />
              <TextField
                label="Nome da sua loja"
                name="tenantName"
                value={formData.tenantName}
                onChange={handleChange}
                margin="normal"
                required
                fullWidth
              />
              <TextField
                label="Telefone (opcional)"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                margin="normal"
                placeholder="(11) 99999-9999"
                fullWidth
              />
              <LoadingButton
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                sx={{ mt: 3 }}
                loading={loading}
              >
                Criar Conta
              </LoadingButton>
            </form>

            <Typography align="center" sx={{ mt: 2 }} variant="body2" color="text.secondary">
              Já tem uma conta?{' '}
              <Link
                component={RouterLink}
                to="/login"
                sx={{
                  color: theme.palette.primary.main,
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Faça login
              </Link>
            </Typography>
          </Card>
        </Box>
      </Container>
    </Box>
  )
}
