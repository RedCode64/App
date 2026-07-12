import type { GearTier, HabitCategory } from '../types';

export const colors = {
  bg: '#05060e',
  bgElevated: '#0a0d1c',
  bgCard: '#0d1124',
  border: '#1c2340',
  borderBright: '#2c3a6e',
  cyan: '#00f0ff',
  magenta: '#ff2ec4',
  yellow: '#f5f749',
  green: '#39ff88',
  red: '#ff3b5c',
  orange: '#ff9e3d',
  purple: '#a45cff',
  text: '#e8ecff',
  textDim: '#8a93b8',
  textFaint: '#4a5378',
  black: '#000000',
} as const;

export const categoryColors: Record<HabitCategory, string> = {
  body: colors.magenta,
  mind: colors.cyan,
  grind: colors.yellow,
  social: colors.green,
};

export const categoryLabels: Record<HabitCategory, string> = {
  body: 'CHROME DISTRICT',
  mind: 'DATAFORT',
  grind: 'THE FOUNDRY',
  social: 'NEON MARKET',
};

export const categoryIcons: Record<HabitCategory, string> = {
  body: 'fitness',
  mind: 'hardware-chip',
  grind: 'construct',
  social: 'people',
};

export const tierColors: Record<GearTier, string> = {
  street: '#8a93b8',
  chrome: colors.cyan,
  netrunner: colors.magenta,
  ghost: colors.yellow,
};

export const tierLabels: Record<GearTier, string> = {
  street: 'STREET',
  chrome: 'CHROME',
  netrunner: 'NETRUNNER',
  ghost: 'GHOST',
};

export const fonts = {
  // Courier renders on both platforms without bundling font files and reads
  // as terminal/dystopian type.
  mono: 'Courier',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;
