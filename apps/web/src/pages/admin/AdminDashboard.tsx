import { useEffect, useState } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  People,
  Message,
  ShoppingCart,
  CheckCircle,
  Error,
  TrendingUp,
} from '@mui/icons-material'
import api from '../../services/api'

interface DashboardData {
  cards: {
    tenants: {
      total: number
      active: number
      trial: number
    }
    messages: {
      total: number
      successful: number
      failed: number
      successRate: number
      today: number
      thisMonth: number
    }
    carts: {
      total: number
      recovered: number
    }
  }
  charts: {
    tenantGrowth: Array<{ date: string; count: number }>
    messagesByDay: Array<{ date: string; total: number; sent: number; failed: number }>
    planDistribution: Array<{ plan_type: string; count: number }>
  }
  tables: {
    topTenants: Array<{
      id: number
      name: string
      email: string
      message_count: number
    }>
    recentTenants: Array<{
      id: number
      name: string
      email: string
      is_active: boolean
      created_at: string
    }>
    recentFailures: Array<{
      id: number
      tenant_id: number
      customer_phone: string
      error_message: string
      provider: string
      created_at: string
      tenant: {
        id: number
        name: string
      }
    }>
  }
}

interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon: React.ReactNode
  color?: string
}

function StatCard({ title, value, subtitle, icon, color = 'primary.main' }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color, fontSize: 40 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/dashboard')
      setData(response.data)
    } catch (err: any) {
      console.error('Erro ao carregar dashboard:', err)
      setError(err.response?.data?.error || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!data) return null

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard Administrativo
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
        Visão geral do sistema
      </Typography>

      {/* Cards de estatísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total de Tenants"
            value={data.cards.tenants.total}
            subtitle={`${data.cards.tenants.active} ativos`}
            icon={<People />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Mensagens Enviadas"
            value={data.cards.messages.total.toLocaleString()}
            subtitle={`${data.cards.messages.today} hoje`}
            icon={<Message />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Taxa de Sucesso"
            value={`${data.cards.messages.successRate.toFixed(1)}%`}
            subtitle={`${data.cards.messages.failed} falhas`}
            icon={<CheckCircle />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Carrinhos Recuperados"
            value={data.cards.carts.recovered}
            subtitle={`de ${data.cards.carts.total} total`}
            icon={<ShoppingCart />}
            color="warning.main"
          />
        </Grid>
      </Grid>

      {/* Top Tenants */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top 10 Tenants Mais Ativos
              </Typography>
              <Box sx={{ mt: 2 }}>
                {data.tables.topTenants.map((tenant, index) => (
                  <Box
                    key={tenant.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      py: 1,
                      borderBottom: index < data.tables.topTenants.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="body2">
                      {index + 1}. {tenant.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {tenant.message_count} mensagens
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Últimas falhas */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Últimas Mensagens com Falha
              </Typography>
              <Box sx={{ mt: 2 }}>
                {data.tables.recentFailures.slice(0, 5).map((failure, index) => (
                  <Box
                    key={failure.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      py: 1.5,
                      borderBottom: index < 4 ? '1px solid' : 'none',
                      borderColor: 'divider',
                    }}
                  >
                    <Error sx={{ color: 'error.main', mr: 1, fontSize: 20 }} />
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight="medium">
                        {failure.tenant.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" display="block">
                        {failure.customer_phone} • {failure.provider}
                      </Typography>
                      <Typography variant="caption" color="error.main" display="block">
                        {failure.error_message?.substring(0, 60)}...
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
