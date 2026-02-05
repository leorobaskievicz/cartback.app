import { Card, CardContent, Typography, Box, Skeleton, alpha, useTheme } from '@mui/material'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
  loading?: boolean
}

const gradients: Record<string, string> = {
  primary: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
  secondary: 'linear-gradient(135deg, #EC4899 0%, #F97316 100%)',
  success: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  warning: 'linear-gradient(135deg, #F59E0B 0%, #EAB308 100%)',
  error: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  info: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
}

export default function StatCard({ title, value, icon, color = 'primary', loading = false }: StatCardProps) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  if (loading) {
    return (
      <Card
        sx={{
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: gradients[color],
          },
        }}
      >
        <CardContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <Box sx={{ flex: 1 }}>
              <Skeleton width="60%" height={20} />
              <Skeleton width="50%" height={56} sx={{ mt: 1 }} />
            </Box>
            <Skeleton variant="circular" width={56} height={56} />
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        background: isDark
          ? `linear-gradient(135deg, ${alpha(theme.palette[color].dark, 0.1)} 0%, ${alpha(
              theme.palette[color].main,
              0.05
            )} 100%)`
          : 'background.paper',
        border: isDark ? `1px solid ${alpha(theme.palette[color].main, 0.2)}` : 'none',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: isDark
            ? `0px 20px 40px ${alpha(theme.palette[color].main, 0.3)}`
            : `0px 16px 48px ${alpha(theme.palette[color].main, 0.15)}`,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: gradients[color],
        },
      }}
    >
      <CardContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              color="text.secondary"
              variant="body2"
              gutterBottom
              fontWeight={600}
              sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}
            >
              {title}
            </Typography>
            <Typography
              variant="h3"
              sx={{
                mt: 1.5,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background: gradients[color],
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '16px',
              background: gradients[color],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: isDark
                ? `0px 8px 24px ${alpha(theme.palette[color].main, 0.4)}`
                : `0px 8px 20px ${alpha(theme.palette[color].main, 0.25)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.1) rotate(5deg)',
              },
              '& svg': {
                fontSize: '1.75rem',
              },
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
