import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, gradients, radius, shadows, typography } from '../../theme';
import { GlassCard } from './GlassCard';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MenuModeCard({
  description,
  icon,
  onPress,
  title,
  wide,
}: {
  description: string;
  icon: string;
  onPress: () => void;
  title: string;
  wide?: boolean;
}) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: 0.35 + glow.value * 0.35,
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15 });
        glow.value = withSpring(1);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
        glow.value = withSpring(0);
      }}
      style={[wide ? styles.wide : styles.half, cardStyle, shadows.glowBlue]}
    >
      <GlassCard style={styles.cardInner}>
        <LinearGradient
          colors={[...gradients.card]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { opacity: 0.55, borderRadius: radius.lg }]}
        />
        <View style={styles.row}>
          <View style={styles.iconBubble}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
          <View style={styles.textCol}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.desc}>{description}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </GlassCard>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wide: {
    marginBottom: 12,
    width: '100%',
  },
  half: {
    marginBottom: 12,
    width: '48%',
  },
  cardInner: {
    padding: 0,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  iconBubble: {
    alignItems: 'center',
    backgroundColor: colors.glassStrong,
    borderColor: colors.gold,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  icon: {
    fontSize: 24,
  },
  textCol: {
    flex: 1,
  },
  title: {
    ...typography.title,
    fontSize: 16,
  },
  desc: {
    ...typography.caption,
    color: colors.whiteMuted,
    marginTop: 2,
  },
  chevron: {
    color: colors.gold,
    fontSize: 28,
    fontWeight: '300',
  },
});
