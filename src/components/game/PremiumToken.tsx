import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import type { PlayerId } from '../../ludoEngine';
import { playerGem, shadows } from '../../theme';

export function PremiumToken({
  children,
  isLegal,
  playerId,
  size,
}: {
  children?: ReactNode;
  isLegal: boolean;
  playerId: PlayerId;
  size: number;
}) {
  const gem = playerGem[playerId];
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!isLegal) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 400 }),
        withTiming(1, { duration: 400 }),
      ),
      -1,
      true,
    );
  }, [isLegal, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: isLegal ? 0.95 : 0,
  }));

  return (
    <View style={{ width: size, height: size }}>
      {isLegal && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glowRing,
            ringStyle,
            {
              width: size + 10,
              height: size + 10,
              borderRadius: (size + 10) / 2,
              borderColor: gem.glow,
              left: -5,
              top: -5,
            },
            shadows.glowGold,
          ]}
        />
      )}
      <View style={[styles.token, { width: size, height: size, borderRadius: size / 2 }, shadows.soft]}>
        <LinearGradient
          colors={[gem.rim, gem.base, gem.glow]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[styles.fill, { borderRadius: size / 2 }]}
        />
        <View style={[styles.highlight, { width: size * 0.45, height: size * 0.28, borderRadius: size / 2 }]} />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  token: {
    overflow: 'hidden',
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  highlight: {
    backgroundColor: 'rgba(255,255,255,0.45)',
    left: '18%',
    position: 'absolute',
    top: '12%',
  },
  glowRing: {
    borderWidth: 3,
    position: 'absolute',
  },
});
