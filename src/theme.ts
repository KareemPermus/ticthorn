export const theme = {
  colors: {
    primary: '#EF4444',
    primaryDark: '#B91C1C',
    primaryLight: '#FEE2E2',
    background: '#FEF2F2',
    card: '#FFFFFF',
    cardBorder: '#F3F4F6',
    text: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    accent: '#EF4444',
    tabInactive: '#9CA3AF',
    white: '#FFFFFF',
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  fonts: {
    regular: 'Inter',
    bold: 'Inter',
  },
} as const;

export type Theme = typeof theme;