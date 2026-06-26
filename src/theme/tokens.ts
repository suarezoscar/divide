// ── Design tokens · Glossar-inspired ──

export const colors = {
  primary: "#07819C",
  primaryLight: "#0AA5C0",
  primaryDark: "#056475",

  background: "#F5F5F7",
  surface: "#FFFFFF",
  surfaceHover: "#FAFAFA",

  text: "#1A1A2E",
  textSecondary: "#4B5563",
  textMuted: "#6B7280",

  border: "#E5E7EB",
  divider: "#F3F4F6",

  success: "#059669",
  warning: "#F59E0B",
  danger: "#EF4444",

  sent: "#DC2626",    // red — money owed (you owe)
  received: "#059669", // green — money owed to you
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const shadows = {
  card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  elevated: "0 4px 12px rgba(0,0,0,0.08)",
  modal: "0 8px 32px rgba(0,0,0,0.12)",
} as const;

export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 32,
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;
