import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material'
import { Search, Visibility, Block, CheckCircle } from '@mui/icons-material'
import api from '../../services/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Tenant {
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
  stats: {
    totalMessages: number
    totalCarts: number
  }
}

export default function TenantList() {
  const navigate = useNavigate()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [planFilter, setPlanFilter] = useState('')

  useEffect(() => {
    fetchTenants()
  }, [page, rowsPerPage, search, statusFilter, planFilter])

  const fetchTenants = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(planFilter && { plan: planFilter }),
      })

      const response = await api.get(`/admin/tenants?${params}`)
      setTenants(response.data.data)
      setTotal(response.data.meta.total)
    } catch (err: any) {
      console.error('Erro ao carregar tenants:', err)
      setError(err.response?.data?.error || 'Erro ao carregar tenants')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleViewTenant = (tenantId: number) => {
    navigate(`/admin/tenants/${tenantId}`)
  }

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'free':
        return 'default'
      case 'basic':
        return 'primary'
      case 'professional':
        return 'secondary'
      case 'enterprise':
        return 'success'
      default:
        return 'default'
    }
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gerenciar Tenants
      </Typography>

      {/* Filtros */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(0)
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="active">Ativos</MenuItem>
              <MenuItem value="inactive">Inativos</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Plano</InputLabel>
            <Select
              value={planFilter}
              label="Plano"
              onChange={(e) => {
                setPlanFilter(e.target.value)
                setPage(0)
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="free">Free</MenuItem>
              <MenuItem value="basic">Basic</MenuItem>
              <MenuItem value="professional">Professional</MenuItem>
              <MenuItem value="enterprise">Enterprise</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Tabela */}
      <Card>
        <TableContainer>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Plano</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="right">Mensagens</TableCell>
                  <TableCell align="right">Carrinhos</TableCell>
                  <TableCell>Criado em</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {tenant.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {tenant.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tenant.subscription?.plan_type || 'N/A'}
                        color={getPlanColor(tenant.subscription?.plan_type || '')}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={tenant.is_active ? <CheckCircle /> : <Block />}
                        label={tenant.is_active ? 'Ativo' : 'Inativo'}
                        color={tenant.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {tenant.stats.totalMessages.toLocaleString()}
                      </Typography>
                      {tenant.subscription && (
                        <Typography variant="caption" color="textSecondary">
                          {tenant.subscription.messages_used} / {tenant.subscription.messages_limit}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {tenant.stats.totalCarts.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {format(new Date(tenant.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleViewTenant(tenant.id)}
                        color="primary"
                      >
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Card>
    </Box>
  )
}
