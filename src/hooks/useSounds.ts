import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect } from 'react';
import type { Game } from '../ludoEngine';
import { FINISH_PROGRESS, getGlobalIndex, SAFE_GLOBAL_INDEXES } from '../ludoEngine';

const diceRollSound = require('../../assets/sounds/dice-roll-real.mp3');
const tokenStepSound = require('../../assets/sounds/token-step.wav');
const captureSound = require('../../assets/sounds/capture.wav');
const finalHomeSound = require('../../assets/sounds/final-home.wav');
const victorySound = require('../../assets/sounds/victory.wav');
const safeStarSound = require('../../assets/sounds/safe-star.wav');

type AudioPlayer = ReturnType<typeof useAudioPlayer>;

function safePlay(player: AudioPlayer) {
  player.seekTo(0).then(() => player.play()).catch(() => {
    try {
      player.play();
    } catch {
      /* missing asset — ignore */
    }
  });
}

export function useSounds(onVictory?: (winnerId: Game['winner']) => void) {
  const diceAudioPlayer = useAudioPlayer(diceRollSound);
  const tokenStepAudioPlayer = useAudioPlayer(tokenStepSound);
  const captureAudioPlayer = useAudioPlayer(captureSound);
  const finalHomeAudioPlayer = useAudioPlayer(finalHomeSound);
  const victoryAudioPlayer = useAudioPlayer(victorySound);
  const safeStarAudioPlayer = useAudioPlayer(safeStarSound);

  useEffect(() => {
    setAudioModeAsync({
      interruptionMode: 'mixWithOthers',
      playsInSilentMode: true,
    }).catch(() => undefined);
  }, []);

  const playDiceRoll = useCallback(() => safePlay(diceAudioPlayer), [diceAudioPlayer]);
  const playTokenStep = useCallback(() => safePlay(tokenStepAudioPlayer), [tokenStepAudioPlayer]);

  const playMoveResult = useCallback((before: Game, after: Game, tokenId: string) => {
    if (before === after) return;

    const movingBefore = before.tokens.find((token) => token.id === tokenId);
    const movingAfter = after.tokens.find((token) => token.id === tokenId);
    const captured = before.tokens.some((token) => {
      const nextToken = after.tokens.find((candidate) => candidate.id === token.id);
      return (
        token.playerId !== movingBefore?.playerId &&
        token.progress >= 0 &&
        token.progress < FINISH_PROGRESS &&
        nextToken?.progress === -1
      );
    });
    const reachedFinalHome =
      movingBefore?.progress !== FINISH_PROGRESS && movingAfter?.progress === FINISH_PROGRESS;
    const landedOnSafeStar = Boolean(
      movingAfter &&
        movingAfter.progress >= 0 &&
        movingAfter.progress < 52 &&
        SAFE_GLOBAL_INDEXES.has(getGlobalIndex(movingAfter)),
    );

    if (captured) safePlay(captureAudioPlayer);
    if (landedOnSafeStar) setTimeout(() => safePlay(safeStarAudioPlayer), captured ? 220 : 0);
    if (reachedFinalHome) setTimeout(() => safePlay(finalHomeAudioPlayer), captured ? 360 : 0);
    if (after.winner && after.winner !== before.winner) {
      onVictory?.(after.winner);
      setTimeout(() => safePlay(victoryAudioPlayer), reachedFinalHome || captured ? 700 : 0);
    }
  }, [captureAudioPlayer, finalHomeAudioPlayer, onVictory, safeStarAudioPlayer, victoryAudioPlayer]);

  return {
    playDiceRoll,
    playMoveResult,
    playTokenStep,
  };
}
