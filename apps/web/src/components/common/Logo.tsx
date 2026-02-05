import { useTheme } from '@mui/material/styles'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'full' | 'icon'
}

const Logo = ({ size = 'md', variant = 'full' }: LogoProps) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const sizes = {
    sm: { width: 200, height: 50, fontSize: 24, iconSize: 48 },
    md: { width: 280, height: 70, fontSize: 32, iconSize: 64 },
    lg: { width: 360, height: 90, fontSize: 40, iconSize: 80 },
  }

  const { width, height, fontSize, iconSize } = sizes[size]
  const iconOnly = variant === 'icon'

  if (iconOnly) {
    return (
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cartbackGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#25D366" />
            <stop offset="100%" stopColor="#128C7E" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="72" height="72" rx="16" fill="url(#cartbackGradient)" />
        <g stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M20 28 L25 28 L31 44 L51 44 L57 31 L33 31" />
          <circle cx="33" cy="52" r="4" fill="white" />
          <circle cx="48" cy="52" r="4" fill="white" />
          <path d="M51 18 C43 16 35 18 31 25" />
          <path d="M31 25 L35 21" />
          <path d="M31 25 L27 22" />
        </g>
      </svg>
    )
  }

  return (
    <svg width={width} height={height} viewBox="0 0 320 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cartbackGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#25D366" />
          <stop offset="100%" stopColor="#128C7E" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="72" height="72" rx="16" fill="url(#cartbackGradient)" />
      <g stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M20 28 L25 28 L31 44 L51 44 L57 31 L33 31" />
        <circle cx="33" cy="52" r="4" fill="white" />
        <circle cx="48" cy="52" r="4" fill="white" />
        <path d="M51 18 C43 16 35 18 31 25" />
        <path d="M31 25 L35 21" />
        <path d="M31 25 L27 22" />
      </g>
      <text
        x="88"
        y="52"
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize={fontSize}
        fontWeight="600"
        letterSpacing="-0.5"
      >
        <tspan fill={isDark ? '#FFFFFF' : '#1A1A2E'}>cart</tspan>
        <tspan fill="#25D366">back</tspan>
      </text>
    </svg>
  )
}

export default Logo
