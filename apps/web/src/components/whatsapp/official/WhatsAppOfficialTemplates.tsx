import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  IconButton,
  Tooltip,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  Add,
  Delete,
  Sync,
  ExpandMore,
  CheckCircle,
  HourglassEmpty,
  Cancel,
  Visibility,
} from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { whatsappOfficialApi } from '../../../services/api'
import type { WhatsAppOfficialTemplate, TemplateComponent } from '../../../types'
import LoadingButton from '../../common/LoadingButton'
import ConfirmDialog from '../../common/ConfirmDialog'

const STATUS_LABELS: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'default' }> = {
  APPROVED: { label: 'Aprovado', color: 'success' },
  PENDING: { label: 'Pendente', color: 'warning' },
  REJECTED: { label: 'Rejeitado', color: 'error' },
  PAUSED: { label: 'Pausado', color: 'default' },
  DISABLED: { label: 'Desabilitado', color: 'default' },
}

const CATEGORY_LABELS: Record<string, string> = {
  MARKETING: 'Marketing',
  UTILITY: 'Utilidade',
  AUTHENTICATION: 'Autenticação',
}

export default function WhatsAppOfficialTemplates() {
  const [templates, setTemplates] = useState<WhatsAppOfficialTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [viewTemplate, setViewTemplate] = useState<WhatsAppOfficialTemplate | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const res = await whatsappOfficialApi.listTemplates()
      setTemplates(res.data.data)
    } catch (error: any) {
      enqueueSnackbar('Erro ao carregar templates', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await whatsappOfficialApi.syncTemplates()
      enqueueSnackbar(res.data.data.message, { variant: 'success' })
      await loadTemplates()
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || 'Erro ao sincronizar templates'
      enqueueSnackbar(msg, { variant: 'error' })
    } finally {
      setSyncing(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await whatsappOfficialApi.deleteTemplate(deleteId)
      enqueueSnackbar('Template removido com sucesso', { variant: 'success' })
      setDeleteId(null)
      await loadTemplates()
    } catch (error: any) {
      enqueueSnackbar('Erro ao remover template', { variant: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle fontSize="small" color="success" />
      case 'PENDING': return <HourglassEmpty fontSize="small" color="warning" />
      case 'REJECTED': return <Cancel fontSize="small" color="error" />
      default: return null
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>Templates Oficiais</Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie seus templates aprovados pela Meta para disparos via API Oficial
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <LoadingButton
            variant="outlined"
            startIcon={<Sync />}
            onClick={handleSync}
            loading={syncing}
            size="small"
          >
            Sincronizar com Meta
          </LoadingButton>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateOpen(true)}
            size="small"
          >
            Criar Template
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Templates precisam ser aprovados pela Meta antes de serem usados. O processo pode levar algumas horas.
        Use "Sincronizar com Meta" para atualizar o status dos seus templates.
      </Alert>

      {loading ? (
        <Card><CardContent>
          {[...Array(3)].map((_, i) => <Skeleton key={i} height={60} sx={{ mb: 1 }} />)}
        </CardContent></Card>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">
              Nenhum template encontrado. Crie um template ou sincronize com a Meta.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell>Idioma</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Preview</TableCell>
                <TableCell>Criado em</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((template) => {
                const statusInfo = STATUS_LABELS[template.status] || { label: template.status, color: 'default' as const }
                return (
                  <TableRow key={template.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {template.displayName || template.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          {template.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={CATEGORY_LABELS[template.category] || template.category} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{template.language}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {getStatusIcon(template.status)}
                        <Chip
                          label={statusInfo.label}
                          color={statusInfo.color}
                          size="small"
                        />
                      </Box>
                      {template.rejectionReason && (
                        <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5 }}>
                          {template.rejectionReason}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {template.bodyText || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(template.createdAt).toLocaleDateString('pt-BR')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver detalhes">
                        <IconButton size="small" onClick={() => setViewTemplate(template)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Deletar">
                        <IconButton size="small" color="error" onClick={() => setDeleteId(template.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal de Criação de Template */}
      <CreateTemplateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false)
          loadTemplates()
        }}
      />

      {/* Modal de Visualização */}
      <Dialog open={!!viewTemplate} onClose={() => setViewTemplate(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalhes do Template: {viewTemplate?.displayName || viewTemplate?.name}
        </DialogTitle>
        <DialogContent>
          {viewTemplate && (
            <Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Nome técnico</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{viewTemplate.name}</Typography>
              </Box>
              <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                <Chip label={CATEGORY_LABELS[viewTemplate.category]} size="small" />
                <Chip label={viewTemplate.language} size="small" variant="outlined" />
                <Chip
                  label={STATUS_LABELS[viewTemplate.status]?.label || viewTemplate.status}
                  color={STATUS_LABELS[viewTemplate.status]?.color || 'default'}
                  size="small"
                />
              </Box>
              <Typography variant="subtitle2" gutterBottom>Componentes:</Typography>
              {viewTemplate.components?.map((comp, i) => (
                <Accordion key={i} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="body2" fontWeight={500}>{comp.type}</Typography>
                    {comp.format && <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>({comp.format})</Typography>}
                  </AccordionSummary>
                  <AccordionDetails>
                    {comp.text && <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{comp.text}</Typography>}
                    {comp.buttons && comp.buttons.map((btn, j) => (
                      <Box key={j} sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">{btn.type}: </Typography>
                        <Typography variant="body2" component="span">{btn.text}</Typography>
                        {btn.url && <Typography variant="caption" color="primary.main" sx={{ ml: 1 }}>{btn.url}</Typography>}
                      </Box>
                    ))}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewTemplate(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deleteId}
        title="Deletar template?"
        message="Este template será deletado da Meta e do banco de dados. Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
        confirmText="Deletar"
      />
    </Box>
  )
}

// ===========================
// Dialog para criar template
// ===========================

interface CreateTemplateDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

function CreateTemplateDialog({ open, onClose, onSuccess }: CreateTemplateDialogProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    displayName: '',
    category: 'UTILITY' as 'MARKETING' | 'UTILITY' | 'AUTHENTICATION',
    language: 'pt_BR',
    triggerType: 'abandoned_cart' as 'abandoned_cart' | 'order_confirmation',
    delayMinutes: 30,
    bodyText: '',
    footerText: '',
  })
  const { enqueueSnackbar } = useSnackbar()

  const handleCreate = async () => {
    if (!form.name || !form.bodyText) {
      enqueueSnackbar('Nome e texto do corpo são obrigatórios', { variant: 'warning' })
      return
    }

    if (!/^[a-z0-9_]+$/.test(form.name)) {
      enqueueSnackbar('O nome deve conter apenas letras minúsculas, números e underscore', { variant: 'warning' })
      return
    }

    const components: TemplateComponent[] = [
      { type: 'BODY', text: form.bodyText },
    ]

    if (form.footerText) {
      components.push({ type: 'FOOTER', text: form.footerText })
    }

    setSaving(true)
    try {
      await whatsappOfficialApi.createTemplate({
        name: form.name,
        displayName: form.displayName || undefined,
        category: form.category,
        language: form.language,
        components,
        triggerType: form.triggerType,
        delayMinutes: form.delayMinutes,
      })
      enqueueSnackbar('Template criado! Aguardando aprovação da Meta.', { variant: 'success' })
      setForm({ name: '', displayName: '', category: 'UTILITY', language: 'pt_BR', triggerType: 'abandoned_cart', delayMinutes: 30, bodyText: '', footerText: '' })
      onSuccess()
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || 'Erro ao criar template'
      enqueueSnackbar(msg, { variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Criar Novo Template</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Alert severity="info" sx={{ mb: 1 }}>
            Templates precisam ser aprovados pela Meta. Após criar, aguarde a revisão (geralmente algumas horas).
            <br />
            <strong>Variáveis disponíveis:</strong> {`{{1}}`} = nome, {`{{2}}`} = produto(s), {`{{3}}`} = link do carrinho, {`{{4}}`} = valor total
          </Alert>
          <TextField
            fullWidth
            label="Nome técnico"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
            helperText="Apenas letras minúsculas, números e underscore. Ex: recuperacao_carrinho"
            required
          />
          <TextField
            fullWidth
            label="Nome de exibição (opcional)"
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            helperText="Nome amigável para identificação interna"
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Gatilho</InputLabel>
              <Select
                value={form.triggerType}
                onChange={(e) => setForm((f) => ({ ...f, triggerType: e.target.value as any }))}
                label="Gatilho"
              >
                <MenuItem value="abandoned_cart">Carrinho Abandonado</MenuItem>
                <MenuItem value="order_confirmation">Confirmação de Pedido</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Delay (minutos)"
              type="number"
              value={form.delayMinutes}
              onChange={(e) => setForm((f) => ({ ...f, delayMinutes: parseInt(e.target.value) || 0 }))}
              helperText="Tempo após o evento"
              inputProps={{ min: 0 }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Categoria</InputLabel>
              <Select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as any }))}
                label="Categoria"
              >
                <MenuItem value="MARKETING">Marketing</MenuItem>
                <MenuItem value="UTILITY">Utilidade</MenuItem>
                <MenuItem value="AUTHENTICATION">Autenticação</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Idioma</InputLabel>
              <Select
                value={form.language}
                onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
                label="Idioma"
              >
                <MenuItem value="pt_BR">Português (BR)</MenuItem>
                <MenuItem value="en_US">English (US)</MenuItem>
                <MenuItem value="es_AR">Español (AR)</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Texto do corpo (Body)"
            value={form.bodyText}
            onChange={(e) => setForm((f) => ({ ...f, bodyText: e.target.value }))}
            helperText="Use {{1}}, {{2}}... para variáveis dinâmicas. Ex: Olá {{1}}, seu carrinho está esperando!"
            required
          />
          <TextField
            fullWidth
            label="Rodapé (Footer) — opcional"
            value={form.footerText}
            onChange={(e) => setForm((f) => ({ ...f, footerText: e.target.value }))}
            helperText="Texto de rodapé (máx. 60 caracteres)"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <LoadingButton variant="contained" onClick={handleCreate} loading={saving}>
          Criar Template
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}
