import { createTheme, alpha } from '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Palette {
    gradient: {
      primary: string
      secondary: string
      success: string
      info: string
    }
  }
  interface PaletteOptions {
    gradient?: {
      primary: string
      secondary: string
      success: string
      info: string
    }
  }
}

const getTheme = (mode: 'light' | 'dark') => {
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#25D366', // Verde WhatsApp
        light: '#34E876',
        dark: '#128C7E',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#FF6B35', // Laranja accent
        light: '#FF8558',
        dark: '#E55A2B',
        contrastText: '#FFFFFF',
      },
      success: {
        main: '#10B981',
        light: '#34D399',
        dark: '#059669',
      },
      warning: {
        main: '#F59E0B',
        light: '#FBBF24',
        dark: '#D97706',
      },
      error: {
        main: '#EF4444',
        light: '#F87171',
        dark: '#DC2626',
      },
      info: {
        main: '#3B82F6',
        light: '#60A5FA',
        dark: '#2563EB',
      },
      background: {
        default: isDark ? '#0D0D14' : '#FFFFFF',
        paper: isDark ? '#1A1A2E' : '#F8F9FA',
      },
      text: {
        primary: isDark ? '#FFFFFF' : '#1A1A2E',
        secondary: isDark ? '#B0B0C0' : '#4A4A5A',
        disabled: isDark ? '#6A6A7A' : '#9A9AAA',
      },
      divider: isDark ? alpha('#B0B0C0', 0.12) : alpha('#4A4A5A', 0.12),
      gradient: {
        primary: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
        secondary: 'linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%)',
        success: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        info: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      },
    },
    typography: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      h1: {
        fontWeight: 700,
        fontSize: '2rem',
        letterSpacing: '-0.02em',
      },
      h2: {
        fontWeight: 600,
        fontSize: '1.5rem',
        letterSpacing: '-0.01em',
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.25rem',
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.125rem',
      },
      h5: {
        fontWeight: 500,
        fontSize: '1rem',
      },
      h6: {
        fontWeight: 500,
        fontSize: '0.875rem',
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
      button: {
        fontWeight: 600,
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: [
      'none',
      isDark ? '0px 2px 4px rgba(0, 0, 0, 0.4)' : '0px 2px 4px rgba(0, 0, 0, 0.04)',
      isDark ? '0px 4px 8px rgba(0, 0, 0, 0.4)' : '0px 4px 8px rgba(0, 0, 0, 0.06)',
      isDark ? '0px 8px 16px rgba(0, 0, 0, 0.4)' : '0px 8px 16px rgba(0, 0, 0, 0.08)',
      isDark ? '0px 12px 24px rgba(0, 0, 0, 0.45)' : '0px 12px 24px rgba(0, 0, 0, 0.1)',
      isDark ? '0px 16px 32px rgba(0, 0, 0, 0.5)' : '0px 16px 32px rgba(0, 0, 0, 0.12)',
      isDark ? '0px 20px 40px rgba(0, 0, 0, 0.5)' : '0px 20px 40px rgba(0, 0, 0, 0.14)',
      isDark ? '0px 24px 48px rgba(0, 0, 0, 0.55)' : '0px 24px 48px rgba(0, 0, 0, 0.16)',
      isDark ? '0px 32px 64px rgba(0, 0, 0, 0.6)' : '0px 32px 64px rgba(0, 0, 0, 0.18)',
      isDark ? '0px 32px 64px rgba(0, 0, 0, 0.6)' : '0px 32px 64px rgba(0, 0, 0, 0.18)',
      isDark ? '0px 32px 64px rgba(0, 0, 0, 0.6)' : '0px 32px 64px rgba(0, 0, 0, 0.18)',
      isDark ? '0px 32px 64px rgba(0, 0, 0, 0.6)' : '0px 32px 64px rgba(0, 0, 0, 0.18)',
      isDark ? '0px 32px 64px rgba(0, 0, 0, 0.6)' : '0px 32px 64px rgba(0, 0, 0, 0.18)',
      isDark ? '0px 32px 64px rgba(0, 0, 0, 0.6)' : '0px 32px 64px rgba(0, 0, 0, 0.18)',
      isDark ? '0px 32px 64px rgba(0, 0, 0, 0.6)' : '0px 32px 64px rgba(0, 0, 0, 0.18)',
      isDark ? '0px 32px 64px rgba(0, 0, 0, 0.6)' : '0px 32px 64px rgba(0, 0, 0, 0.18)',
      isDark ? '0px 32px 64px rgba(0, 0, 0, 0.6)' : '0px 32px 64px rgba(0, 0, 0, 0.18)',
      isDark ? '0px 32px 64px rgba(0, 0, 0, 0.6)' : '0px 32px 64px rgba(0, 0, 0, 0.18)',
      isDark ? '0px 32px 64px rgba(0, 0, 0, 0.6)' : '0px 32px 64px rgba(0, 0, 0, 0.18)',
      isDark ? '0px 32px 64px rgba(0, 0, 0, 0.6)' : '0px 32px 64px rgba(0, 0, 0, 0.18)',
      isDark ? '0px 32px 64px rgba(0, 0, 0, 0.6)' : '0px 32px 64px rgba(0, 0, 0, 0.18)',
      isDark ? '0px 32px 64px rgba(0, 0, 0, 0.6)' : '0px 32px 64px rgba(0, 0, 0, 0.18)',
      isDark ? '0px 32px 64px rgba(0, 0, 0, 0.6)' : '0px 32px 64px rgba(0, 0, 0, 0.18)',
      isDark ? '0px 32px 64px rgba(0, 0, 0, 0.6)' : '0px 32px 64px rgba(0, 0, 0, 0.18)',
      isDark ? '0px 32px 64px rgba(0, 0, 0, 0.6)' : '0px 32px 64px rgba(0, 0, 0, 0.18)',
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '10px 20px',
            fontSize: '0.9375rem',
            boxShadow: 'none',
            transition: 'all 0.2s ease-in-out',
            fontWeight: 600,
          },
          contained: {
            boxShadow: 'none',
            backgroundColor: isDark ? '#25D366' : '#128C7E',
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: isDark ? '#34E876' : '#0F6B5E',
              boxShadow: isDark
                ? '0 4px 12px rgba(37, 211, 102, 0.4)'
                : '0 4px 12px rgba(18, 140, 126, 0.4)',
            },
            '&.MuiButton-containedPrimary': {
              backgroundColor: isDark ? '#25D366' : '#128C7E',
              '&:hover': {
                backgroundColor: isDark ? '#34E876' : '#0F6B5E',
              },
            },
          },
          outlined: {
            borderWidth: 1.5,
            '&:hover': {
              borderWidth: 1.5,
              backgroundColor: alpha('#25D366', 0.04),
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)',
            border: isDark ? `1px solid ${alpha('#B0B0C0', 0.1)}` : 'none',
            transition: 'all 0.2s ease-in-out',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          rounded: {
            borderRadius: 20,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            fontWeight: 600,
            fontSize: '0.8125rem',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-1px)',
              },
              '&.Mui-focused': {
                transform: 'translateY(-2px)',
                boxShadow: isDark
                  ? '0px 4px 16px rgba(99, 102, 241, 0.3)'
                  : '0px 4px 16px rgba(99, 102, 241, 0.15)',
              },
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderBottom: `1px solid ${isDark ? alpha('#B0B0C0', 0.1) : alpha('#4A4A5A', 0.1)}`,
            backdropFilter: 'blur(20px)',
            backgroundColor: isDark ? alpha('#1A1A2E', 0.8) : alpha('#FFFFFF', 0.8),
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: 'none',
            background: isDark
              ? 'linear-gradient(180deg, #1A1A2E 0%, #0D0D14 100%)'
              : 'linear-gradient(180deg, #FFFFFF 0%, #F8F9FA 100%)',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            margin: '4px 12px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: isDark ? alpha('#25D366', 0.1) : alpha('#25D366', 0.08),
            },
            '&.Mui-selected': {
              background: 'linear-gradient(90deg, #25D366 0%, #128C7E 100%)',
              color: '#FFFFFF',
              '&:hover': {
                background: 'linear-gradient(90deg, #128C7E 0%, #0F6B5E 100%)',
              },
              '& .MuiListItemIcon-root': {
                color: '#FFFFFF',
              },
            },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
          standardSuccess: {
            backgroundColor: isDark ? alpha('#10B981', 0.15) : alpha('#10B981', 0.1),
            border: `1px solid ${alpha('#10B981', 0.3)}`,
          },
          standardError: {
            backgroundColor: isDark ? alpha('#EF4444', 0.15) : alpha('#EF4444', 0.1),
            border: `1px solid ${alpha('#EF4444', 0.3)}`,
          },
          standardWarning: {
            backgroundColor: isDark ? alpha('#F59E0B', 0.15) : alpha('#F59E0B', 0.1),
            border: `1px solid ${alpha('#F59E0B', 0.3)}`,
          },
          standardInfo: {
            backgroundColor: isDark ? alpha('#3B82F6', 0.15) : alpha('#3B82F6', 0.1),
            border: `1px solid ${alpha('#3B82F6', 0.3)}`,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 24,
            boxShadow: isDark
              ? '0px 24px 64px rgba(0, 0, 0, 0.6)'
              : '0px 24px 64px rgba(15, 23, 42, 0.2)',
          },
        },
      },
    },
  })
}

export default getTheme
