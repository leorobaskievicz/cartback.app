import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material'
import { Refresh as RefreshIcon, Visibility as ViewIcon } from '@mui/icons-material'
import { adminApi } from '../../services/api'
import dayjs from 'dayjs'
import { useSnackbar } from 'notistack'

interface Log {
  id: number
  tenant_id: number
  provider: 'evolution' | 'official'
  customer_phone: string
  customer_name: string | null
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'cancelled'
  message_content: string
  error_message: string | null
  error_code: string | null
  external_message_id: string | null
  created_at: string
  sent_at: string | null
  tenant?: {
    id: number
    name: string
    email: string
  }
}

const statusColors: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  sent: 'success',
  delivered: 'success',
  read: 'info',
  failed: 'error',
  queued: 'warning',
  cancelled: 'default',
}

const providerColors: Record<string, 'primary' | 'secondary'> = {
  evolution: 'primary',
  official: 'secondary',
}

export default function AdminLogs() {
  const { enqueueSnackbar } = useSnackbar()
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [total, setTotal] = useState(0)

  // Filtros
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [providerFilter, setProviderFilter] = useState('')

  useEffect(() => {
    loadLogs()
  }, [page, rowsPerPage, search, statusFilter, providerFilter])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const params: any = {
        page: page + 1,
        per_page: rowsPerPage,
      }

      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      if (providerFilter) params.provider = providerFilter

      const res = await adminApi.getLogs(params)
      setLogs(res.data.data)
      setTotal(res.data.meta.total)
    } catch (error) {
      console.error('Failed to load logs:', error)
      enqueueSnackbar('Erro ao carregar logs', { variant: 'error' })
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

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold">
          Logs de Mensagens
        </Typography>
        <IconButton onClick={loadLogs} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Buscar (telefone ou nome)"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setPage(0)
                  }}
                  label="Status"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="sent">Enviado</MenuItem>
                  <MenuItem value="delivered">Entregue</MenuItem>
                  <MenuItem value="read">Lido</MenuItem>
                  <MenuItem value="failed">Falhou</MenuItem>
                  <MenuItem value="queued">Na fila</MenuItem>
                  <MenuItem value="cancelled">Cancelado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Provider</InputLabel>
                <Select
                  value={providerFilter}
                  onChange={(e) => {
                    setProviderFilter(e.target.value)
                    setPage(0)
                  }}
                  label="Provider"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="evolution">Evolution API</MenuItem>
                  <MenuItem value="official">WhatsApp Official</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Tenant</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Provider</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Mensagem</TableCell>
                <TableCell>Erro</TableCell>
                <TableCell>Data</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Nenhum log encontrado
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>{log.id}</TableCell>
                    <TableCell>
                      <Stack>
                        <Typography variant="body2" fontWeight={500}>
                          {log.tenant?.name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {log.tenant_id}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack>
                        <Typography variant="body2">{log.customer_phone}</Typography>
                        {log.customer_name && (
                          <Typography variant="caption" color="text.secondary">
                            {log.customer_name}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.provider === 'evolution' ? 'Evolution' : 'Official'}
                        color={providerColors[log.provider]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.status}
                        color={statusColors[log.status]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={log.message_content}>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {log.message_content}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {log.error_message ? (
                        <Tooltip title={log.error_message}>
                          <Typography
                            variant="body2"
                            color="error"
                            sx={{
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {log.error_message}
                          </Typography>
                        </Tooltip>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack>
                        <Typography variant="body2">
                          {dayjs(log.created_at).format('DD/MM/YYYY HH:mm')}
                        </Typography>
                        {log.sent_at && (
                          <Typography variant="caption" color="text.secondary">
                            Enviado: {dayjs(log.sent_at).format('HH:mm')}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[25, 50, 100]}
          labelRowsPerPage="Logs por página:"
        />
      </Card>
    </Box>
  )
}
