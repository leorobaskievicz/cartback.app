import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Divider,
} from '@mui/material'
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  timelineItemClasses,
} from '@mui/lab'
import { Search, ShoppingCart, Send, CheckCircle, Cancel } from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { cartsApi } from '../services/api'
import type { AbandonedCart } from '../types'
import LoadingButton from '../components/common/LoadingButton'
import EmptyState from '../components/common/EmptyState'
import dayjs from 'dayjs'

export default function Carts() {
  const [carts, setCarts] = useState<AbandonedCart[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    loadCarts()
  }, [page, perPage, statusFilter])

  const loadCarts = async () => {
    setLoading(true)
    try {
      const params: any = {
        page: page + 1,
        perPage,
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      if (search) {
        params.search = search
      }

      const res = await cartsApi.list(params)
      setCarts(res.data.data.data)
      setTotal(res.data.data.meta.total)
    } catch (error: any) {
      enqueueSnackbar('Erro ao carregar carrinhos', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(0)
    loadCarts()
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleOpenDetails = async (cart: AbandonedCart) => {
    try {
      const res = await cartsApi.get(cart.id)
      const cartData = res.data.data.cart
      const messages = res.data.data.messages || []

      setSelectedCart({
        ...cartData,
        messages: messages,
      } as any)
      setDetailsOpen(true)
    } catch (error) {
      enqueueSnackbar('Erro ao carregar detalhes do carrinho', { variant: 'error' })
      console.error('Error loading cart details:', error)
    }
  }

  const handleCancel = async () => {
    if (!selectedCart) return

    setCancelLoading(true)
    try {
      await cartsApi.cancel(selectedCart.id)
      enqueueSnackbar('Carrinho cancelado com sucesso!', { variant: 'success' })
      setDetailsOpen(false)
      await loadCarts()
    } catch (error: any) {
      enqueueSnackbar('Erro ao cancelar carrinho', { variant: 'error' })
    } finally {
      setCancelLoading(false)
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
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Carrinhos Abandonados
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Acompanhe e gerencie os carrinhos abandonados
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Buscar por nome ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(0)
                }}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="pending">Pendente</MenuItem>
                <MenuItem value="recovered">Recuperado</MenuItem>
                <MenuItem value="completed">Concluído</MenuItem>
                <MenuItem value="expired">Expirado</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button variant="contained" fullWidth sx={{ height: '56px' }} onClick={handleSearch}>
                Buscar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          {loading && carts.length === 0 ? (
            <Typography align="center" color="text.secondary" py={4}>
              Carregando...
            </Typography>
          ) : carts.length === 0 ? (
            <EmptyState
              icon={<ShoppingCart />}
              title="Nenhum carrinho encontrado"
              description="Quando clientes abandonarem carrinhos, eles aparecerão aqui"
            />
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Telefone</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {carts.map((cart) => (
                    <TableRow key={cart.id} hover sx={{ cursor: 'pointer' }}>
                      <TableCell onClick={() => handleOpenDetails(cart)}>
                        {cart.customerName || 'Sem nome'}
                      </TableCell>
                      <TableCell onClick={() => handleOpenDetails(cart)}>
                        {cart.customerPhone}
                      </TableCell>
                      <TableCell align="right" onClick={() => handleOpenDetails(cart)}>
                        {cart.totalValue !== null
                          ? cart.totalValue.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })
                          : '-'}
                      </TableCell>
                      <TableCell onClick={() => handleOpenDetails(cart)}>
                        {getStatusChip(cart.status)}
                      </TableCell>
                      <TableCell onClick={() => handleOpenDetails(cart)}>
                        {dayjs(cart.createdAt).format('DD/MM/YYYY HH:mm')}
                      </TableCell>
                      <TableCell align="center">
                        <Button size="small" onClick={() => handleOpenDetails(cart)}>
                          Ver Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={perPage}
                onRowsPerPageChange={(e) => {
                  setPerPage(parseInt(e.target.value, 10))
                  setPage(0)
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detalhes do Carrinho</DialogTitle>
        <DialogContent>
          {selectedCart && (
            <Box>
              {/* Customer Info */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">
                    Cliente
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedCart.customerName || 'Sem nome'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">
                    Telefone
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedCart.customerPhone}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">
                    Valor Total
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedCart.totalValue !== null
                      ? selectedCart.totalValue.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })
                      : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>{getStatusChip(selectedCart.status)}</Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Cart Items */}
              <Typography variant="h6" gutterBottom>
                Itens do Carrinho
              </Typography>
              {selectedCart.items && selectedCart.items.length > 0 ? (
                <Box sx={{ mb: 3 }}>
                  {selectedCart.items.map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        gap: 2,
                        py: 1.5,
                        borderBottom: index < selectedCart.items!.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                      }}
                    >
                      {item.image && (
                        <Box
                          component="img"
                          src={item.image}
                          alt={item.name}
                          sx={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        />
                      )}
                      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {item.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Quantidade: {item.quantity}
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={600}>
                          {item.price.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Nenhum item disponível
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Cart URL Button */}
              {selectedCart.cartUrl && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Link do Carrinho
                  </Typography>
                  <Button
                    variant="outlined"
                    fullWidth
                    href={selectedCart.cartUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ mb: 3 }}
                  >
                    Visualizar Carrinho
                  </Button>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              {/* Message Timeline */}
              <Typography variant="h6" gutterBottom>
                Histórico de Mensagens
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Carrinho criado em: {dayjs(selectedCart.createdAt).format('DD/MM/YYYY HH:mm')}
              </Typography>
              {selectedCart.messages && selectedCart.messages.length > 0 ? (
                <Timeline
                  sx={{
                    [`& .${timelineItemClasses.root}:before`]: {
                      flex: 0,
                      padding: 0,
                    },
                  }}
                >
                  {selectedCart.messages.map((message, index) => {
                    const getStatusInfo = () => {
                      switch (message.status) {
                        case 'sent':
                          return { label: 'Enviada', color: 'success' as const, icon: <Send fontSize="small" /> }
                        case 'delivered':
                          return { label: 'Entregue', color: 'success' as const, icon: <CheckCircle fontSize="small" /> }
                        case 'read':
                          return { label: 'Lida', color: 'success' as const, icon: <CheckCircle fontSize="small" /> }
                        case 'failed':
                          return { label: 'Falhou', color: 'error' as const, icon: <Cancel fontSize="small" /> }
                        case 'cancelled':
                          return { label: 'Cancelada', color: 'grey' as const, icon: <Cancel fontSize="small" /> }
                        default:
                          return { label: 'Agendada', color: 'warning' as const, icon: <Send fontSize="small" /> }
                      }
                    }

                    const statusInfo = getStatusInfo()

                    // Calcular horário agendado baseado na criação do carrinho + delay
                    const scheduledAt = message.delayMinutes
                      ? dayjs(selectedCart.createdAt).add(message.delayMinutes, 'minute')
                      : null

                    // Data realizada (prioriza readAt > deliveredAt > sentAt)
                    const completedAt = message.readAt || message.deliveredAt || message.sentAt

                    return (
                      <TimelineItem key={index}>
                        <TimelineSeparator>
                          <TimelineDot color={statusInfo.color}>
                            {statusInfo.icon}
                          </TimelineDot>
                          {index < selectedCart.messages!.length - 1 && <TimelineConnector />}
                        </TimelineSeparator>
                        <TimelineContent>
                          <Typography variant="body2" fontWeight={600}>
                            {message.templateName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Status: {statusInfo.label}
                          </Typography>

                          {/* Data agendada */}
                          {scheduledAt && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              Previsto: {scheduledAt.format('DD/MM/YYYY HH:mm')}
                            </Typography>
                          )}

                          {/* Data realizada */}
                          {completedAt && (
                            <Typography
                              variant="caption"
                              color={statusInfo.color === 'success' ? 'success.main' : 'text.secondary'}
                              display="block"
                              fontWeight={600}
                            >
                              Realizado: {dayjs(completedAt).format('DD/MM/YYYY HH:mm')}
                            </Typography>
                          )}

                          {/* Erro */}
                          {message.errorMessage && (
                            <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                              Erro: {message.errorMessage}
                            </Typography>
                          )}
                        </TimelineContent>
                      </TimelineItem>
                    )
                  })}
                </Timeline>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma mensagem enviada
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedCart?.status === 'pending' && (
            <LoadingButton
              variant="outlined"
              color="error"
              onClick={handleCancel}
              loading={cancelLoading}
            >
              Cancelar Carrinho
            </LoadingButton>
          )}
          <Button onClick={() => setDetailsOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
