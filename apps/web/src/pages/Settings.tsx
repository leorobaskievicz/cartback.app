import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Grid,
  Divider,
  Chip,
  Skeleton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { tenantApi, plansApi } from '../services/api'
import LoadingButton from '../components/common/LoadingButton'
import UsageBar from '../components/common/UsageBar'
import type { Subscription, PaymentHistory } from '../types'

export default function Settings() {
  const { tenant, setTenant } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpfCnpj: '',
  })
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [payments, setPayments] = useState<PaymentHistory[]>([])
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoadingData(true)
    try {
      const [tenantRes, subRes, paymentsRes] = await Promise.all([
        tenantApi.get(),
        plansApi.getSubscription(),
        plansApi.getPayments().catch(() => ({ data: { data: [] } })),
      ])

      const tenantData = tenantRes.data.data
      setFormData({
        name: tenantData.name || '',
        email: tenantData.email || '',
        phone: tenantData.phone || '',
        cpfCnpj: tenantData.cpfCnpj || '',
      })
      setTenant(tenantData)
      setSubscription(subRes.data.data)
      setPayments(paymentsRes.data.data)
    } catch (error: any) {
      console.error('Error loading data:', error)
      enqueueSnackbar('Erro ao carregar dados', { variant: 'error' })
    } finally {
      setLoadingData(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value

    // Máscara para CPF/CNPJ
    if (e.target.name === 'cpfCnpj') {
      // Remove tudo que não é dígito
      value = value.replace(/\D/g, '')
      // Limita a 14 dígitos
      value = value.slice(0, 14)
    }

    setFormData((prev) => ({ ...prev, [e.target.name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      enqueueSnackbar('O nome é obrigatório', { variant: 'error' })
      return
    }

    setLoading(true)
    try {
      const dataToSend: { name?: string; email?: string; phone?: string; cpfCnpj?: string } = {}
      if (formData.name) dataToSend.name = formData.name
      if (formData.email) dataToSend.email = formData.email
      if (formData.phone) dataToSend.phone = formData.phone
      if (formData.cpfCnpj) dataToSend.cpfCnpj = formData.cpfCnpj

      const res = await tenantApi.update(dataToSend)
      setTenant(res.data.data)
      enqueueSnackbar('Configurações salvas com sucesso!', { variant: 'success' })
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || 'Erro ao salvar configurações'
      enqueueSnackbar(errorMsg, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    setCancelling(true)
    try {
      await plansApi.cancel()
      enqueueSnackbar('Assinatura cancelada com sucesso', { variant: 'success' })
      setCancelDialogOpen(false)
      loadAllData()
    } catch (error: any) {
      enqueueSnackbar('Erro ao cancelar assinatura', { variant: 'error' })
    } finally {
      setCancelling(false)
    }
  }

  const getPlanColor = (plan: string) => {
    if (plan === 'trial') return 'warning'
    if (plan === 'business') return 'success'
    return 'primary'
  }

  const getStatusColor = (status: string) => {
    if (status === 'active') return 'success'
    if (status === 'trial') return 'info'
    if (status === 'pending') return 'warning'
    return 'error'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Ativo',
      trial: 'Trial',
      pending: 'Pendente',
      past_due: 'Vencido',
      cancelled: 'Cancelado',
    }
    return labels[status] || status
  }

  const getPaymentStatusColor = (status: string) => {
    if (status === 'confirmed' || status === 'received') return 'success'
    if (status === 'pending') return 'warning'
    return 'error'
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Configurações
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Gerencie as informações da sua conta e plano
      </Typography>

      <Grid container spacing={3}>
        {/* Informações da Loja */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Informações da Loja
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {loadingData ? (
                <>
                  <Skeleton variant="rounded" height={56} sx={{ mb: 2 }} />
                  <Skeleton variant="rounded" height={56} sx={{ mb: 2 }} />
                  <Skeleton variant="rounded" height={56} sx={{ mb: 2 }} />
                  <Skeleton variant="rounded" height={56} sx={{ mb: 2 }} />
                  <Skeleton variant="rounded" height={40} width={180} sx={{ mt: 3 }} />
                </>
              ) : (
                <form onSubmit={handleSubmit}>
                  <TextField
                    label="Nome da loja"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    required
                  />
                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    helperText="Email para notificações"
                  />
                  <TextField
                    label="Telefone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    placeholder="(11) 99999-9999"
                  />
                  <TextField
                    label="CPF/CNPJ"
                    name="cpfCnpj"
                    value={formData.cpfCnpj}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    placeholder="Digite apenas números"
                    helperText={
                      formData.cpfCnpj
                        ? formData.cpfCnpj.length === 11
                          ? '✓ CPF válido (11 dígitos)'
                          : formData.cpfCnpj.length === 14
                            ? '✓ CNPJ válido (14 dígitos)'
                            : `${formData.cpfCnpj.length} dígitos - CPF precisa de 11 ou CNPJ de 14`
                        : 'Obrigatório para assinatura de planos pagos'
                    }
                    error={
                      formData.cpfCnpj.length > 0 &&
                      formData.cpfCnpj.length !== 11 &&
                      formData.cpfCnpj.length !== 14
                    }
                  />

                  <LoadingButton type="submit" variant="contained" sx={{ mt: 3 }} loading={loading}>
                    Salvar Alterações
                  </LoadingButton>
                </form>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Plano Atual */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Plano Atual
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {loadingData || !subscription ? (
                <>
                  <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
                  <Skeleton variant="text" />
                  <Skeleton variant="text" />
                </>
              ) : (
                <Box>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Chip
                      label={subscription.planName}
                      color={getPlanColor(subscription.plan)}
                      sx={{ mb: 1, fontSize: 16, px: 2, py: 3 }}
                    />
                    <br />
                    <Chip
                      label={getStatusLabel(subscription.status)}
                      color={getStatusColor(subscription.status)}
                      size="small"
                    />
                  </Box>

                  {subscription.plan !== 'trial' && (
                    <Typography variant="h5" fontWeight={700} textAlign="center" sx={{ mb: 2 }}>
                      {formatPrice(subscription.price)}
                      <Typography variant="caption" color="text.secondary">
                        /mês
                      </Typography>
                    </Typography>
                  )}

                  {subscription.status === 'trial' && subscription.trialEndsAt && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      textAlign="center"
                      sx={{ mb: 2 }}
                    >
                      {subscription.isTrialExpired
                        ? '⚠️ Trial expirado'
                        : `${subscription.daysRemaining} ${subscription.daysRemaining === 1 ? 'dia' : 'dias'} restantes`}
                    </Typography>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Uso de mensagens
                    </Typography>
                    <UsageBar
                      used={subscription.messagesUsed}
                      limit={subscription.messagesLimit}
                      label="mensagens"
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Templates criados
                    </Typography>
                    <UsageBar
                      used={subscription.templatesUsed}
                      limit={subscription.templatesLimit === -1 ? 999 : subscription.templatesLimit}
                      label={subscription.templatesLimit === -1 ? 'ilimitados' : 'templates'}
                      showWarning={subscription.templatesLimit !== -1}
                    />
                  </Box>

                  {subscription.currentPeriodEnd && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Próxima renovação: {formatDate(subscription.currentPeriodEnd)}
                    </Typography>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate('/dashboard/plans')}
                    sx={{ mb: 1 }}
                  >
                    {subscription.plan === 'trial' ? 'Escolher plano' : 'Alterar plano'}
                  </Button>

                  {subscription.plan !== 'trial' && subscription.status !== 'cancelled' && (
                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      onClick={() => setCancelDialogOpen(true)}
                    >
                      Cancelar assinatura
                    </Button>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Histórico de Pagamentos */}
        {payments.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Histórico de Pagamentos
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Data</TableCell>
                      <TableCell>Valor</TableCell>
                      <TableCell>Método</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Vencimento</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.createdAt)}</TableCell>
                        <TableCell>{formatPrice(payment.amount)}</TableCell>
                        <TableCell>
                          {payment.paymentMethod === 'pix'
                            ? 'PIX'
                            : payment.paymentMethod === 'credit_card'
                              ? 'Cartão'
                              : 'Boleto'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={payment.status}
                            color={getPaymentStatusColor(payment.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatDate(payment.dueDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Dialog de confirmação de cancelamento */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancelar assinatura</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja cancelar sua assinatura? Você perderá acesso aos recursos do
            plano ao final do período atual.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={cancelling}>
            Não, manter
          </Button>
          <Button onClick={handleCancelSubscription} color="error" disabled={cancelling}>
            {cancelling ? 'Cancelando...' : 'Sim, cancelar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
