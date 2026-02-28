import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import api from '../../services/api'

interface TenantLogsProps {
  tenantId: number
}

interface MessageLog {
  id: number
  customer_phone: string
  provider: string
  status: string
  message_content: string
  error_message: string | null
  created_at: string
}

export default function TenantLogs({ tenantId }: TenantLogsProps) {
  const [logs, setLogs] = useState<MessageLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchLogs()
  }, [tenantId, page, rowsPerPage])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/admin/tenants/${tenantId}/logs`, {
        params: { page: page + 1, limit: rowsPerPage },
      })
      setLogs(response.data.data)
      setTotal(response.data.meta.total)
    } catch (err) {
      console.error('Erro ao carregar logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'success'
      case 'failed':
        return 'error'
      case 'queued':
        return 'warning'
      default:
        return 'default'
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
    <Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Telefone</TableCell>
              <TableCell>Provider</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Mensagem</TableCell>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.customer_phone}</TableCell>
                <TableCell>
                  <Chip label={log.provider} size="small" />
                </TableCell>
                <TableCell>
                  <Chip label={log.status} color={getStatusColor(log.status)} size="small" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                    {log.error_message || log.message_content?.substring(0, 50)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10))
          setPage(0)
        }}
        labelRowsPerPage="Linhas por página"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />
    </Box>
  )
}
