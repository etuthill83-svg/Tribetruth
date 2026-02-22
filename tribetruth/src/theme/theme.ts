export const colors = {
  background: '#f7f6f3',
  surface: '#ffffff',
  textPrimary: '#1f1f1f',
  textSecondary: '#5e5e5e',
  accent: '#1f6feb',
  success: '#2a7a2a',
  warning: '#a34b00',
  border: '#e3e3e3',
  muted: '#9a9a9a',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

import { Platform } from 'react-native';

const serifFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

export const textStyles = {
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#f7f4ee',
    fontFamily: serifFont,
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#f2efe8',
    fontFamily: serifFont,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  body: {
    fontSize: 14,
    color: '#e9e6de',
    fontFamily: serifFont,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.28)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#e0ddd6',
    fontFamily: serifFont,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.28)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
};

export const shadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};
