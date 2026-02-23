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

const META_VARIABLES = [
  { index: 1, label: 'Nome', example: 'João Silva' },
  { index: 2, label: 'Produtos', example: 'Produto X e mais 2 itens' },
  { index: 3, label: 'Valor Total', example: 'R$ 149,90' },
  { index: 4, label: 'Link', example: 'https://loja.com/cart/123' },
  { index: 5, label: 'Desconto', example: 'R$ 50,00' },
  { index: 6, label: 'Data', example: '20/02/2026' },
  { index: 7, label: 'Código', example: 'ABC123' },
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
    const matches = text.match(/\{\{(\d+)\}\}/g)
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
        preview += `📌 ${formData.headerText.replace(/\{\{1\}\}/, 'João Silva')}\n\n`
      }
      if (formData.bodyText) {
        let body = formData.bodyText
        META_VARIABLES.forEach((v) => {
          body = body.replace(new RegExp(`\\{\\{${v.index}\\}\\}`, 'g'), v.example)
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
            <Grid item xs={12} md={8}>
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
                            Header TEXT pode ter 1 variável: {'{'}
                            {'{'}1{'}'}
                            {'}'}
                          </Typography>
                        </Alert>
                        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                          <Chip
                            label="{{1}}"
                            size="small"
                            onClick={() => insertVariable('{{1}}', 'headerText')}
                            icon={<Add />}
                            color="secondary"
                          />
                        </Stack>
                        <TextField
                          fullWidth
                          label="Texto do Header"
                          value={formData.headerText}
                          onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                          placeholder="Ex: Oferta Especial! ou Seu pedido {{1}}"
                          inputRef={headerTextRef}
                          inputProps={{ maxLength: 60 }}
                          helperText={`${formData.headerText?.length || 0}/60 caracteres`}
                        />

                        {/* Campo de Example para {{1}} no header */}
                        {formData.headerText?.includes('{{1}}') && (
                          <TextField
                            fullWidth
                            size="small"
                            sx={{ mt: 2 }}
                            label="Exemplo para {{1}} no Header"
                            value={formData.headerExample || ''}
                            onChange={(e) => setFormData({ ...formData, headerExample: e.target.value })}
                            placeholder="João Silva"
                            helperText="Exemplo que será enviado ao Meta para aprovação do template"
                          />
                        )}
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
                      Clique nas variáveis para inserir. Use {'{'}
                      {'{'}1{'}'}{'}'}
, {'{'}
                      {'{'}2{'}'}
                      {'}'}
                      ... em sequência
                    </Typography>

                    <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                      {META_VARIABLES.map((v) => (
                        <Tooltip key={v.index} title={v.label}>
                          <Chip
                            label={`{{${v.index}}}`}
                            size="small"
                            onClick={() => insertVariable(`{{${v.index}}}`, 'bodyText')}
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
                      placeholder="Oi {{1}}! Vi que você deixou itens no carrinho 🛒&#10;&#10;{{2}}&#10;&#10;Total: {{3}}&#10;&#10;Finalize sua compra: {{4}}"
                      required
                      inputRef={bodyTextRef}
                      inputProps={{ maxLength: 1024 }}
                      helperText={`${formData.bodyText?.length || 0}/1024 caracteres | ${countVariables(
                        formData.bodyText || ''
                      )} variáveis encontradas`}
                    />

                    {/* Campos de Examples para variáveis do Body */}
                    {(() => {
                      const bodyVarMatches = [...(formData.bodyText || '').matchAll(/\{\{(\d+)\}\}/g)]
                      const uniqueVars = [...new Set(bodyVarMatches.map((m) => parseInt(m[1])))]
                        .sort((a, b) => a - b)

                      if (uniqueVars.length === 0) return null

                      return (
                        <Box sx={{ mt: 3 }}>
                          <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                              <strong>Exemplos de Variáveis</strong><br />
                              Forneça exemplos para cada variável usada no body. Esses exemplos serão enviados para o Meta durante a aprovação do template.
                            </Typography>
                          </Alert>

                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                            <strong>Mapeamento de Variáveis (fixo):</strong><br />
                            • {'{'}{'{'}{'}'}1{'}'}{'}'} = Nome do cliente<br />
                            • {'{'}{'{'}{'}'}2{'}'}{'}'} = Produtos<br />
                            • {'{'}{'{'}{'}'}3{'}'}{'}'} = Link do carrinho<br />
                            • {'{'}{'{'}{'}'}4{'}'}{'}'} = Valor total<br />
                            • {'{'}{'{'}{'}'}5{'}'}{'}'} = Desconto<br />
                            • {'{'}{'{'}{'}'}6{'}'}{'}'} = Data<br />
                            • {'{'}{'{'}{'}'}7{'}'}{'}'} = Código
                          </Typography>

                          <Grid container spacing={2}>
                            {uniqueVars.map((varIndex) => {
                              const varInfo = META_VARIABLES.find((v) => v.index === varIndex)
                              const currentExamples = formData.bodyExamples || []

                              return (
                                <Grid item xs={12} md={6} key={varIndex}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    label={`Exemplo para {{${varIndex}}} - ${varInfo?.label || `Variável ${varIndex}`}`}
                                    value={currentExamples[varIndex - 1] || ''}
                                    onChange={(e) => {
                                      const newExamples = [...(formData.bodyExamples || [])]
                                      newExamples[varIndex - 1] = e.target.value
                                      setFormData({ ...formData, bodyExamples: newExamples })
                                    }}
                                    placeholder={varInfo?.example || `Exemplo ${varIndex}`}
                                    helperText={`Será usado durante a aprovação no Meta`}
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
