import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import type { Game, PlayerId } from '../../ludoEngine';
import { findPlayer } from '../../ludoEngine';
import { getWinnerDisplayName } from '../../gameMessages';
import { colors, gradients, radius, typography } from '../../theme';
import { PremiumButton } from '../ui/PremiumButton';

const crownPulse = require('../../../assets/lottie/crown-pulse.json');
const coinSparkle = require('../../../assets/lottie/coin-sparkle.json');

export function PremiumWinnerModal({
  game,
  onClose,
  onNewGame,
  winnerId,
}: {
  game: Game;
  onClose: () => void;
  onNewGame: () => void;
  winnerId: PlayerId | null;
}) {
  const scale = useSharedValue(0.9);
  const glow = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withSequence(withTiming(1.08, { duration: 400 }), withTiming(1, { duration: 200 }));
    glow.value = withRepeat(
      withSequence(withTiming(1, { duration: 800 }), withTiming(0.4, { duration: 800 })),
      -1,
      true,
    );
  }, [glow, scale]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: glow.value,
  }));

  if (!winnerId) return null;
  const winner = findPlayer(winnerId);
  const displayName = getWinnerDisplayName(game, winnerId);

  return (
    <Modal animationType="fade" transparent visible onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <LottieView autoPlay loop source={coinSparkle} style={styles.confettiLeft} />
        <LottieView autoPlay loop source={coinSparkle} style={styles.confettiRight} />
        <Animated.View style={[styles.card, cardStyle]}>
          <LinearGradient colors={[...gradients.card]} style={StyleSheet.absoluteFill} />
          <LottieView autoPlay loop source={crownPulse} style={styles.crown} />
          <Text style={styles.title}>WINNER!</Text>
          <View style={[styles.badge, { backgroundColor: winner?.color ?? colors.royalBlue }]}>
            <Text style={styles.badgeText}>★</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.sub}>
            {game.teamMode ? 'All team tokens reached home' : 'All four tokens reached home'}
          </Text>
          <PremiumButton label="PLAY AGAIN" onPress={onNewGame} style={styles.btn} />
          <Pressable onPress={onClose} style={styles.close}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    alignItems: 'center',
    borderColor: colors.gold,
    borderRadius: radius.xl,
    borderWidth: 2,
    overflow: 'hidden',
    padding: 28,
    shadowColor: colors.gold,
    shadowOffset: { height: 0, width: 0 },
    shadowRadius: 24,
    width: '88%',
  },
  crown: {
    height: 100,
    width: 100,
  },
  title: {
    ...typography.hero,
    color: colors.gold,
    fontSize: 36,
    marginTop: 4,
  },
  badge: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 56,
    justifyContent: 'center',
    marginTop: 12,
    width: 56,
  },
  badgeText: {
    color: colors.white,
    fontSize: 28,
  },
  name: {
    ...typography.title,
    marginTop: 12,
  },
  sub: {
    ...typography.body,
    marginTop: 6,
    textAlign: 'center',
  },
  btn: {
    marginTop: 20,
    width: '100%',
  },
  close: {
    marginTop: 14,
    padding: 8,
  },
  closeText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  confettiLeft: {
    height: 200,
    left: -20,
    position: 'absolute',
    top: '18%',
    width: 200,
  },
  confettiRight: {
    height: 200,
    position: 'absolute',
    right: -20,
    top: '22%',
    width: 200,
  },
});
