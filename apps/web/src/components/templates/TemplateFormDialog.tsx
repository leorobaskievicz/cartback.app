import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Box,
  Typography,
  Paper,
  Alert,
  Chip,
  Tabs,
  Tab,
} from '@mui/material'
import { Add, Delete, Image, VideoLibrary, Description, Link as LinkIcon } from '@mui/icons-material'
import LoadingButton from '../common/LoadingButton'

interface TemplateButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'
  text: string
  url?: string
  phoneNumber?: string
}

interface TemplateFormData {
  name: string
  content: string // Usado por Evolution API
  delayMinutes: number
  isActive: boolean
  // Campos Meta API
  metaLanguage?: string
  metaCategory?: 'MARKETING' | 'UTILITY'
  headerType?: 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  headerText?: string
  headerMediaUrl?: string
  bodyText?: string // Template Meta com {{1}}, {{2}}...
  footerText?: string
  buttons?: TemplateButton[]
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )
}

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: TemplateFormData, isMetaMode: boolean) => Promise<void>
  template: any | null
  loading: boolean
  hasOfficialApi: boolean // Se tem WhatsApp API Oficial ativa
}

export default function TemplateFormDialog({
  open,
  onClose,
  onSave,
  template,
  loading,
  hasOfficialApi,
}: Props) {
  const [mode, setMode] = useState<'simple' | 'meta'>('simple')
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    content: '',
    delayMinutes: 60,
    isActive: true,
    metaLanguage: 'pt_BR',
    metaCategory: 'MARKETING',
    headerType: 'NONE',
    headerText: '',
    headerMediaUrl: '',
    bodyText: '',
    footerText: '',
    buttons: [],
  })

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        content: template.content,
        delayMinutes: template.delayMinutes,
        isActive: template.isActive,
        metaLanguage: template.metaLanguage || 'pt_BR',
        metaCategory: template.metaCategory || 'MARKETING',
        headerType: 'NONE',
        headerText: '',
        headerMediaUrl: '',
        bodyText: template.content,
        footerText: '',
        buttons: [],
      })
      // Se já tem metaComponents, é template Meta
      if (template.metaComponents) {
        setMode('meta')
        // TODO: Parse metaComponents para preencher form
      }
    } else {
      setFormData({
        name: '',
        content: '',
        delayMinutes: 60,
        isActive: true,
        metaLanguage: 'pt_BR',
        metaCategory: 'MARKETING',
        headerType: 'NONE',
        headerText: '',
        headerMediaUrl: '',
        bodyText: '',
        footerText: '',
        buttons: [],
      })
      setMode('simple')
    }
  }, [template, open])

  const handleSave = async () => {
    await onSave(formData, mode === 'meta')
  }

  const addButton = (type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER') => {
    const newButton: TemplateButton = { type, text: '' }
    setFormData({ ...formData, buttons: [...(formData.buttons || []), newButton] })
  }

  const removeButton = (index: number) => {
    const newButtons = formData.buttons?.filter((_, i) => i !== index) || []
    setFormData({ ...formData, buttons: newButtons })
  }

  const updateButton = (index: number, field: keyof TemplateButton, value: string) => {
    const newButtons = [...(formData.buttons || [])]
    newButtons[index] = { ...newButtons[index], [field]: value }
    setFormData({ ...formData, buttons: newButtons })
  }

  const countVariables = (text: string) => {
    const matches = text.match(/\{\{(\d+)\}\}/g)
    return matches ? matches.length : 0
  }

  const getVariableExamples = (count: number) => {
    const examples = ['João', 'Produto X e mais 2 itens', 'https://loja.com/cart/123', 'R$ 149,90', 'R$ 50,00', '20/02/2026', 'ABC123']
    return examples.slice(0, count)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {template ? 'Editar Template' : 'Novo Template'}
        {hasOfficialApi && !template && (
          <Box sx={{ mt: 1 }}>
            <Tabs value={mode === 'simple' ? 0 : 1} onChange={(_, v) => setMode(v === 0 ? 'simple' : 'meta')}>
              <Tab label="Modo Simples (Evolution API)" />
              <Tab label="Modo Completo (Meta API Oficial)" />
            </Tabs>
          </Box>
        )}
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Campos comuns */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nome do Template"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Recuperação de Carrinho - 1 hora"
              required
              helperText="Nome interno para identificação"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Delay (minutos)"
              value={formData.delayMinutes}
              onChange={(e) => setFormData({ ...formData, delayMinutes: parseInt(e.target.value) })}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Ativo"
            />
          </Grid>

          {/* MODO SIMPLES - Evolution API */}
          {mode === 'simple' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Conteúdo da Mensagem"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Oi {{nome}}! Vi que você deixou itens no carrinho 🛒&#10;&#10;{{produtos}}&#10;&#10;Total: {{total}}&#10;&#10;Finalize sua compra: {{link}}"
                required
                helperText="Use {{nome}}, {{produtos}}, {{link}}, {{total}} como variáveis"
              />
            </Grid>
          )}

          {/* MODO COMPLETO - Meta API */}
          {mode === 'meta' && (
            <>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Idioma</InputLabel>
                  <Select
                    value={formData.metaLanguage}
                    onChange={(e) => setFormData({ ...formData, metaLanguage: e.target.value })}
                    label="Idioma"
                  >
                    <MenuItem value="pt_BR">Português (Brasil)</MenuItem>
                    <MenuItem value="en_US">English (US)</MenuItem>
                    <MenuItem value="es">Español</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={formData.metaCategory}
                    onChange={(e) => setFormData({ ...formData, metaCategory: e.target.value as any })}
                    label="Categoria"
                  >
                    <MenuItem value="MARKETING">Marketing</MenuItem>
                    <MenuItem value="UTILITY">Utility (Notificações)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Header */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Cabeçalho (Header) - Opcional
                  </Typography>
                  <FormControl fullWidth sx={{ mt: 1 }}>
                    <InputLabel>Tipo de Header</InputLabel>
                    <Select
                      value={formData.headerType}
                      onChange={(e) => setFormData({ ...formData, headerType: e.target.value as any })}
                      label="Tipo de Header"
                    >
                      <MenuItem value="NONE">Nenhum</MenuItem>
                      <MenuItem value="TEXT">Texto</MenuItem>
                      <MenuItem value="IMAGE">Imagem</MenuItem>
                      <MenuItem value="VIDEO">Vídeo</MenuItem>
                      <MenuItem value="DOCUMENT">Documento</MenuItem>
                    </Select>
                  </FormControl>

                  {formData.headerType === 'TEXT' && (
                    <TextField
                      fullWidth
                      sx={{ mt: 2 }}
                      label="Texto do Header"
                      value={formData.headerText}
                      onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                      placeholder="Ex: Oferta Especial! ou Seu pedido {{1}}"
                      helperText="Pode usar 1 variável: {{1}}"
                    />
                  )}

                  {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(formData.headerType || '') && (
                    <TextField
                      fullWidth
                      sx={{ mt: 2 }}
                      label={`URL do ${formData.headerType === 'IMAGE' ? 'Imagem' : formData.headerType === 'VIDEO' ? 'Vídeo' : 'Documento'}`}
                      value={formData.headerMediaUrl}
                      onChange={(e) => setFormData({ ...formData, headerMediaUrl: e.target.value })}
                      placeholder="https://exemplo.com/imagem.jpg"
                      helperText="URL pública do arquivo"
                    />
                  )}
                </Paper>
              </Grid>

              {/* Body */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Corpo da Mensagem (Body) - Obrigatório
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    sx={{ mt: 1 }}
                    label="Texto do Body"
                    value={formData.bodyText}
                    onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
                    placeholder="Oi {{1}}! Vi que você deixou itens no carrinho 🛒&#10;&#10;{{2}}&#10;&#10;Total: {{3}}&#10;&#10;Finalize sua compra: {{4}}"
                    required
                    helperText={`Use {{1}}, {{2}}, {{3}}... para variáveis. Variáveis encontradas: ${countVariables(formData.bodyText || '')}`}
                  />
                  {countVariables(formData.bodyText || '') > 0 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="caption" fontWeight={600}>
                        Exemplos para as variáveis:
                      </Typography>
                      <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2 }}>
                        {getVariableExamples(countVariables(formData.bodyText || '')).map((ex, i) => (
                          <li key={i}>
                            <Typography variant="caption">
                              {`{{${i + 1}}}`} = {ex}
                            </Typography>
                          </li>
                        ))}
                      </Box>
                    </Alert>
                  )}
                </Paper>
              </Grid>

              {/* Footer */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Rodapé (Footer) - Opcional
                  </Typography>
                  <TextField
                    fullWidth
                    sx={{ mt: 1 }}
                    label="Texto do Footer"
                    value={formData.footerText}
                    onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                    placeholder="Ex: Aproveite! Válido até 20/02/2026"
                    helperText="Máximo 60 caracteres. Sem variáveis."
                    inputProps={{ maxLength: 60 }}
                  />
                </Paper>
              </Grid>

              {/* Buttons */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Botões - Opcional
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => addButton('QUICK_REPLY')}
                      disabled={(formData.buttons?.filter(b => b.type === 'QUICK_REPLY').length || 0) >= 3}
                    >
                      Resposta Rápida (máx 3)
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<LinkIcon />}
                      onClick={() => addButton('URL')}
                      disabled={(formData.buttons?.filter(b => b.type === 'URL').length || 0) >= 2}
                    >
                      Link (máx 2)
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => addButton('PHONE_NUMBER')}
                      disabled={(formData.buttons?.filter(b => b.type === 'PHONE_NUMBER').length || 0) >= 1}
                    >
                      Telefone (máx 1)
                    </Button>
                  </Box>

                  {formData.buttons?.map((button, index) => (
                    <Box key={index} sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'start' }}>
                      <Chip label={button.type} size="small" />
                      <TextField
                        size="small"
                        label="Texto do Botão"
                        value={button.text}
                        onChange={(e) => updateButton(index, 'text', e.target.value)}
                        sx={{ flexGrow: 1 }}
                      />
                      {button.type === 'URL' && (
                        <TextField
                          size="small"
                          label="URL"
                          value={button.url || ''}
                          onChange={(e) => updateButton(index, 'url', e.target.value)}
                          placeholder="https://loja.com"
                          sx={{ flexGrow: 1 }}
                        />
                      )}
                      {button.type === 'PHONE_NUMBER' && (
                        <TextField
                          size="small"
                          label="Telefone"
                          value={button.phoneNumber || ''}
                          onChange={(e) => updateButton(index, 'phoneNumber', e.target.value)}
                          placeholder="+5511999999999"
                          sx={{ flexGrow: 1 }}
                        />
                      )}
                      <IconButton size="small" onClick={() => removeButton(index)}>
                        <Delete />
                      </IconButton>
                    </Box>
                  ))}
                </Paper>
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <LoadingButton variant="contained" onClick={handleSave} loading={loading}>
          {template ? 'Atualizar' : 'Criar'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}
