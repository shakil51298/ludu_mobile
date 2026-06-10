import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PLAYERS, type PlayerId } from '../ludoEngine';
import { colors, radius, spacing, typography } from '../theme';
import { FloatingParticles } from '../components/ui/FloatingParticles';
import { GradientBackground } from '../components/ui/GradientBackground';
import { GlassCard } from '../components/ui/GlassCard';
import { MenuModeCard } from '../components/ui/MenuModeCard';
import type { PassSetup } from '../types/setup';

const crownPulse = require('../../assets/lottie/crown-pulse.json');
const diceBounce = require('../../assets/lottie/dice-bounce.json');

type Props = {
  hasSavedGame: boolean;
  notice: string;
  onComputer: () => void;
  onContinue: () => void;
  onSettings: () => void;
  onTeamUp: () => void;
  onPassSetupOpen: () => void;
};

export function HomeScreen({
  hasSavedGame,
  notice,
  onComputer,
  onContinue,
  onSettings,
  onTeamUp,
  onPassSetupOpen,
}: Props) {
  const insets = useSafeAreaInsets();
  const floatY = useSharedValue(0);

  floatY.value = withRepeat(
    withSequence(withTiming(-8, { duration: 1400 }), withTiming(0, { duration: 1400 })),
    -1,
    true,
  );

  const logoAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <GradientBackground>
      <StatusBar style="light" />
      <FloatingParticles />
      <View style={[styles.orb, styles.orbLeft]} />
      <View style={[styles.orb, styles.orbRight]} />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <GlassCard style={styles.currencyCard}>
          <View style={styles.currencyInner}>
            <Text style={styles.currencyIcon}>💎</Text>
            <Text style={styles.currencyValue}>50</Text>
          </View>
        </GlassCard>
        <GlassCard style={styles.currencyCard}>
          <View style={styles.currencyInner}>
            <Text style={styles.currencyIcon}>🪙</Text>
            <Text style={styles.currencyValue}>2,550</Text>
          </View>
        </GlassCard>
        <Text onPress={onSettings} style={styles.settingsBtn}>
          ⚙
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.xxl, paddingTop: spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.hero, logoAnim]}>
          <LottieView autoPlay loop source={crownPulse} style={styles.crown} />
          <Text style={styles.brand}>LUDO</Text>
          <Text style={styles.king}>KING</Text>
          <Text style={styles.tagline}>Play Like a King</Text>
        </Animated.View>

        <LottieView autoPlay loop source={diceBounce} style={styles.floatingDice} />

        <GlassCard style={styles.dailyCard}>
          <LinearGradient
            colors={['rgba(255,213,74,0.35)', 'rgba(21,101,255,0.25)']}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.dailyLabel}>DAILY REWARD</Text>
          <Text style={styles.dailyValue}>+250 coins ready!</Text>
          <Text style={styles.dailyHint}>Tap modes below to play</Text>
        </GlassCard>

        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        <View style={styles.menuGrid}>
          {hasSavedGame && (
            <MenuModeCard
              wide
              icon="▶️"
              title="Continue Game"
              description="Resume your saved match"
              onPress={onContinue}
            />
          )}
          <View style={styles.row}>
            <MenuModeCard
              icon="🎲"
              title="Pass N Play"
              description="2–4 players on one device"
              onPress={onPassSetupOpen}
            />
            <MenuModeCard
              icon="🤖"
              title="Vs Computer"
              description="Challenge smart CPU"
              onPress={onComputer}
            />
          </View>
          <MenuModeCard
            wide
            icon="👥"
            title="Team Up"
            description="Red+Yellow vs Green+Blue"
            onPress={onTeamUp}
          />
        </View>

        <View style={styles.colorRow}>
          {PLAYERS.map((p) => (
            <View key={p.id} style={[styles.colorDot, { backgroundColor: p.color }]} />
          ))}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

/** Pass setup still triggered from App via modal — export noop hook for types */
export type { PassSetup, PlayerId };

const styles = StyleSheet.create({
  orb: {
    backgroundColor: colors.neonBlue,
    borderRadius: 999,
    height: 180,
    opacity: 0.25,
    position: 'absolute',
    width: 180,
  },
  orbLeft: {
    left: -60,
    top: '20%',
  },
  orbRight: {
    backgroundColor: colors.neonGold,
    right: -40,
    top: '8%',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
  },
  currencyCard: {
    padding: 0,
  },
  currencyInner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  currencyIcon: {
    fontSize: 16,
  },
  currencyValue: {
    ...typography.button,
    fontSize: 13,
  },
  settingsBtn: {
    color: colors.gold,
    fontSize: 26,
    marginLeft: spacing.sm,
    padding: spacing.sm,
  },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  crown: {
    height: 72,
    width: 72,
  },
  brand: {
    ...typography.hero,
    fontSize: 48,
    textShadowColor: colors.royalBlue,
    textShadowOffset: { height: 0, width: 0 },
    textShadowRadius: 16,
  },
  king: {
    ...typography.subtitle,
    fontSize: 20,
    marginTop: -4,
  },
  tagline: {
    ...typography.body,
    color: colors.textGold,
    marginTop: spacing.xs,
  },
  floatingDice: {
    height: 64,
    marginBottom: spacing.md,
    width: 64,
  },
  dailyCard: {
    marginBottom: spacing.lg,
    width: '100%',
  },
  dailyLabel: {
    ...typography.label,
  },
  dailyValue: {
    ...typography.title,
    fontSize: 18,
    marginTop: 4,
  },
  dailyHint: {
    ...typography.caption,
    marginTop: 4,
  },
  notice: {
    ...typography.caption,
    color: colors.textGold,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  menuGrid: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  colorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  colorDot: {
    borderColor: colors.gold,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 14,
    width: 14,
  },
});
