import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Paper,
  Switch,
  FormControlLabel,
  Alert,
  Tooltip,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  DragIndicator,
  Send,
  Lock,
  Sync,
  CheckCircle,
  HourglassEmpty,
  Error,
  Help,
} from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { useNavigate } from 'react-router-dom'
import { templatesApi, plansApi, whatsappOfficialApi } from '../services/api'
import type { MessageTemplate, Subscription } from '../types'
import LoadingButton from '../components/common/LoadingButton'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import TemplateFormDialog from '../components/templates/TemplateFormDialog'

export default function Templates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasOfficialApi, setHasOfficialApi] = useState(false)
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState<MessageTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    delayMinutes: 60,
    isActive: true,
  })
  const [testPhoneNumber, setTestPhoneNumber] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    loadTemplates()
    loadOfficialApiStatus()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const [templatesRes, subRes] = await Promise.all([
        templatesApi.list(),
        plansApi.getSubscription().catch(() => null),
      ])
      setTemplates(templatesRes.data.data)
      if (subRes) setSubscription(subRes.data.data)
    } catch (error: any) {
      enqueueSnackbar('Erro ao carregar templates', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const loadOfficialApiStatus = async () => {
    try {
      const res = await whatsappOfficialApi.getCredentials()
      // isActive vem como 1 (number) do banco, então usar !! para converter para boolean
      const isActive = res.data.data.configured && !!res.data.data.credential?.isActive
      console.log('🔍 Templates.tsx - loadOfficialApiStatus:', { configured: res.data.data.configured, isActive: res.data.data.credential?.isActive, result: isActive })
      setHasOfficialApi(isActive)
    } catch (error) {
      console.log('🔍 Templates.tsx - loadOfficialApiStatus ERROR:', error)
      setHasOfficialApi(false)
    }
  }

  const isLimitReached =
    subscription && subscription.templatesLimit !== -1 && templates.length >= subscription.templatesLimit

  const handleOpenDialog = (template?: MessageTemplate) => {
    if (template) {
      setCurrentTemplate(template)
      setFormData({
        name: template.name,
        content: template.content,
        delayMinutes: template.delayMinutes,
        isActive: template.isActive,
      })
    } else {
      setCurrentTemplate(null)
      setFormData({
        name: '',
        content: '',
        delayMinutes: 60,
        isActive: true,
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setCurrentTemplate(null)
  }

  const handleSave = async (data: any, isMetaMode: boolean) => {
    setSaveLoading(true)
    try {
      const payload = isMetaMode
        ? { ...data, metaMode: true }
        : {
            name: data.name,
            content: data.content,
            delayMinutes: data.delayMinutes,
            isActive: data.isActive,
          }

      if (currentTemplate) {
        await templatesApi.update(currentTemplate.id, payload)
        enqueueSnackbar('Template atualizado com sucesso!', { variant: 'success' })
      } else {
        await templatesApi.create(payload)
        enqueueSnackbar('Template criado com sucesso!', { variant: 'success' })
      }
      handleCloseDialog()
      await loadTemplates()
    } catch (error: any) {
      const errorMsg = error.response?.data?.error?.message || 'Erro ao salvar template'
      enqueueSnackbar(errorMsg, { variant: 'error' })
    } finally {
      setSaveLoading(false)
    }
  }

  const handleToggleActive = async (template: MessageTemplate) => {
    try {
      await templatesApi.update(template.id, { isActive: !template.isActive })
      enqueueSnackbar(
        `Template ${!template.isActive ? 'ativado' : 'desativado'} com sucesso!`,
        { variant: 'success' }
      )
      await loadTemplates()
    } catch (error: any) {
      enqueueSnackbar('Erro ao atualizar template', { variant: 'error' })
    }
  }

  const handleDeleteClick = (template: MessageTemplate) => {
    setCurrentTemplate(template)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!currentTemplate) return

    setDeleteLoading(true)
    try {
      await templatesApi.delete(currentTemplate.id)
      enqueueSnackbar('Template deletado com sucesso!', { variant: 'success' })
      setDeleteDialogOpen(false)
      setCurrentTemplate(null)
      await loadTemplates()
    } catch (error: any) {
      enqueueSnackbar('Erro ao deletar template', { variant: 'error' })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleTestClick = (template: MessageTemplate) => {
    setCurrentTemplate(template)
    setTestPhoneNumber('')
    setTestDialogOpen(true)
  }

  const handleTestSend = async () => {
    if (!currentTemplate || !testPhoneNumber) {
      enqueueSnackbar('Preencha o número de telefone', { variant: 'error' })
      return
    }

    setTestLoading(true)
    try {
      await templatesApi.test(currentTemplate.id, testPhoneNumber)
      enqueueSnackbar('Mensagem de teste enviada com sucesso!', { variant: 'success' })
      setTestDialogOpen(false)
      setTestPhoneNumber('')
      setCurrentTemplate(null)
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error?.message || 'Erro ao enviar mensagem de teste'
      enqueueSnackbar(errorMsg, { variant: 'error' })
    } finally {
      setTestLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncLoading(true)
    try {
      const response = await templatesApi.sync()
      const { sentToMeta, importedFromMeta, updated } = response.data.data
      enqueueSnackbar(
        `Sincronização concluída! Enviados: ${sentToMeta}, Importados: ${importedFromMeta}, Atualizados: ${updated}`,
        { variant: 'success' }
      )
      await loadTemplates()
    } catch (error: any) {
      enqueueSnackbar('Erro ao sincronizar templates', { variant: 'error' })
    } finally {
      setSyncLoading(false)
    }
  }

  const getMetaStatusBadge = (template: MessageTemplate) => {
    if (!template.metaStatus || template.metaStatus === 'not_synced') {
      return (
        <Tooltip title="Não sincronizado com Meta WhatsApp API (funciona apenas com Evolution API)">
          <Chip
            icon={<Help />}
            label="Evolution Only"
            size="small"
            variant="outlined"
            sx={{ borderColor: 'grey.400', color: 'text.secondary' }}
          />
        </Tooltip>
      )
    }

    if (template.metaStatus === 'approved') {
      return (
        <Tooltip title="Template aprovado pela Meta - pode ser usado na API Oficial">
          <Chip
            icon={<CheckCircle />}
            label="Meta Approved"
            size="small"
            color="success"
            variant="outlined"
          />
        </Tooltip>
      )
    }

    if (template.metaStatus === 'pending') {
      return (
        <Tooltip title="Template enviado para Meta - aguardando aprovação (pode levar até 24h)">
          <Chip
            icon={<HourglassEmpty />}
            label="Meta Pending"
            size="small"
            color="warning"
            variant="outlined"
          />
        </Tooltip>
      )
    }

    if (template.metaStatus === 'rejected') {
      return (
        <Tooltip
          title={`Rejeitado pela Meta: ${template.metaRejectionReason || 'Motivo não especificado'}`}
        >
          <Chip
            icon={<Error />}
            label="Meta Rejected"
            size="small"
            color="error"
            variant="outlined"
          />
        </Tooltip>
      )
    }

    return null
  }

  const getPreviewMessage = (message: string) => {
    return message
      .replace(/\{\{nome\}\}/g, 'João Silva')
      .replace(/\{\{produtos\}\}/g, '• Produto 1 - R$ 199,90\n• Produto 2 - R$ 99,90')
      .replace(/\{\{link\}\}/g, 'https://sua-loja.com/carrinho/abc123')
      .replace(/\{\{total\}\}/g, 'R$ 299,90')
  }

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Templates de Mensagens
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            Templates de Mensagens
          </Typography>
          <Typography color="text.secondary">
            Crie mensagens personalizadas para recuperar carrinhos
          </Typography>
          {subscription && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {templates.length} de{' '}
              {subscription.templatesLimit === -1 ? 'ilimitados' : subscription.templatesLimit}{' '}
              templates utilizados
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <LoadingButton
            variant="outlined"
            startIcon={<Sync />}
            onClick={handleSync}
            loading={syncLoading}
          >
            Sincronizar com Meta
          </LoadingButton>
          <Tooltip
            title={
              isLimitReached
                ? `Limite de templates atingido (${subscription?.templatesLimit}). Faça upgrade do plano.`
                : ''
            }
          >
            <span>
              <Button
                variant="contained"
                startIcon={isLimitReached ? <Lock /> : <Add />}
                onClick={() => handleOpenDialog()}
                disabled={!!isLimitReached}
              >
                Novo Template
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {isLimitReached && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Você atingiu o limite de templates do seu plano ({subscription?.templatesLimit} templates).{' '}
          <Button
            size="small"
            variant="text"
            onClick={() => navigate('/plans')}
            sx={{ textTransform: 'none' }}
          >
            Fazer upgrade
          </Button>
        </Alert>
      )}

      {templates.length === 0 ? (
        <EmptyState
          icon={<Add />}
          title="Nenhum template criado"
          description="Crie seu primeiro template de mensagem para começar a recuperar carrinhos abandonados"
          action={{
            label: 'Criar Template',
            onClick: () => handleOpenDialog(),
          }}
        />
      ) : (
        <Grid container spacing={3}>
          {templates.map((template) => (
            <Grid item xs={12} md={6} key={template.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <IconButton size="small" sx={{ cursor: 'grab', mr: 1 }}>
                      <DragIndicator />
                    </IconButton>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        <Typography variant="h6" fontWeight={600}>
                          {template.name}
                        </Typography>
                        <Chip
                          label={template.isActive ? 'Ativo' : 'Inativo'}
                          color={template.isActive ? 'success' : 'default'}
                          size="small"
                        />
                        {getMetaStatusBadge(template)}
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Enviar após {template.delayMinutes} minutos
                      </Typography>
                      {template.syncedAt && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Última sincronização: {new Date(template.syncedAt).toLocaleString('pt-BR')}
                        </Typography>
                      )}
                      {template.metaStatus === 'rejected' && template.metaRejectionReason && (
                        <Alert severity="error" sx={{ mt: 1, py: 0.5 }}>
                          <Typography variant="caption">
                            <strong>Rejeitado pela Meta:</strong> {template.metaRejectionReason}
                          </Typography>
                        </Alert>
                      )}
                    </Box>
                  </Box>

                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50',
                      borderRadius: 2,
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                      Pré-visualização:
                    </Typography>
                    <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap' }}>
                      {getPreviewMessage(template.content)}
                    </Typography>
                  </Paper>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" component="div">
                      <strong>Variáveis (use chaves duplas):</strong>
                      <br />
                      • {'{{'}<strong>nome</strong>{'}}'}  → Nome do cliente
                      <br />
                      • {'{{'}<strong>produtos</strong>{'}}'}  → Itens do carrinho
                      <br />
                      • {'{{'}<strong>link</strong>{'}}'}  → Link para finalizar compra
                      <br />
                      • {'{{'}<strong>total</strong>{'}}'}  → Valor total (R$)
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2, justifyContent: 'space-between' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={template.isActive}
                        onChange={() => handleToggleActive(template)}
                        size="small"
                      />
                    }
                    label={<Typography variant="body2">Ativo</Typography>}
                  />
                  <Box>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleTestClick(template)}
                      title="Testar template"
                    >
                      <Send fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenDialog(template)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteClick(template)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <TemplateFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSave}
        template={currentTemplate}
        loading={saveLoading}
        hasOfficialApi={hasOfficialApi}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Deletar Template?"
        message={`Você tem certeza que deseja deletar o template "${currentTemplate?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteDialogOpen(false)
          setCurrentTemplate(null)
        }}
        loading={deleteLoading}
        confirmText="Deletar"
      />

      {/* Test Template Dialog */}
      <Dialog
        open={testDialogOpen}
        onClose={() => !testLoading && setTestDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Testar Template</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
            Envie uma mensagem de teste do template "{currentTemplate?.name}" para um número de
            WhatsApp.
          </Typography>

          <TextField
            label="Número do WhatsApp"
            fullWidth
            margin="normal"
            value={testPhoneNumber}
            onChange={(e) => setTestPhoneNumber(e.target.value)}
            placeholder="5541999999999"
            helperText="Formato: código do país + DDD + número (ex: 5541999999999)"
            disabled={testLoading}
            autoFocus
          />

          {currentTemplate && (
            <Paper
              sx={{
                p: 2,
                mt: 2,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50',
                borderRadius: 2,
                border: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                Mensagem que será enviada:
              </Typography>
              <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                🧪 <strong>MENSAGEM DE TESTE</strong>
                {'\n\n'}
                {getPreviewMessage(currentTemplate.content)}
                {'\n\n'}
                <em>Esta é uma mensagem de teste do template "{currentTemplate.name}"</em>
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)} disabled={testLoading}>
            Cancelar
          </Button>
          <LoadingButton
            variant="contained"
            onClick={handleTestSend}
            loading={testLoading}
            startIcon={<Send />}
          >
            Enviar Teste
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
