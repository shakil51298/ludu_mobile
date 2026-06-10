import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, gradients, radius, shadows } from '../../theme';

const DOT_MAP: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

export function PremiumDiceFace({
  disabled,
  isRolling,
  onPress,
  style,
  value,
}: {
  disabled?: boolean;
  isRolling?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  value: number;
}) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.wrap, shadows.glowBlue, style, disabled && styles.disabled]}>
      <LinearGradient colors={[...gradients.goldShine]} style={styles.outer}>
        <View style={styles.inner}>
          <LinearGradient colors={['#FFFEF5', '#FFF8E1', '#FFE082']} style={styles.face}>
            <View style={styles.dotGrid}>
              {Array.from({ length: 9 }, (_, index) => (
                <View
                  key={index}
                  style={[styles.dot, DOT_MAP[value]?.includes(index) ? styles.dotOn : styles.dotOff]}
                />
              ))}
            </View>
          </LinearGradient>
        </View>
        {isRolling && <Text style={styles.rollingLabel}>···</Text>}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.md,
  },
  disabled: {
    opacity: 0.5,
  },
  outer: {
    borderRadius: radius.md,
    padding: 3,
  },
  inner: {
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  face: {
    borderColor: colors.royalBlueDark,
    borderRadius: radius.sm,
    borderWidth: 2,
    height: 52,
    justifyContent: 'center',
    padding: 6,
    width: 52,
  },
  dotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    height: '100%',
    justifyContent: 'space-between',
    width: '100%',
  },
  dot: {
    borderRadius: 999,
    height: '26%',
    width: '26%',
  },
  dotOn: {
    backgroundColor: colors.navy,
  },
  dotOff: {
    backgroundColor: 'transparent',
  },
  rollingLabel: {
    bottom: -14,
    color: colors.gold,
    fontSize: 10,
    fontWeight: '900',
    position: 'absolute',
    textAlign: 'center',
    width: '100%',
  },
});
