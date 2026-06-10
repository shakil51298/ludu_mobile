import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme';

const PARTICLES = Array.from({ length: 18 }, (_, id) => ({
  id,
  left: `${(id * 17 + 7) % 100}%` as `${number}%`,
  size: 4 + (id % 4),
  delay: id * 180,
  duration: 2800 + (id % 5) * 400,
}));

function Particle({
  delay,
  duration,
  id,
  left,
  size,
}: (typeof PARTICLES)[number]) {
  const y = useSharedValue(0);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-32, { duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.9, { duration: duration / 2 }),
          withTiming(0.15, { duration: duration / 2 }),
        ),
        -1,
        true,
      ),
    );
  }, [delay, duration, opacity, y]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        animStyle,
        {
          left,
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: id % 2 === 0 ? colors.gold : colors.royalBlueLight,
        },
      ]}
    />
  );
}

export function FloatingParticles() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {PARTICLES.map((p) => (
        <Particle key={p.id} {...p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    bottom: '12%',
    position: 'absolute',
  },
});
