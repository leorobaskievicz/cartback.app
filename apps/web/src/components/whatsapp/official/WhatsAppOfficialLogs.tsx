import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Pagination,
  Skeleton,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { whatsappOfficialApi } from '../../../services/api'
import type { WhatsAppOfficialLog, WhatsAppOfficialLogStats, PaginatedResponse } from '../../../types'

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  queued: 'default',
  sent: 'primary',
  delivered: 'success',
  read: 'success',
  failed: 'error',
}

const STATUS_LABELS: Record<string, string> = {
  queued: 'Na Fila',
  sent: 'Enviado',
  delivered: 'Entregue',
  read: 'Lido',
  failed: 'Falhou',
}

export default function WhatsAppOfficialLogs() {
  const [logs, setLogs] = useState<PaginatedResponse<WhatsAppOfficialLog> | null>(null)
  const [stats, setStats] = useState<WhatsAppOfficialLogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ status: '', templateName: '', phone: '' })
  const [viewLog, setViewLog] = useState<WhatsAppOfficialLog | null>(null)
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    loadLogs()
  }, [page, filters])

  useEffect(() => {
    loadStats()
  }, [])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const res = await whatsappOfficialApi.listLogs({
        page,
        perPage: 20,
        status: filters.status || undefined,
        templateName: filters.templateName || undefined,
        phone: filters.phone || undefined,
      })
      setLogs(res.data.data)
    } catch (error: any) {
      enqueueSnackbar('Erro ao carregar logs', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    setStatsLoading(true)
    try {
      const res = await whatsappOfficialApi.getLogStats()
      setStats(res.data.data)
    } catch (error: any) {
      // Silently fail
    } finally {
      setStatsLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setPage(1)
    setFilters((f) => ({ ...f, [key]: value }))
  }

  return (
    <Box>
      {/* Stats */}
      {statsLoading ? (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[...Array(4)].map((_, i) => (
            <Grid item xs={6} md={3} key={i}>
              <Skeleton height={100} variant="rectangular" sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      ) : stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" fontWeight={700}>{stats.total}</Typography>
                <Typography variant="body2" color="text.secondary">Total Enviados</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" fontWeight={700} color="success.main">{stats.delivered}</Typography>
                <Typography variant="body2" color="text.secondary">Entregues</Typography>
                <LinearProgress
                  variant="determinate"
                  value={stats.deliveryRate}
                  color="success"
                  sx={{ mt: 1, borderRadius: 1 }}
                />
                <Typography variant="caption" color="text.secondary">{stats.deliveryRate}%</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" fontWeight={700} color="primary.main">{stats.read}</Typography>
                <Typography variant="body2" color="text.secondary">Lidos</Typography>
                <LinearProgress
                  variant="determinate"
                  value={stats.readRate}
                  color="primary"
                  sx={{ mt: 1, borderRadius: 1 }}
                />
                <Typography variant="caption" color="text.secondary">{stats.readRate}%</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" fontWeight={700} color="error.main">{stats.failed}</Typography>
                <Typography variant="body2" color="text.secondary">Falharam</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtros */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Filtrar por telefone"
                value={filters.phone}
                onChange={(e) => handleFilterChange('phone', e.target.value)}
                placeholder="Ex: 11999999999"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Filtrar por template"
                value={filters.templateName}
                onChange={(e) => handleFilterChange('templateName', e.target.value)}
                placeholder="Nome do template"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="queued">Na Fila</MenuItem>
                  <MenuItem value="sent">Enviado</MenuItem>
                  <MenuItem value="delivered">Entregue</MenuItem>
                  <MenuItem value="read">Lido</MenuItem>
                  <MenuItem value="failed">Falhou</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabela */}
      {loading ? (
        <Card><CardContent>
          {[...Array(5)].map((_, i) => <Skeleton key={i} height={50} sx={{ mb: 1 }} />)}
        </CardContent></Card>
      ) : !logs || logs.data.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">
              Nenhum log encontrado com os filtros aplicados.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Destinatário</TableCell>
                  <TableCell>Template</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Enviado em</TableCell>
                  <TableCell>Entregue em</TableCell>
                  <TableCell>Lido em</TableCell>
                  <TableCell>Data</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.data.map((log) => (
                  <TableRow
                    key={log.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setViewLog(log)}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{log.recipientName || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{log.recipientPhone}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {log.templateName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABELS[log.status] || log.status}
                        color={STATUS_COLORS[log.status] || 'default'}
                        size="small"
                      />
                      {log.errorMessage && (
                        <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5 }}>
                          {log.errorMessage}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {log.sentAt ? new Date(log.sentAt).toLocaleTimeString('pt-BR') : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {log.deliveredAt ? new Date(log.deliveredAt).toLocaleTimeString('pt-BR') : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {log.readAt ? new Date(log.readAt).toLocaleTimeString('pt-BR') : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(log.createdAt).toLocaleDateString('pt-BR')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {logs.meta.lastPage > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={logs.meta.lastPage}
                page={page}
                onChange={(_, p) => setPage(p)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Log detail dialog */}
      <Dialog open={!!viewLog} onClose={() => setViewLog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Detalhes do Log #{viewLog?.id}</DialogTitle>
        <DialogContent>
          {viewLog && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Destinatário</Typography>
                <Typography variant="body2">{viewLog.recipientName} — {viewLog.recipientPhone}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Template</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{viewLog.templateName}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={STATUS_LABELS[viewLog.status] || viewLog.status}
                    color={STATUS_COLORS[viewLog.status] || 'default'}
                    size="small"
                  />
                </Box>
              </Box>
              {viewLog.metaMessageId && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Meta Message ID</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {viewLog.metaMessageId}
                  </Typography>
                </Box>
              )}
              {viewLog.errorMessage && (
                <Alert severity="error">
                  <Typography variant="body2">{viewLog.errorMessage}</Typography>
                  {viewLog.errorCode && (
                    <Typography variant="caption">Código: {viewLog.errorCode}</Typography>
                  )}
                </Alert>
              )}
              {viewLog.bodyParams && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Parâmetros</Typography>
                  <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem', overflow: 'auto' }}>
                    {JSON.stringify(viewLog.bodyParams, null, 2)}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Enviado em</Typography>
                  <Typography variant="body2">
                    {viewLog.sentAt ? new Date(viewLog.sentAt).toLocaleString('pt-BR') : '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Entregue em</Typography>
                  <Typography variant="body2">
                    {viewLog.deliveredAt ? new Date(viewLog.deliveredAt).toLocaleString('pt-BR') : '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Lido em</Typography>
                  <Typography variant="body2">
                    {viewLog.readAt ? new Date(viewLog.readAt).toLocaleString('pt-BR') : '—'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewLog(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
