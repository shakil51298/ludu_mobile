import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography = {
  hero: {
    fontSize: 42,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
  } as TextStyle,
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 1.2,
  } as TextStyle,
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textGold,
    letterSpacing: 0.8,
  } as TextStyle,
  body: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  } as TextStyle,
  button: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 0.6,
  } as TextStyle,
  caption: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  } as TextStyle,
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textGold,
    letterSpacing: 1,
  } as TextStyle,
};
