# Frontend Implementation Status - CartBack

## ✅ Arquivos Implementados

### 1. Dependências (`package.json`)
- ✅ @mui/material, @mui/icons-material
- ✅ react-hook-form, @hookform/resolvers, zod
- ✅ notistack (para toast notifications)
- ✅ recharts (para gráficos)
- ✅ dayjs (para manipulação de datas)
- ✅ axios, react-router-dom

### 2. Configuração Base
- ✅ **src/theme/index.ts**: Tema MUI completo com cores primárias (Indigo) e secundárias (Green)
- ✅ **src/types/index.ts**: Types TypeScript completos (User, Tenant, Cart, Template, etc.)
- ✅ **src/services/api.ts**: Service completo com todas as APIs (auth, dashboard, integrations, whatsapp, templates, carts)
- ✅ **src/contexts/AuthContext.tsx**: Context de autenticação com user e tenant
- ✅ **.env**: Variável VITE_API_URL configurada

### 3. Layout
- ✅ **src/components/layout/DashboardLayout.tsx**: Layout principal com sidebar responsiva, menu de navegação

## 📋 Próximos Passos - Arquivos a Criar

### 1. Páginas de Autenticação

#### src/pages/auth/Login.tsx
```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Card, TextField, Button, Typography, Link } from '@mui/material'
import { useSnackbar } from 'notistack'
import { useAuth } from '../../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.error?.message || 'Erro ao fazer login', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Card sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h4" gutterBottom>Login</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
          <Typography align="center" sx={{ mt: 2 }}>
            Não tem conta? <Link href="/register">Cadastre-se</Link>
          </Typography>
        </form>
      </Card>
    </Box>
  )
}
```

#### src/pages/auth/Register.tsx
- Form com: name, email, password, tenantName, phone (opcional)
- Validação com react-hook-form + zod
- Redirect para dashboard após registro

### 2. Páginas Principais

#### src/pages/Dashboard.tsx
- 4 StatCards: Total Carrinhos, Mensagens Enviadas, Carrinhos Recuperados, Valor Recuperado
- Gráfico de linha (Recharts) com últimos 30 dias
- Tabela dos últimos 5 carrinhos

#### src/pages/Integrations.tsx
- Card Nuvemshop com status (conectado/desconectado)
- Botão "Conectar Nuvemshop" que abre authUrl em nova janela
- Botão "Desconectar" quando conectado
- Mostrar nome da loja e URL quando conectado

#### src/pages/WhatsApp.tsx
- Se desconectado: QR code grande para scan
- Polling a cada 5s para atualizar QR code
- Quando conectado: mostrar número, status, botão desconectar

#### src/pages/Templates.tsx
- Lista de templates com drag-and-drop (react-beautiful-dnd ou @dnd-kit)
- Modal para criar/editar
- Preview de mensagem com placeholders {{nome}}, {{produtos}}, {{total}}, {{link}}
- Toggle ativo/inativo

#### src/pages/Carts.tsx
- Tabela com paginação
- Filtro por status (pending, recovered, expired)
- Modal com detalhes do carrinho + histórico de mensagens
- Botão cancelar

#### src/pages/Settings.tsx
- Form para editar nome do tenant
- Informações do plano
- Botão logout

### 3. Componentes Auxiliares

#### src/components/common/StatCard.tsx
```tsx
import { Card, CardContent, Typography, Box } from '@mui/material'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: string
}

export default function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <Box>
            <Typography color="text.secondary" variant="body2">{title}</Typography>
            <Typography variant="h4" sx={{ mt: 1 }}>{value}</Typography>
            {trend && <Typography variant="caption" color="success.main">{trend}</Typography>}
          </Box>
          <Box sx={{ color: 'primary.main' }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  )
}
```

#### src/components/common/LoadingButton.tsx
- Button do MUI com loading state

#### src/components/common/EmptyState.tsx
- Componente para mostrar quando não há dados

#### src/components/common/ConfirmDialog.tsx
- Dialog de confirmação reutilizável

### 4. Routes e App

#### src/routes.tsx
```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import DashboardLayout from './components/layout/DashboardLayout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import Integrations from './pages/Integrations'
import WhatsApp from './pages/WhatsApp'
import Templates from './pages/Templates'
import Carts from './pages/Carts'
import Settings from './pages/Settings'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div>Carregando...</div>
  if (!user) return <Navigate to="/login" />
  return <>{children}</>
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="carts" element={<Carts />} />
        <Route path="templates" element={<Templates />} />
        <Route path="whatsapp" element={<WhatsApp />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
```

#### src/App.tsx
```tsx
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { SnackbarProvider } from 'notistack'
import { theme } from './theme'
import { AuthProvider } from './contexts/AuthContext'
import AppRoutes from './routes'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
```

## 🚀 Como Continuar

1. Criar as páginas de autenticação (Login e Register)
2. Criar a página Dashboard com gráficos
3. Criar as páginas de Integrations e WhatsApp
4. Criar a página de Templates com drag-and-drop
5. Criar a página de Carts com tabela e filtros
6. Criar os componentes auxiliares (StatCard, LoadingButton, etc.)
7. Atualizar App.tsx e criar routes.tsx
8. Testar fluxo completo end-to-end

## 📝 Notas Importantes

- Todos os tipos já estão definidos em `src/types/index.ts`
- Todas as APIs já estão prontas em `src/services/api.ts`
- O tema MUI está configurado com cores Indigo (primary) e Green (secondary)
- O AuthContext gerencia user e tenant globalmente
- Use `useSnackbar()` do notistack para notificações
- Use `useAuth()` para acessar user, tenant, login, logout

## 🎨 Design System

- Primária: #6366f1 (Indigo)
- Secundária: #22c55e (Green)
- Border Radius: 12px
- Font Family: Inter
- Spacing: 8px base

## 🔧 Scripts

```bash
# Development
cd apps/web
pnpm dev

# Build
pnpm build

# Preview
pnpm preview
```
