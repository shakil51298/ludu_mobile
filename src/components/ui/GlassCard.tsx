import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, gradients, radius, shadows } from '../../theme';

export function GlassCard({
  children,
  style,
  intensity = 28,
}: {
  children: ReactNode;
  style?: ViewStyle;
  intensity?: number;
}) {
  return (
    <View style={[styles.wrap, shadows.card, style]}>
      <LinearGradient
        colors={[...gradients.cardSubtle]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {Platform.OS !== 'web' && (
        <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      )}
      <View style={styles.rim} pointerEvents="none" />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderColor: colors.glassBorder,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  content: {
    padding: 14,
  },
});
