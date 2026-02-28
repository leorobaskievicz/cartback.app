import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material'
import { ArrowBack, Block, CheckCircle } from '@mui/icons-material'
import api from '../../services/api'
import TenantOverview from '../../components/admin/TenantOverview'
import TenantLogs from '../../components/admin/TenantLogs'
import TenantTemplates from '../../components/admin/TenantTemplates'
import TenantCarts from '../../components/admin/TenantCarts'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

interface TenantData {
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
  charts: {
    messagesByDay: any[]
  }
}

export default function TenantDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [data, setData] = useState<TenantData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchTenantDetails()
    }
  }, [id])

  const fetchTenantDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/admin/tenants/${id}`)
      setData(response.data)
    } catch (err: any) {
      console.error('Erro ao carregar tenant:', err)
      setError(err.response?.data?.error || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!data) return

    try {
      await api.patch(`/admin/tenants/${id}/toggle-status`)
      await fetchTenantDetails()
    } catch (err: any) {
      console.error('Erro ao alterar status:', err)
      alert('Erro ao alterar status do tenant')
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  if (error || !data) {
    return (
      <Box p={3}>
        <Alert severity="error">{error || 'Tenant não encontrado'}</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/admin/tenants')}
          sx={{ mt: 2 }}
        >
          Voltar
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/admin/tenants')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box flex={1}>
          <Typography variant="h4">{data.tenant.name}</Typography>
          <Typography variant="body2" color="textSecondary">
            {data.tenant.email}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Chip
            label={data.tenant.subscription?.plan_type || 'N/A'}
            color="primary"
            variant="outlined"
          />
          <Chip
            icon={data.tenant.is_active ? <CheckCircle /> : <Block />}
            label={data.tenant.is_active ? 'Ativo' : 'Inativo'}
            color={data.tenant.is_active ? 'success' : 'default'}
          />
          <Button
            variant="outlined"
            color={data.tenant.is_active ? 'error' : 'success'}
            onClick={handleToggleStatus}
            size="small"
          >
            {data.tenant.is_active ? 'Desativar' : 'Ativar'}
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Card>
        <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)}>
          <Tab label="Visão Geral" />
          <Tab label="Logs de Mensagens" />
          <Tab label="Templates" />
          <Tab label="Carrinhos" />
        </Tabs>

        <CardContent>
          <TabPanel value={tab} index={0}>
            <TenantOverview data={data} />
          </TabPanel>
          <TabPanel value={tab} index={1}>
            <TenantLogs tenantId={Number(id)} />
          </TabPanel>
          <TabPanel value={tab} index={2}>
            <TenantTemplates tenantId={Number(id)} />
          </TabPanel>
          <TabPanel value={tab} index={3}>
            <TenantCarts tenantId={Number(id)} />
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  )
}
