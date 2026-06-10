import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, gradients, radius, shadows, typography } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = 'primary' | 'secondary' | 'danger';

export function PremiumButton({
  children,
  label,
  onPress,
  style,
  variant = 'primary',
}: {
  children?: ReactNode;
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  variant?: Variant;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const gradientColors: readonly [string, string, ...string[]] =
    variant === 'primary'
      ? gradients.primaryButton
      : variant === 'danger'
        ? [colors.danger, '#FF6B81']
        : gradients.glassBlue;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 14 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12 });
      }}
      style={[animStyle, style]}
    >
      <View style={[styles.outer, variant === 'primary' ? shadows.glowGold : shadows.soft]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.shine} pointerEvents="none" />
          {children}
          <Text style={styles.label}>{label}</Text>
        </LinearGradient>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  shine: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.pill,
    height: '38%',
    left: 12,
    position: 'absolute',
    right: 12,
    top: 6,
  },
  label: {
    ...typography.button,
    textAlign: 'center',
  },
});
