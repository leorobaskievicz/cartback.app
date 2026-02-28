import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Box,
} from '@mui/material'
import api from '../../services/api'

interface TenantTemplatesProps {
  tenantId: number
}

interface Template {
  id: number
  name: string
  is_active: boolean
  trigger_type: string
}

export default function TenantTemplates({ tenantId }: TenantTemplatesProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [tenantId])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/admin/tenants/${tenantId}/templates`)
      setTemplates(response.data.data)
    } catch (err) {
      console.error('Erro ao carregar templates:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell>Tipo de Disparo</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell>{template.name}</TableCell>
              <TableCell>
                <Chip label={template.trigger_type} size="small" />
              </TableCell>
              <TableCell>
                <Chip
                  label={template.is_active ? 'Ativo' : 'Inativo'}
                  color={template.is_active ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
