import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material'
import { SnackbarProvider } from 'notistack'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider, useThemeMode } from './contexts/ThemeContext'
import getTheme from './theme'
import AppRoutes from './routes'

function ThemedApp() {
  const { mode } = useThemeMode()
  const theme = getTheme(mode)

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        autoHideDuration={3000}
      >
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </SnackbarProvider>
    </MuiThemeProvider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
