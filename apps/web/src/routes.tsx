import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAuth } from './contexts/AuthContext'
import DashboardLayout from './components/layout/DashboardLayout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import Integrations from './pages/Integrations'
import WhatsApp from './pages/WhatsApp'
import Templates from './pages/Templates'
import Carts from './pages/Carts'
import Settings from './pages/Settings'
import Plans from './pages/Plans'
import LandingPage from './pages/landingpage'

interface PrivateRouteProps {
  children: React.ReactNode
}

function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, loading } = useAuth()

  console.log('🔒 PrivateRoute:', { user: user?.email, loading })

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    console.log('❌ PrivateRoute: No user, redirecting to login')
    return <Navigate to="/login" replace />
  }

  console.log('✅ PrivateRoute: User authenticated, rendering children')
  return <>{children}</>
}

function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  // Se estiver autenticado, redireciona para o dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  // Caso contrário, mostra a landing page
  return <LandingPage />
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Private Routes */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="carts" element={<Carts />} />
        <Route path="templates" element={<Templates />} />
        <Route path="whatsapp" element={<WhatsApp />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="plans" element={<Plans />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
