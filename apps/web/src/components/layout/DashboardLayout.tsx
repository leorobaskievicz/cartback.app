import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  ShoppingCart as CartIcon,
  Message as MessageIcon,
  WhatsApp as WhatsAppIcon,
  IntegrationInstructions as IntegrationIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Key as KeyIcon,
} from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import { useAuth } from '../../contexts/AuthContext'
import { useThemeMode } from '../../contexts/ThemeContext'
import { plansApi, authApi } from '../../services/api'
import type { Subscription } from '../../types'
import { useSnackbar } from 'notistack'
import Logo from '../common/Logo'

const DRAWER_WIDTH = 260

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Carrinhos', icon: <CartIcon />, path: '/dashboard/carts' },
  { text: 'Templates', icon: <MessageIcon />, path: '/dashboard/templates' },
  { text: 'WhatsApp', icon: <WhatsAppIcon />, path: '/dashboard/whatsapp' },
  { text: 'Integrações', icon: <IntegrationIcon />, path: '/dashboard/integrations' },
  { text: 'Configurações', icon: <SettingsIcon />, path: '/dashboard/settings' },
]

export default function DashboardLayout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const { user, tenant, logout } = useAuth()
  const { mode, toggleTheme } = useThemeMode()
  const navigate = useNavigate()
  const location = useLocation()
  const { enqueueSnackbar } = useSnackbar()

  // Subscription state
  const [subscription, setSubscription] = useState<Subscription | null>(null)

  // Change password state
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  useEffect(() => {
    loadSubscription()
  }, [])

  const loadSubscription = async () => {
    try {
      const res = await plansApi.getSubscription()
      setSubscription(res.data.data)
    } catch (error) {
      console.error('Failed to load subscription:', error)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Preencha todos os campos')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Nova senha e confirmação não conferem')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('Nova senha deve ter no mínimo 6 caracteres')
      return
    }

    setPasswordLoading(true)

    try {
      await authApi.changePassword({ currentPassword, newPassword })
      enqueueSnackbar('Senha alterada com sucesso!', { variant: 'success' })
      setChangePasswordOpen(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      setPasswordError(error.response?.data?.error || 'Erro ao alterar senha')
    } finally {
      setPasswordLoading(false)
    }
  }

  const getPlanLabel = () => {
    if (!subscription) return 'Trial'

    const planNames: Record<string, string> = {
      trial: 'Trial',
      starter: 'Starter',
      pro: 'Pro',
      business: 'Business',
    }

    return planNames[subscription.plan] || subscription.planName || 'Trial'
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Logo size="sm" variant="full" />
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          {tenant?.name}
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flex: 1, px: 2, py: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path)
                setMobileOpen(false)
              }}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Plano: <strong>{getPlanLabel()}</strong>
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={() => setMobileOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 2 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Box sx={{ flex: 1 }} />
            <IconButton
              onClick={toggleTheme}
              sx={{
                mr: 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'rotate(180deg)',
                },
              }}
            >
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                }}
              >
                {user?.name.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              <MenuItem disabled>
                <Typography variant="body2">{user?.email}</Typography>
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={() => {
                  setAnchorEl(null)
                  setChangePasswordOpen(true)
                }}
              >
                <KeyIcon sx={{ mr: 1 }} fontSize="small" />
                Trocar Senha
              </MenuItem>
              <MenuItem onClick={logout}>
                <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
                Sair
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, p: 3 }}>
          <Outlet />
        </Box>
      </Box>

      {/* Change Password Dialog */}
      <Dialog
        open={changePasswordOpen}
        onClose={() => !passwordLoading && setChangePasswordOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Trocar Senha</DialogTitle>
        <DialogContent>
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}
          <TextField
            label="Senha Atual"
            type="password"
            fullWidth
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            margin="normal"
            disabled={passwordLoading}
          />
          <TextField
            label="Nova Senha"
            type="password"
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
            disabled={passwordLoading}
            helperText="Mínimo de 6 caracteres"
          />
          <TextField
            label="Confirmar Nova Senha"
            type="password"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            disabled={passwordLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordOpen(false)} disabled={passwordLoading}>
            Cancelar
          </Button>
          <LoadingButton onClick={handleChangePassword} variant="contained" loading={passwordLoading}>
            Alterar Senha
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
