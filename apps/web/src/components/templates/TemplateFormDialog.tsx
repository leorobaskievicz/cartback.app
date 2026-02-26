import { useState, useEffect, useRef } from 'react'
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
  Card,
  CardContent,
  Stack,
  Divider,
  Tooltip,
} from '@mui/material'
import {
  Add,
  Delete,
  Image,
  VideoLibrary,
  Description,
  Link as LinkIcon,
  Phone,
  Reply,
  SmartButton,
  Close,
  ContentCopy,
  Visibility,
} from '@mui/icons-material'
import LoadingButton from '../common/LoadingButton'

interface TemplateButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'
  text: string
  url?: string
  phoneNumber?: string
}

interface TemplateFormData {
  name: string
  content: string
  triggerType?: 'abandoned_cart' | 'manual'
  delayMinutes: number
  isActive: boolean
  metaLanguage?: string
  metaCategory?: 'MARKETING' | 'UTILITY'
  headerType?: 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  headerText?: string
  headerMediaUrl?: string
  headerExample?: string  // Exemplo para {{1}} no header
  bodyText?: string
  bodyExamples?: string[]  // Exemplos para {{1}}, {{2}}, {{3}}, {{4}}...
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
  hasOfficialApi: boolean
}

// Variáveis disponíveis
const EVOLUTION_VARIABLES = [
  { key: 'nome', label: 'Nome do Cliente', example: 'João Silva' },
  { key: 'produtos', label: 'Produtos', example: 'Produto X e mais 2 itens' },
  { key: 'link', label: 'Link do Carrinho', example: 'https://loja.com/cart/123' },
  { key: 'total', label: 'Valor Total', example: 'R$ 149,90' },
]

// Variáveis nomeadas para o usuário (serão convertidas para {{1}}, {{2}}, etc no backend)
const META_VARIABLES = [
  { key: 'nome', label: 'Nome do Cliente', example: 'João Silva' },
  { key: 'produtos', label: 'Produtos do Carrinho', example: 'Produto X e mais 2 itens' },
  { key: 'link', label: 'Link do Carrinho', example: 'https://loja.com/cart/123' },
  { key: 'total', label: 'Valor Total', example: 'R$ 149,90' },
]

export default function TemplateFormDialog({
  open,
  onClose,
  onSave,
  template,
  loading,
  hasOfficialApi,
}: Props) {
  console.log('🔍 TemplateFormDialog - hasOfficialApi:', hasOfficialApi)

  const [mode, setMode] = useState<'simple' | 'meta'>('simple')
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    content: '',
    triggerType: 'abandoned_cart',
    delayMinutes: 60,
    isActive: true,
    metaLanguage: 'pt_BR',
    metaCategory: 'MARKETING',
    headerType: 'NONE',
    headerText: '',
    headerMediaUrl: '',
    headerExample: '',
    bodyText: '',
    bodyExamples: [],
    footerText: '',
    buttons: [],
  })

  // Refs para inserção de variáveis
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const bodyTextRef = useRef<HTMLTextAreaElement>(null)
  const headerTextRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        content: template.content || '',
        triggerType: template.triggerType || 'abandoned_cart',
        delayMinutes: template.delayMinutes,
        isActive: template.isActive,
        metaLanguage: template.metaLanguage || 'pt_BR',
        metaCategory: template.metaCategory || 'MARKETING',
        headerType: 'NONE',
        headerText: '',
        headerMediaUrl: '',
        headerExample: '',
        bodyText: template.content || '',
        bodyExamples: [],
        footerText: '',
        buttons: [],
      })
      if (template.metaComponents) {
        setMode('meta')
      }
    } else {
      setFormData({
        name: '',
        content: '',
        triggerType: 'abandoned_cart',
        delayMinutes: 60,
        isActive: true,
        metaLanguage: 'pt_BR',
        metaCategory: 'MARKETING',
        headerType: 'NONE',
        headerText: '',
        headerMediaUrl: '',
        headerExample: '',
        bodyText: '',
        bodyExamples: [],
        footerText: '',
        buttons: [],
      })
      setMode('simple')
    }
  }, [template, open])

  const handleSave = async () => {
    await onSave(formData, mode === 'meta')
  }

  // Inserir variável no cursor
  const insertVariable = (variable: string, targetField: 'content' | 'bodyText' | 'headerText') => {
    const ref =
      targetField === 'content'
        ? contentRef
        : targetField === 'bodyText'
        ? bodyTextRef
        : headerTextRef

    if (!ref.current) return

    const textarea = ref.current
    const start = textarea.selectionStart || 0
    const end = textarea.selectionEnd || 0
    const currentValue = formData[targetField] || ''

    const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end)

    setFormData({ ...formData, [targetField]: newValue })

    // Reposicionar cursor
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + variable.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
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
    const matches = text.match(/\{\{(nome|produtos|link|total)\}\}/g)
    return matches ? matches.length : 0
  }

  const getPreview = () => {
    if (mode === 'simple') {
      let preview = formData.content
      EVOLUTION_VARIABLES.forEach((v) => {
        preview = preview.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), v.example)
      })
      return preview
    } else {
      let preview = ''
      if (formData.headerType === 'TEXT' && formData.headerText) {
        let header = formData.headerText
        META_VARIABLES.forEach((v) => {
          header = header.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), v.example)
        })
        preview += `📌 ${header}\n\n`
      }
      if (formData.bodyText) {
        let body = formData.bodyText
        META_VARIABLES.forEach((v) => {
          body = body.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), v.example)
        })
        preview += body
      }
      if (formData.footerText) {
        preview += `\n\n━━━━━━━━━━━━\n${formData.footerText}`
      }
      if (formData.buttons && formData.buttons.length > 0) {
        preview += '\n\n'
        formData.buttons.forEach((btn) => {
          preview += `\n🔘 ${btn.text}`
          if (btn.type === 'URL' && btn.url) preview += ` (${btn.url})`
          if (btn.type === 'PHONE_NUMBER' && btn.phoneNumber) preview += ` (${btn.phoneNumber})`
        })
      }
      return preview
    }
  }

  const quickReplyCount = formData.buttons?.filter((b) => b.type === 'QUICK_REPLY').length || 0
  const urlCount = formData.buttons?.filter((b) => b.type === 'URL').length || 0
  const phoneCount = formData.buttons?.filter((b) => b.type === 'PHONE_NUMBER').length || 0

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{template ? 'Editar Template' : 'Novo Template'}</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
        {hasOfficialApi && (
          <Box sx={{ mt: 2 }}>
            <Tabs
              value={mode === 'simple' ? 0 : 1}
              onChange={(_, v) => setMode(v === 0 ? 'simple' : 'meta')}
              variant="fullWidth"
            >
              <Tab label="Modo Simples (Evolution API)" />
              <Tab label="Modo Completo (Meta API Oficial)" />
            </Tabs>
            <Alert severity="info" sx={{ mt: 1, fontSize: '0.85rem' }}>
              <strong>Modo Simples:</strong> Mensagens enviadas como texto via Evolution API<br/>
              <strong>Modo Completo:</strong> Templates estruturados enviados via Meta API (com botões, header, footer, etc.)
            </Alert>
          </Box>
        )}
      </DialogTitle>

      <DialogContent>
        {/* Se for template da API Oficial, mostrar apenas campos editáveis */}
        {template?.metaTemplateId ? (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Template da API Oficial do Meta</strong><br />
                Templates criados e aprovados pela Meta não podem ter seu conteúdo editado.<br />
                Você pode apenas ajustar o tempo de disparo e ativar/desativar o template.
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nome do Template"
                  value={formData.name}
                  disabled
                  helperText="Nome do template (não editável)"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Delay (minutos)"
                  value={formData.delayMinutes}
                  onChange={(e) => setFormData({ ...formData, delayMinutes: parseInt(e.target.value) || 60 })}
                  required
                  helperText="Tempo de espera antes de enviar a mensagem"
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                  }
                  label="Template Ativo"
                />
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'action.hover' }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Conteúdo do Template (somente leitura):
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                    {template.content}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            {/* Campos comuns */}
            <Grid item xs={12} md={formData.triggerType === 'manual' ? 10 : 6}>
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

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.triggerType}
                  onChange={(e) => setFormData({ ...formData, triggerType: e.target.value as any })}
                  label="Tipo"
                >
                  <MenuItem value="abandoned_cart">🛒 Carrinho Abandonado</MenuItem>
                  <MenuItem value="manual">📤 Disparo Manual</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.triggerType === 'abandoned_cart' && (
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="Delay (min)"
                  value={formData.delayMinutes}
                  onChange={(e) => setFormData({ ...formData, delayMinutes: parseInt(e.target.value) })}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
            )}

            <Grid item xs={12} md={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Ativo"
                sx={{ mt: 1 }}
              />
            </Grid>

            {formData.triggerType === 'manual' && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    <strong>Template de Disparo Manual</strong><br />
                    Este template só será enviado quando você chamar o webhook de disparo.<br />
                    Ele não será processado automaticamente pelo sistema de carrinhos abandonados.
                  </Typography>
                </Alert>
              </Grid>
            )}

          {/* MODO SIMPLES - Evolution API */}
          {mode === 'simple' && (
            <>
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ borderColor: 'primary.main' }}>
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom color="primary.main">
                      💬 Mensagem (Evolution API)
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                      Clique nas variáveis abaixo para inserir no texto
                    </Typography>

                    <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                      {EVOLUTION_VARIABLES.map((v) => (
                        <Chip
                          key={v.key}
                          label={`{{${v.key}}}`}
                          size="small"
                          onClick={() => insertVariable(`{{${v.key}}}`, 'content')}
                          icon={<Add />}
                          color="primary"
                          variant="outlined"
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Stack>

                    <TextField
                      fullWidth
                      multiline
                      rows={8}
                      label="Conteúdo"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Oi {{nome}}! Vi que você deixou itens no carrinho 🛒&#10;&#10;{{produtos}}&#10;&#10;Total: {{total}}&#10;&#10;Finalize sua compra: {{link}}"
                      required
                      inputRef={contentRef}
                      helperText="Use as variáveis acima clicando nelas"
                    />
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}

          {/* MODO COMPLETO - Meta API */}
          {mode === 'meta' && (
            <>
              <Grid item xs={12}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    📋 Configurações do Template Meta
                  </Typography>
                  <Typography variant="caption">
                    <strong>MARKETING:</strong> Para promoções, ofertas e recuperação de carrinho. Possui limite de envios e horários.<br/>
                    <strong>UTILITY:</strong> Para confirmações de pedido, rastreamento e notificações importantes. Sem limite de horário.
                  </Typography>
                </Alert>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Idioma</InputLabel>
                  <Select
                    value={formData.metaLanguage}
                    onChange={(e) => setFormData({ ...formData, metaLanguage: e.target.value })}
                    label="Idioma"
                  >
                    <MenuItem value="pt_BR">🇧🇷 Português (Brasil)</MenuItem>
                    <MenuItem value="en_US">🇺🇸 English (US)</MenuItem>
                    <MenuItem value="es">🇪🇸 Español</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={formData.metaCategory}
                    onChange={(e) => setFormData({ ...formData, metaCategory: e.target.value as any })}
                    label="Categoria"
                  >
                    <MenuItem value="MARKETING">📢 MARKETING</MenuItem>
                    <MenuItem value="UTILITY">🔔 UTILITY</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Header */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      📌 Cabeçalho (Header) - Opcional
                    </Typography>
                    <FormControl fullWidth sx={{ mt: 1 }}>
                      <InputLabel>Tipo de Header</InputLabel>
                      <Select
                        value={formData.headerType}
                        onChange={(e) => setFormData({ ...formData, headerType: e.target.value as any })}
                        label="Tipo de Header"
                      >
                        <MenuItem value="NONE">Nenhum</MenuItem>
                        <MenuItem value="TEXT">📝 Texto</MenuItem>
                        <MenuItem value="IMAGE">🖼️ Imagem</MenuItem>
                        <MenuItem value="🎥 VIDEO">Vídeo</MenuItem>
                        <MenuItem value="DOCUMENT">📄 Documento</MenuItem>
                      </Select>
                    </FormControl>

                    {formData.headerType === 'TEXT' && (
                      <>
                        <Alert severity="info" sx={{ mt: 2, mb: 1 }}>
                          <Typography variant="caption">
                            Header TEXT pode ter variáveis. Clique para inserir:
                          </Typography>
                        </Alert>
                        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}>
                          {META_VARIABLES.map((v) => (
                            <Chip
                              key={v.key}
                              label={`{{${v.key}}}`}
                              size="small"
                              onClick={() => insertVariable(`{{${v.key}}}`, 'headerText')}
                              icon={<Add />}
                              color="secondary"
                              variant="outlined"
                              sx={{ cursor: 'pointer' }}
                            />
                          ))}
                        </Stack>
                        <TextField
                          fullWidth
                          label="Texto do Header"
                          value={formData.headerText}
                          onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                          placeholder="Ex: Oferta Especial! ou Olá {{nome}}"
                          inputRef={headerTextRef}
                          inputProps={{ maxLength: 60 }}
                          helperText={`${formData.headerText?.length || 0}/60 caracteres`}
                        />
                      </>
                    )}

                    {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(formData.headerType || '') && (
                      <TextField
                        fullWidth
                        sx={{ mt: 2 }}
                        label={`URL do ${
                          formData.headerType === 'IMAGE'
                            ? 'Imagem'
                            : formData.headerType === 'VIDEO'
                            ? 'Vídeo'
                            : 'Documento'
                        }`}
                        value={formData.headerMediaUrl}
                        onChange={(e) => setFormData({ ...formData, headerMediaUrl: e.target.value })}
                        placeholder="https://exemplo.com/arquivo.jpg"
                        helperText="URL pública do arquivo (HTTPS)"
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Body */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ borderColor: 'success.main' }}>
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom color="success.main">
                      💬 Corpo da Mensagem (Body) - Obrigatório
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                      Clique nas variáveis para inserir
                    </Typography>

                    <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                      {META_VARIABLES.map((v) => (
                        <Tooltip key={v.key} title={v.label}>
                          <Chip
                            label={`{{${v.key}}}`}
                            size="small"
                            onClick={() => insertVariable(`{{${v.key}}}`, 'bodyText')}
                            icon={<Add />}
                            color="success"
                            variant="outlined"
                            sx={{ cursor: 'pointer' }}
                          />
                        </Tooltip>
                      ))}
                    </Stack>

                    <TextField
                      fullWidth
                      multiline
                      rows={8}
                      label="Texto do Body"
                      value={formData.bodyText}
                      onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
                      placeholder="Oi {{nome}}! Vi que você deixou itens no carrinho 🛒&#10;&#10;{{produtos}}&#10;&#10;Total: {{total}}&#10;&#10;Finalize sua compra: {{link}}"
                      required
                      inputRef={bodyTextRef}
                      inputProps={{ maxLength: 1024 }}
                      helperText={`${formData.bodyText?.length || 0}/1024 caracteres | ${countVariables(
                        formData.bodyText || ''
                      )} variáveis encontradas`}
                    />

                    {/* Campos de Examples para variáveis do Body */}
                    {(() => {
                      const bodyVarMatches = [...(formData.bodyText || '').matchAll(/\{\{(nome|produtos|link|total)\}\}/g)]
                      const uniqueVars = [...new Set(bodyVarMatches.map((m) => m[1]))]

                      if (uniqueVars.length === 0) return null

                      return (
                        <Box sx={{ mt: 3 }}>
                          <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                              <strong>Exemplos de Variáveis</strong><br />
                              Forneça exemplos para cada variável usada no body. Esses exemplos serão enviados para o Meta durante a aprovação do template.
                            </Typography>
                          </Alert>

                          <Grid container spacing={2}>
                            {uniqueVars.map((varKey) => {
                              const varInfo = META_VARIABLES.find((v) => v.key === varKey)
                              if (!varInfo) return null

                              return (
                                <Grid item xs={12} md={6} key={varKey}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    label={`Exemplo para {{${varKey}}} - ${varInfo.label}`}
                                    value={(formData.bodyExamples as any)?.[varKey] || ''}
                                    onChange={(e) => {
                                      const newExamples = { ...(formData.bodyExamples as any || {}) }
                                      newExamples[varKey] = e.target.value
                                      setFormData({ ...formData, bodyExamples: newExamples as any })
                                    }}
                                    placeholder={varInfo.example}
                                    helperText="Será usado durante a aprovação no Meta"
                                  />
                                </Grid>
                              )
                            })}
                          </Grid>
                        </Box>
                      )
                    })()}
                  </CardContent>
                </Card>
              </Grid>

              {/* Footer */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      🔖 Rodapé (Footer) - Opcional
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
                  </CardContent>
                </Card>
              </Grid>

              {/* Buttons */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      🔘 Botões - Opcional
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mb: 2, mt: 1 }}>
                      <Button
                        size="small"
                        variant={quickReplyCount > 0 ? 'contained' : 'outlined'}
                        startIcon={<Reply />}
                        onClick={() => addButton('QUICK_REPLY')}
                        disabled={quickReplyCount >= 3}
                      >
                        Resposta Rápida ({quickReplyCount}/3)
                      </Button>
                      <Button
                        size="small"
                        variant={urlCount > 0 ? 'contained' : 'outlined'}
                        startIcon={<LinkIcon />}
                        onClick={() => addButton('URL')}
                        disabled={urlCount >= 2}
                      >
                        Link ({urlCount}/2)
                      </Button>
                      <Button
                        size="small"
                        variant={phoneCount > 0 ? 'contained' : 'outlined'}
                        startIcon={<Phone />}
                        onClick={() => addButton('PHONE_NUMBER')}
                        disabled={phoneCount >= 1}
                      >
                        Telefone ({phoneCount}/1)
                      </Button>
                    </Stack>

                    {formData.buttons?.map((button, index) => (
                      <Box
                        key={index}
                        sx={{
                          mb: 2,
                          p: 2,
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="start">
                          <Chip
                            label={button.type === 'QUICK_REPLY' ? 'Resposta' : button.type === 'URL' ? 'Link' : 'Tel'}
                            size="small"
                            color={
                              button.type === 'QUICK_REPLY'
                                ? 'primary'
                                : button.type === 'URL'
                                ? 'secondary'
                                : 'info'
                            }
                          />
                          <TextField
                            size="small"
                            label="Texto do Botão"
                            value={button.text}
                            onChange={(e) => updateButton(index, 'text', e.target.value)}
                            sx={{ flexGrow: 1 }}
                            inputProps={{ maxLength: 25 }}
                            helperText={`${button.text?.length || 0}/25`}
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
                          <IconButton size="small" onClick={() => removeButton(index)} color="error">
                            <Delete />
                          </IconButton>
                        </Stack>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}

            {/* Preview */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ borderColor: 'info.main' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Visibility color="info" />
                    <Typography variant="subtitle2" fontWeight={600} color="info.main">
                      Pré-visualização
                    </Typography>
                  </Box>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: 'background.paper',
                      minHeight: 100,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'system-ui',
                        lineHeight: 1.5,
                        color: 'text.primary'
                      }}
                    >
                      {getPreview() || 'Digite o conteúdo do template para ver o preview...'}
                    </Typography>
                  </Paper>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <LoadingButton variant="contained" onClick={handleSave} loading={loading} size="large">
          {template ? 'Atualizar Template' : 'Criar Template'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}
