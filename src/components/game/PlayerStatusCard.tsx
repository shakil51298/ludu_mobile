import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import type { PlayerId } from '../../ludoEngine';
import { findPlayer } from '../../ludoEngine';
import { colors, playerGem, radius, shadows, typography } from '../../theme';

export function PlayerStatusCard({
  diceValue,
  finishedCount,
  isActive,
  isLeading,
  playerId,
}: {
  diceValue?: number;
  finishedCount: number;
  isActive: boolean;
  isLeading?: boolean;
  playerId: PlayerId;
}) {
  const player = findPlayer(playerId);
  const gem = playerGem[playerId];
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!isActive) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withSequence(withTiming(1.04, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1,
      true,
    );
  }, [isActive, pulse]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    borderColor: isActive ? colors.gold : colors.glassBorder,
  }));

  if (!player) return null;

  return (
    <Animated.View style={[styles.card, anim, isActive && shadows.glowGold]}>
      <LinearGradient
        colors={isActive ? [gem.base, colors.navyMid] : [colors.navyLight, colors.navyMid]}
        style={StyleSheet.absoluteFill}
      />
      {isLeading && <Text style={styles.crown}>👑</Text>}
      <View style={[styles.avatar, { backgroundColor: gem.base, borderColor: gem.rim }]}>
        <Text style={styles.avatarText}>{player.name[0]}</Text>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {player.name}
      </Text>
      <Text style={styles.meta}>
        Home {finishedCount}/4{diceValue ? ` • 🎲${diceValue}` : ''}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 2,
    marginRight: 8,
    minWidth: 72,
    overflow: 'hidden',
    padding: 8,
  },
  crown: {
    fontSize: 12,
    position: 'absolute',
    right: 4,
    top: 2,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  avatarText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
  },
  name: {
    ...typography.caption,
    color: colors.white,
    marginTop: 4,
  },
  meta: {
    ...typography.caption,
    fontSize: 9,
    marginTop: 2,
  },
});
