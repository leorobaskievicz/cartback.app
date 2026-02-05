import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material'
import LoadingButton from './LoadingButton'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  confirmText?: string
  cancelText?: string
}

export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading = false,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          {cancelText}
        </Button>
        <LoadingButton onClick={onConfirm} variant="contained" color="error" loading={loading}>
          {confirmText}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}
