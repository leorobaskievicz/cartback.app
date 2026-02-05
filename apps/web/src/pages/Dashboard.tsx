import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material'
import {
  ShoppingCart,
  Send,
  CheckCircle,
  AttachMoney,
} from '@mui/icons-material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useSnackbar } from 'notistack'
import { dashboardApi, cartsApi, plansApi } from '../services/api'
import type { DashboardStats, ChartData, AbandonedCart, Subscription } from '../types'
import StatCard from '../components/common/StatCard'
import TrialBanner from '../components/common/TrialBanner'
import UsageBar from '../components/common/UsageBar'
import dayjs from 'dayjs'

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [recentCarts, setRecentCarts] = useState<AbandonedCart[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, chartRes, cartsRes, subRes] = await Promise.all([
        dashboardApi.stats(),
        dashboardApi.chart(),
        cartsApi.list({ perPage: 5 }),
        plansApi.getSubscription().catch(() => null),
      ])

      setStats(statsRes.data.data)
      setChartData(chartRes.data.data)
      setRecentCarts(cartsRes.data.data.data)
      if (subRes) setSubscription(subRes.data.data)
    } catch (error: any) {
      enqueueSnackbar('Erro ao carregar dashboard', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const getStatusChip = (status: string) => {
    const configs: Record<string, { label: string; color: 'warning' | 'success' | 'info' | 'default' }> = {
      pending: { label: 'Pendente', color: 'warning' },
      recovered: { label: 'Recuperado', color: 'success' },
      completed: { label: 'Concluído', color: 'info' },
      expired: { label: 'Expirado', color: 'default' },
    }
    const config = configs[status] || { label: status, color: 'default' as const }
    return <Chip label={config.label} color={config.color} size="small" />
  }

  return (
    <Box>
      {/* Trial Banner */}
      {subscription && subscription.status === 'trial' && (
        <TrialBanner
          daysRemaining={subscription.daysRemaining}
          isExpired={subscription.isTrialExpired}
        />
      )}

      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          fontWeight={800}
          letterSpacing="-0.02em"
          sx={{
            background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          Dashboard
        </Typography>

        {/* Usage Bar */}
        {subscription && (
          <Card sx={{ mt: 2, mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Uso mensal
              </Typography>
              <UsageBar
                used={subscription.messagesUsed}
                limit={subscription.messagesLimit}
                label="mensagens"
              />
            </CardContent>
          </Card>
        )}
        <Typography variant="body1" color="text.secondary" fontWeight={500}>
          Acompanhe métricas e performance em tempo real
        </Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Carrinhos Abandonados"
            value={stats?.totalCarts || 0}
            icon={<ShoppingCart />}
            color="warning"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Mensagens Enviadas"
            value={stats?.messagesSent || 0}
            icon={<Send />}
            color="info"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Carrinhos Recuperados"
            value={stats?.recoveredCarts || 0}
            icon={<CheckCircle />}
            color="success"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Valor Recuperado"
            value={
              stats?.totalRecovered
                ? stats.totalRecovered.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : 'R$ 0,00'
            }
            icon={<AttachMoney />}
            color="primary"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Gráfico */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Últimos 30 dias
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="carts" stroke="#f59e0b" name="Carrinhos" />
              <Line type="monotone" dataKey="recovered" stroke="#22c55e" name="Recuperados" />
              <Line type="monotone" dataKey="messages" stroke="#3b82f6" name="Mensagens" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Carrinhos Recentes */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Carrinhos Recentes
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>Telefone</TableCell>
                <TableCell align="right">Valor</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Data</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentCarts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary">Nenhum carrinho ainda</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                recentCarts.map((cart) => (
                  <TableRow key={cart.id}>
                    <TableCell>{cart.customerName || 'Sem nome'}</TableCell>
                    <TableCell>{cart.customerPhone}</TableCell>
                    <TableCell align="right">
                      {cart.totalValue !== null
                        ? cart.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : '-'}
                    </TableCell>
                    <TableCell>{getStatusChip(cart.status)}</TableCell>
                    <TableCell>{dayjs(cart.createdAt).format('DD/MM/YYYY HH:mm')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  )
}
