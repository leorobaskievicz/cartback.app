import { useState, useEffect } from 'react'
import { Container, Typography, Grid, Box, CircularProgress } from '@mui/material'
import { useSnackbar } from 'notistack'
import PlanCard from '../components/features/PlanCard'
import CheckoutDialog from '../components/features/CheckoutDialog'
import PaymentDialog from '../components/features/PaymentDialog'
import { plansApi, tenantApi } from '../services/api'
import { Plan, Subscription, PaymentCheckout } from '../types'

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [payment, setPayment] = useState<PaymentCheckout['payment'] | null>(null)
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [plansRes, subRes] = await Promise.all([plansApi.list(), plansApi.getSubscription()])
      setPlans(plansRes.data.data)
      setSubscription(subRes.data.data)
    } catch (error) {
      enqueueSnackbar('Erro ao carregar planos', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = async (planId: string) => {
    const plan = plans.find((p) => p.id === planId)
    if (!plan) return

    // Verificar se tem CPF/CNPJ cadastrado
    try {
      const tenantRes = await tenantApi.get()
      const tenant = tenantRes.data.data

      if (!tenant.cpfCnpj) {
        enqueueSnackbar(
          '⚠️ CPF/CNPJ obrigatório! Por favor, cadastre em Configurações antes de assinar.',
          {
            variant: 'warning',
            autoHideDuration: 6000,
          }
        )
        return
      }

      setSelectedPlan(plan)
    } catch (error) {
      console.error('Error checking CPF:', error)
      setSelectedPlan(plan) // Em caso de erro, deixa continuar
    }
  }

  const handleCheckout = async (billingType: string, creditCardData?: any) => {
    if (!selectedPlan) return
    setCheckoutLoading(true)
    try {
      const response = await plansApi.checkout(selectedPlan.id, billingType, creditCardData)
      setPayment(response.data.data.payment)
      setSelectedPlan(null)

      const message = billingType === 'CREDIT_CARD'
        ? 'Pagamento aprovado! Sua assinatura está ativa.'
        : 'Assinatura criada! Complete o pagamento.'

      enqueueSnackbar(message, { variant: 'success' })
      loadData() // Recarrega subscription
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao processar assinatura'
      enqueueSnackbar(message, { variant: 'error' })
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Escolha seu plano
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Todos os planos incluem integração com Nuvemshop, dashboard de métricas e suporte por
          email.
        </Typography>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        {plans.map((plan) => (
          <Grid item xs={12} sm={6} md={4} key={plan.id}>
            <PlanCard
              plan={plan}
              currentPlan={subscription?.plan || 'trial'}
              recommended={plan.id === 'pro'}
              onSelect={handleSelectPlan}
              loading={checkoutLoading}
            />
          </Grid>
        ))}
      </Grid>

      <CheckoutDialog
        open={!!selectedPlan}
        plan={selectedPlan}
        onClose={() => setSelectedPlan(null)}
        onConfirm={handleCheckout}
        loading={checkoutLoading}
      />

      <PaymentDialog
        open={!!payment}
        payment={payment}
        onClose={() => setPayment(null)}
      />
    </Container>
  )
}
