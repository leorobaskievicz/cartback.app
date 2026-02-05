import { useState } from 'react'
import {
  Box,
  TextField,
  Grid,
  Typography,
  Divider,
  InputAdornment,
  Alert,
} from '@mui/material'
import { CreditCard as CardIcon } from '@mui/icons-material'

export interface CreditCardFormData {
  creditCard: {
    holderName: string
    number: string
    expiryMonth: string
    expiryYear: string
    ccv: string
  }
  holderInfo: {
    name: string
    email: string
    cpfCnpj: string
    postalCode: string
    addressNumber: string
    addressComplement?: string
    phone: string
  }
}

interface CreditCardFormProps {
  value: CreditCardFormData
  onChange: (data: CreditCardFormData) => void
  errors?: Record<string, string>
}

export default function CreditCardForm({ value, onChange, errors = {} }: CreditCardFormProps) {
  const updateField = (section: 'creditCard' | 'holderInfo', field: string, val: string) => {
    onChange({
      ...value,
      [section]: {
        ...value[section],
        [field]: val,
      },
    })
  }

  const formatCardNumber = (val: string) => {
    // Remove tudo que não é dígito
    const cleaned = val.replace(/\D/g, '')
    // Limita a 19 dígitos
    return cleaned.slice(0, 19)
  }

  const formatExpiry = (val: string, type: 'month' | 'year') => {
    const cleaned = val.replace(/\D/g, '')
    if (type === 'month') {
      // Limita a 2 dígitos
      const month = cleaned.slice(0, 2)
      // Ajusta para 01-12
      if (month.length === 2 && parseInt(month) > 12) {
        return '12'
      }
      if (month.length === 1 && parseInt(month) > 1) {
        return '0' + month
      }
      return month
    } else {
      // Limita a 4 dígitos para ano
      return cleaned.slice(0, 4)
    }
  }

  const formatCCV = (val: string) => {
    const cleaned = val.replace(/\D/g, '')
    return cleaned.slice(0, 4)
  }

  const formatCPFCNPJ = (val: string) => {
    const cleaned = val.replace(/\D/g, '')
    return cleaned.slice(0, 14)
  }

  const formatCEP = (val: string) => {
    const cleaned = val.replace(/\D/g, '')
    return cleaned.slice(0, 8)
  }

  const formatPhone = (val: string) => {
    const cleaned = val.replace(/\D/g, '')
    return cleaned.slice(0, 11)
  }

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Pagamento seguro</strong> - Seus dados são criptografados e processados com segurança.
      </Alert>

      {/* Dados do Cartão */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CardIcon fontSize="small" />
          Dados do Cartão
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nome no Cartão"
              placeholder="Como está impresso no cartão"
              value={value.creditCard.holderName}
              onChange={(e) => updateField('creditCard', 'holderName', e.target.value.toUpperCase())}
              error={!!errors['creditCard.holderName']}
              helperText={errors['creditCard.holderName']}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Número do Cartão"
              placeholder="0000 0000 0000 0000"
              value={value.creditCard.number}
              onChange={(e) => updateField('creditCard', 'number', formatCardNumber(e.target.value))}
              error={!!errors['creditCard.number']}
              helperText={errors['creditCard.number'] || '13-19 dígitos'}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CardIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={4}>
            <TextField
              fullWidth
              label="Mês"
              placeholder="MM"
              value={value.creditCard.expiryMonth}
              onChange={(e) => updateField('creditCard', 'expiryMonth', formatExpiry(e.target.value, 'month'))}
              error={!!errors['creditCard.expiryMonth']}
              helperText={errors['creditCard.expiryMonth']}
              required
            />
          </Grid>

          <Grid item xs={4}>
            <TextField
              fullWidth
              label="Ano"
              placeholder="AAAA"
              value={value.creditCard.expiryYear}
              onChange={(e) => updateField('creditCard', 'expiryYear', formatExpiry(e.target.value, 'year'))}
              error={!!errors['creditCard.expiryYear']}
              helperText={errors['creditCard.expiryYear']}
              required
            />
          </Grid>

          <Grid item xs={4}>
            <TextField
              fullWidth
              label="CVV"
              placeholder="000"
              value={value.creditCard.ccv}
              onChange={(e) => updateField('creditCard', 'ccv', formatCCV(e.target.value))}
              error={!!errors['creditCard.ccv']}
              helperText={errors['creditCard.ccv']}
              required
              type="password"
            />
          </Grid>
        </Grid>
      </Box>

      {/* Dados do Titular */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Dados do Titular
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nome Completo"
              value={value.holderInfo.name}
              onChange={(e) => updateField('holderInfo', 'name', e.target.value)}
              error={!!errors['holderInfo.name']}
              helperText={errors['holderInfo.name']}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={value.holderInfo.email}
              onChange={(e) => updateField('holderInfo', 'email', e.target.value)}
              error={!!errors['holderInfo.email']}
              helperText={errors['holderInfo.email']}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="CPF/CNPJ"
              placeholder="00000000000"
              value={value.holderInfo.cpfCnpj}
              onChange={(e) => updateField('holderInfo', 'cpfCnpj', formatCPFCNPJ(e.target.value))}
              error={!!errors['holderInfo.cpfCnpj']}
              helperText={errors['holderInfo.cpfCnpj'] || 'Apenas números'}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Telefone"
              placeholder="11999999999"
              value={value.holderInfo.phone}
              onChange={(e) => updateField('holderInfo', 'phone', formatPhone(e.target.value))}
              error={!!errors['holderInfo.phone']}
              helperText={errors['holderInfo.phone'] || 'DDD + número'}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="CEP"
              placeholder="00000000"
              value={value.holderInfo.postalCode}
              onChange={(e) => updateField('holderInfo', 'postalCode', formatCEP(e.target.value))}
              error={!!errors['holderInfo.postalCode']}
              helperText={errors['holderInfo.postalCode'] || 'Apenas números'}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Número"
              value={value.holderInfo.addressNumber}
              onChange={(e) => updateField('holderInfo', 'addressNumber', e.target.value)}
              error={!!errors['holderInfo.addressNumber']}
              helperText={errors['holderInfo.addressNumber']}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Complemento (opcional)"
              value={value.holderInfo.addressComplement || ''}
              onChange={(e) => updateField('holderInfo', 'addressComplement', e.target.value)}
            />
          </Grid>
        </Grid>
      </Box>

      <Alert severity="warning" sx={{ mt: 3 }}>
        O pagamento será processado imediatamente e sua assinatura será ativada na hora.
      </Alert>
    </Box>
  )
}
