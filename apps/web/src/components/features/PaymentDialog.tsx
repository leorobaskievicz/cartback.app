import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Alert, IconButton, Snackbar } from '@mui/material'
import { ContentCopy as CopyIcon, OpenInNew as OpenIcon } from '@mui/icons-material'
import { useState } from 'react'

interface PaymentDialogProps {
  open: boolean
  payment: {
    paymentMethod: string
    pixQrCode: string | null
    pixCopyPaste: string | null
    boletoUrl: string | null
    invoiceUrl: string | null
  } | null
  onClose: () => void
}

export default function PaymentDialog({ open, payment, onClose }: PaymentDialogProps) {
  const [copied, setCopied] = useState(false)

  if (!payment) return null

  const copyPixCode = () => {
    if (payment.pixCopyPaste) {
      navigator.clipboard.writeText(payment.pixCopyPaste)
      setCopied(true)
    }
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {payment.paymentMethod === 'pix'
            ? 'Pague com PIX'
            : payment.paymentMethod === 'boleto'
              ? 'Boleto gerado'
              : 'Pagamento'}
        </DialogTitle>
        <DialogContent>
          {payment.paymentMethod === 'pix' && payment.pixQrCode && (
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={`data:image/png;base64,${payment.pixQrCode}`}
                alt="QR Code PIX"
                style={{ maxWidth: 250, margin: '0 auto' }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                Ou copie o código:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                    color: (theme) => theme.palette.mode === 'dark' ? 'grey.100' : 'grey.900',
                    p: 1,
                    borderRadius: 1,
                    maxWidth: 300,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {payment.pixCopyPaste?.slice(0, 40)}...
                </Typography>
                <IconButton onClick={copyPixCode} size="small">
                  <CopyIcon />
                </IconButton>
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                Após o pagamento, seu plano será ativado automaticamente em instantes.
              </Alert>
            </Box>
          )}

          {payment.paymentMethod === 'boleto' && (
            <Box sx={{ textAlign: 'center' }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Seu boleto foi gerado. O prazo de compensação é de até 3 dias úteis.
              </Alert>
              {payment.boletoUrl && (
                <Button
                  variant="contained"
                  startIcon={<OpenIcon />}
                  href={payment.boletoUrl}
                  target="_blank"
                >
                  Abrir boleto
                </Button>
              )}
            </Box>
          )}

          {payment.paymentMethod === 'credit_card' && (
            <Box sx={{ textAlign: 'center' }}>
              <Alert severity="success">Pagamento processado! Seu plano já está ativo.</Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fechar</Button>
          {payment.invoiceUrl && (
            <Button href={payment.invoiceUrl} target="_blank">
              Ver fatura completa
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Código copiado!"
      />
    </>
  )
}
