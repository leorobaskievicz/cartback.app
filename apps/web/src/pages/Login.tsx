import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  useTheme,
  alpha,
} from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../components/common/Logo'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login({ email, password })
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao fazer login')
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
          <Paper
            elevation={0}
            sx={{
              padding: 5,
              width: '100%',
              backdropFilter: 'blur(20px)',
              backgroundColor: isDark ? alpha('#1A1A2E', 0.8) : alpha('#FFFFFF', 0.9),
              border: `1px solid ${isDark ? alpha('#B0B0C0', 0.1) : alpha('#4A4A5A', 0.1)}`,
              boxShadow: isDark
                ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                : '0 8px 32px rgba(0, 0, 0, 0.08)',
            }}
          >
            <Typography component="h1" variant="h4" align="center" gutterBottom fontWeight={700}>
              Bem-vindo de volta
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
              Faça login para acessar sua conta
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Senha"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Não tem uma conta?{' '}
                  <Link
                    to="/register"
                    style={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Cadastre-se
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  )
}
