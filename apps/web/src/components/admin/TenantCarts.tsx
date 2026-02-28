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
  Typography,
} from '@mui/material'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import api from '../../services/api'

interface TenantCartsProps {
  tenantId: number
}

interface Cart {
  id: number
  customer_name: string
  customer_phone: string
  total_value: number
  status: string
  created_at: string
}

export default function TenantCarts({ tenantId }: TenantCartsProps) {
  const [carts, setCarts] = useState<Cart[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCarts()
  }, [tenantId])

  const fetchCarts = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/admin/tenants/${tenantId}/carts`)
      setCarts(response.data.data)
    } catch (err) {
      console.error('Erro ao carregar carrinhos:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recovered':
        return 'success'
      case 'pending':
        return 'warning'
      case 'cancelled':
        return 'error'
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
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Cliente</TableCell>
            <TableCell>Telefone</TableCell>
            <TableCell align="right">Valor</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {carts.map((cart) => (
            <TableRow key={cart.id}>
              <TableCell>{cart.customer_name}</TableCell>
              <TableCell>{cart.customer_phone}</TableCell>
              <TableCell align="right">
                <Typography variant="body2">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(cart.total_value)}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip label={cart.status} color={getStatusColor(cart.status)} size="small" />
              </TableCell>
              <TableCell>
                {format(new Date(cart.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
