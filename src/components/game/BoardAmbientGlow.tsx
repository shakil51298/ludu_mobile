import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme';

export function BoardAmbientGlow({ size }: { size: number }) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.65, { duration: 1800 }),
        withTiming(0.35, { duration: 1800 }),
      ),
      -1,
      true,
    );
  }, [opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View pointerEvents="none" style={[styles.wrap, { width: size + 40, height: size + 40 }]}>
      <Animated.View
        style={[
          styles.glow,
          style,
          {
            width: size + 24,
            height: size + 24,
            borderRadius: (size + 24) / 8,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 0,
  },
  glow: {
    backgroundColor: colors.neonBlue,
    shadowColor: colors.royalBlue,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 1,
    shadowRadius: 28,
  },
});
