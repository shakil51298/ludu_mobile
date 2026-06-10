import { colors } from './colors';

export const gradients = {
  screenBackground: [colors.navy, '#0F1D3D', colors.navyMid] as const,
  primaryButton: [colors.royalBlue, colors.royalBlueLight, colors.gold] as const,
  card: [colors.royalBlueDark, colors.royalBlue, colors.goldDark] as const,
  cardSubtle: ['rgba(21,101,255,0.45)', 'rgba(255,213,74,0.22)'] as const,
  glassBlue: ['rgba(21,101,255,0.35)', 'rgba(11,18,32,0.6)'] as const,
  boardAmbient: [colors.navy, '#0A1628', colors.navyMid] as const,
  goldShine: [colors.goldDark, colors.gold, colors.goldLight] as const,
};
