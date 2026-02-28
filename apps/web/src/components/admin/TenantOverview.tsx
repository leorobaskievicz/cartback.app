import { Grid, Card, CardContent, Typography, Box, Chip } from '@mui/material'
import {
  Message,
  ShoppingCart,
  Template,
  CheckCircle,
  Error,
  Visibility,
} from '@mui/icons-material'
import dayjs from 'dayjs'

interface TenantOverviewProps {
  data: {
    tenant: {
      id: number
      uuid: string
      name: string
      email: string
      is_active: boolean
      created_at: string
      subscription?: {
        plan_type: string
        status: string
        messages_limit: number
        messages_used: number
      }
    }
    stats: {
      messages: {
        total: number
        sent: number
        failed: number
        delivered: number
        read: number
      }
      carts: {
        total: number
        pending: number
        recovered: number
      }
      templates: number
    }
    integrations: {
      whatsappInstances: any[]
      officialCredentials: any[]
      stores: any[]
    }
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

export default function TenantOverview({ data }: TenantOverviewProps) {
  const successRate =
    data.stats.messages.total > 0
      ? ((data.stats.messages.sent / data.stats.messages.total) * 100).toFixed(1)
      : '0'

  const recoveryRate =
    data.stats.carts.total > 0
      ? ((data.stats.carts.recovered / data.stats.carts.total) * 100).toFixed(1)
      : '0'

  return (
    <Box>
      {/* Estatísticas principais */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total de Mensagens"
            value={data.stats.messages.total.toLocaleString()}
            subtitle={`${data.stats.messages.sent} enviadas`}
            icon={<Message />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Taxa de Sucesso"
            value={`${successRate}%`}
            subtitle={`${data.stats.messages.failed} falhas`}
            icon={<CheckCircle />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Carrinhos"
            value={data.stats.carts.total}
            subtitle={`${data.stats.carts.pending} pendentes`}
            icon={<ShoppingCart />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Templates"
            value={data.stats.templates}
            subtitle="configurados"
            icon={<Template />}
            color="info.main"
          />
        </Grid>
      </Grid>

      {/* Informações do plano */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informações da Assinatura
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" py={1}>
                  <Typography variant="body2" color="textSecondary">
                    Plano
                  </Typography>
                  <Chip
                    label={data.tenant.subscription?.plan_type || 'N/A'}
                    color="primary"
                    size="small"
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" py={1}>
                  <Typography variant="body2" color="textSecondary">
                    Status
                  </Typography>
                  <Chip
                    label={data.tenant.subscription?.status || 'N/A'}
                    size="small"
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" py={1}>
                  <Typography variant="body2" color="textSecondary">
                    Mensagens Usadas
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {data.tenant.subscription?.messages_used || 0} /{' '}
                    {data.tenant.subscription?.messages_limit || 0}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" py={1}>
                  <Typography variant="body2" color="textSecondary">
                    Criado em
                  </Typography>
                  <Typography variant="body2">
                    {dayjs(data.tenant.created_at).format('DD/MM/YYYY HH:mm')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Integrações */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Integrações Configuradas
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" py={1}>
                  <Typography variant="body2" color="textSecondary">
                    WhatsApp (Evolution)
                  </Typography>
                  <Chip
                    label={`${data.integrations.whatsappInstances.length} conectada(s)`}
                    size="small"
                    color={data.integrations.whatsappInstances.length > 0 ? 'success' : 'default'}
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" py={1}>
                  <Typography variant="body2" color="textSecondary">
                    WhatsApp Oficial (Meta)
                  </Typography>
                  <Chip
                    label={`${data.integrations.officialCredentials.length} configurada(s)`}
                    size="small"
                    color={data.integrations.officialCredentials.length > 0 ? 'success' : 'default'}
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" py={1}>
                  <Typography variant="body2" color="textSecondary">
                    Lojas
                  </Typography>
                  <Chip
                    label={`${data.integrations.stores.length} integrada(s)`}
                    size="small"
                    color={data.integrations.stores.length > 0 ? 'success' : 'default'}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detalhes de mensagens */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Detalhamento de Mensagens
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {data.stats.messages.sent}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Enviadas
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="info.main">
                  {data.stats.messages.delivered}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Entregues
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary.main">
                  {data.stats.messages.read}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Lidas
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="error.main">
                  {data.stats.messages.failed}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Falhas
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}
