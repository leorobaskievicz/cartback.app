import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material'
import { Pix as PixIcon, CreditCard as CardIcon, Receipt as BoletoIcon } from '@mui/icons-material'
import { Plan } from '../../types'
import CreditCardForm, { CreditCardFormData } from './CreditCardForm'

interface CheckoutDialogProps {
  open: boolean
  plan: Plan | null
  onClose: () => void
  onConfirm: (billingType: string, creditCardData?: CreditCardFormData) => Promise<void>
  loading?: boolean
}

const initialCardData: CreditCardFormData = {
  creditCard: {
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: '',
  },
  holderInfo: {
    name: '',
    email: '',
    cpfCnpj: '',
    postalCode: '',
    addressNumber: '',
    addressComplement: '',
    phone: '',
  },
}

export default function CheckoutDialog({
  open,
  plan,
  onClose,
  onConfirm,
  loading,
}: CheckoutDialogProps) {
  const [billingType, setBillingType] = useState('CREDIT_CARD')
  const [cardData, setCardData] = useState<CreditCardFormData>(initialCardData)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateCardData = (): boolean => {
    const errors: Record<string, string> = {}

    // Validar dados do cartão
    if (!cardData.creditCard.holderName || cardData.creditCard.holderName.length < 3) {
      errors['creditCard.holderName'] = 'Nome inválido'
    }

    const cardNumber = cardData.creditCard.number
    if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
      errors['creditCard.number'] = 'Número do cartão inválido'
    }

    const month = parseInt(cardData.creditCard.expiryMonth)
    if (!month || month < 1 || month > 12) {
      errors['creditCard.expiryMonth'] = 'Mês inválido'
    }

    const year = parseInt(cardData.creditCard.expiryYear)
    const currentYear = new Date().getFullYear()
    if (!year || year < currentYear || year > currentYear + 20) {
      errors['creditCard.expiryYear'] = 'Ano inválido'
    }

    const ccv = cardData.creditCard.ccv
    if (!ccv || ccv.length < 3 || ccv.length > 4) {
      errors['creditCard.ccv'] = 'CVV inválido'
    }

    // Validar dados do titular
    if (!cardData.holderInfo.name || cardData.holderInfo.name.length < 3) {
      errors['holderInfo.name'] = 'Nome inválido'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!cardData.holderInfo.email || !emailRegex.test(cardData.holderInfo.email)) {
      errors['holderInfo.email'] = 'Email inválido'
    }

    const cpfCnpj = cardData.holderInfo.cpfCnpj
    if (!cpfCnpj || (cpfCnpj.length !== 11 && cpfCnpj.length !== 14)) {
      errors['holderInfo.cpfCnpj'] = 'CPF/CNPJ inválido'
    }

    const cep = cardData.holderInfo.postalCode
    if (!cep || cep.length !== 8) {
      errors['holderInfo.postalCode'] = 'CEP inválido'
    }

    if (!cardData.holderInfo.addressNumber) {
      errors['holderInfo.addressNumber'] = 'Número obrigatório'
    }

    const phone = cardData.holderInfo.phone
    if (!phone || phone.length < 10 || phone.length > 11) {
      errors['holderInfo.phone'] = 'Telefone inválido'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleConfirm = async () => {
    if (billingType === 'CREDIT_CARD') {
      if (!validateCardData()) {
        return
      }
      await onConfirm(billingType, cardData)
    } else {
      await onConfirm(billingType)
    }
  }

  const handleClose = () => {
    setCardData(initialCardData)
    setValidationErrors({})
    setBillingType('CREDIT_CARD')
    onClose()
  }

  if (!plan) return null

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Assinar plano {plan.name}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={700}>
            {plan.priceFormatted}
            <Typography variant="body1" color="text.secondary" component="span">
              /mês
            </Typography>
          </Typography>
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          Forma de pagamento
        </Typography>
        <ToggleButtonGroup
          value={billingType}
          exclusive
          onChange={(_, value) => {
            if (value) {
              setBillingType(value)
              setValidationErrors({})
            }
          }}
          fullWidth
          sx={{ mb: 3 }}
        >
          <ToggleButton value="CREDIT_CARD">
            <CardIcon sx={{ mr: 1 }} /> Cartão
          </ToggleButton>
          <ToggleButton value="BOLETO">
            <BoletoIcon sx={{ mr: 1 }} /> Boleto
          </ToggleButton>
          <ToggleButton value="PIX">
            <PixIcon sx={{ mr: 1 }} /> PIX
          </ToggleButton>
        </ToggleButtonGroup>

        {billingType === 'CREDIT_CARD' && (
          <Alert severity="success">
            Aprovação instantânea! Seu plano é ativado imediatamente após a confirmação.
          </Alert>
        )}

        {billingType === 'PIX' && (
          <Alert severity="info">
            Pagamento instantâneo. Acesso liberado na hora após o pagamento!
            <br />
            <small>
              ⚠️ Certifique-se de ter uma chave PIX ativa no painel do Asaas para receber pagamentos.
            </small>
          </Alert>
        )}

        {billingType === 'BOLETO' && (
          <Alert severity="warning">
            Boleto pode levar até 3 dias úteis para compensar. Seu plano será ativado após a confirmação do pagamento.
          </Alert>
        )}

        {billingType === 'CREDIT_CARD' && (
          <CreditCardForm
            value={cardData}
            onChange={setCardData}
            errors={validationErrors}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={loading}
          size="large"
        >
          {loading ? <CircularProgress size={24} /> : 'Confirmar Pagamento'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
