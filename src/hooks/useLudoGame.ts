import { useCallback, useEffect, useState } from 'react';
import {
  createGame,
  getAutoMoveTokenId,
  moveToken,
  rollDice,
  type Game,
  type PlayerId,
} from '../ludoEngine';
import { AUTO_MOVE_PREVIEW_MS } from '../constants/game';
import { clearSavedGame, loadSavedGame, saveGame } from '../storage/gameStorage';
import type { CaptureEvent, GameMode, PassSetup, SavedGameSnapshot, Screen } from '../types/setup';

const defaultPassSetup: PassSetup = {
  design: 'glass',
  players: 4,
  token: 'red',
  variant: 'classic',
};

export function useLudoGame(onVictory: (winnerId: PlayerId) => void) {
  const [screen, setScreen] = useState<Screen>('home');
  const [gameMode, setGameMode] = useState<GameMode>('pass');
  const [playerCount, setPlayerCount] = useState(4);
  const [game, setGame] = useState<Game>(() => createGame(4));
  const [notice, setNotice] = useState('Choose a mode to start.');
  const [captureEvent, setCaptureEvent] = useState<CaptureEvent | null>(null);
  const [savedGamePrompt, setSavedGamePrompt] = useState<SavedGameSnapshot | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [passSetup, setPassSetup] = useState<PassSetup>(defaultPassSetup);
  const [messageFlags, setMessageFlags] = useState({ lastCapture: false, lastExtraTurn: false });

  useEffect(() => {
    let mounted = true;
    loadSavedGame()
      .then((snapshot) => {
        if (mounted && snapshot) setSavedGamePrompt(snapshot);
      })
      .finally(() => {
        if (mounted) setStorageReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!storageReady || screen !== 'game') return;
    saveGame({ game, gameMode, passSetup, playerCount }).catch(() => undefined);
  }, [game, gameMode, passSetup, playerCount, screen, storageReady]);

  const startGame = useCallback((
    mode: GameMode,
    count = mode === 'computer' ? 2 : playerCount,
    setup = passSetup,
  ) => {
    const teamMode = mode === 'team' || setup.variant === 'team';
    const playerTotal = teamMode ? 4 : count;
    const firstPlayer = mode === 'pass' || mode === 'team' ? setup.token : 'red';

    setGameMode(mode === 'team' ? 'team' : mode);
    setPlayerCount(playerTotal);
    setPassSetup({ ...setup, variant: teamMode ? 'team' : setup.variant });
    setGame(createGame(playerTotal, firstPlayer, { teamMode }));
    setCaptureEvent(null);
    setMessageFlags({ lastCapture: false, lastExtraTurn: false });
    setScreen('game');
    setNotice(
      mode === 'computer'
        ? 'Computer match started.'
        : teamMode
          ? 'Team Up: Red+Yellow vs Green+Blue.'
          : `${setup.variant === 'team' ? 'Team Up' : 'Classic'} Pass N Play started.`,
    );
  }, [onVictory, passSetup, playerCount]);

  const continueSavedGame = useCallback((snapshot: SavedGameSnapshot) => {
    setGameMode(snapshot.gameMode);
    setPlayerCount(snapshot.playerCount);
    setPassSetup(snapshot.passSetup);
    setGame(snapshot.game);
    setCaptureEvent(null);
    if (snapshot.game.winner) onVictory(snapshot.game.winner);
    setScreen('game');
    setSavedGamePrompt(null);
    setNotice('Last match continued.');
  }, [onVictory]);

  const startFreshFromSavedPrompt = useCallback(() => {
    clearSavedGame().catch(() => undefined);
    setSavedGamePrompt(null);
    setScreen('home');
    setGame(createGame(4));
    setCaptureEvent(null);
    setNotice('Old match cleared. Choose a mode to start.');
  }, []);

  const applyMove = useCallback((
    tokenId: string,
    playMoveResult: (before: Game, after: Game, tokenId: string) => void,
  ) => {
    setGame((current) => {
      const next = moveToken(current, tokenId);
      const movingBefore = current.tokens.find((token) => token.id === tokenId);
      const movingAfter = next.tokens.find((token) => token.id === tokenId);
      const capturedTokenIds = current.tokens
        .filter((token) => {
          const nextToken = next.tokens.find((candidate) => candidate.id === token.id);
          return (
            token.playerId !== movingBefore?.playerId &&
            token.progress >= 0 &&
            token.progress < 57 &&
            nextToken?.progress === -1
          );
        })
        .map((token) => token.id);

      if (capturedTokenIds.length && movingBefore && movingAfter) {
        const travelSteps = Math.max(1, movingAfter.progress - movingBefore.progress);
        const hitDelayMs = travelSteps * 220 + 120;
        setCaptureEvent({
          actorTokenId: tokenId,
          capturedTokenIds,
          eventId: Date.now(),
          hitDelayMs,
          returnDelayMs: hitDelayMs + 380,
        });
        setMessageFlags((f) => ({ ...f, lastCapture: true, lastExtraTurn: true }));
      } else if (next.winner) {
        setMessageFlags({ lastCapture: false, lastExtraTurn: false });
      }

      playMoveResult(current, next, tokenId);
      return next;
    });
  }, []);

  const handleRoll = useCallback((
    forcedRoll: number | undefined,
    applyMoveFn: (tokenId: string) => void,
  ) => {
    setGame((current) => {
      const rolled = rollDice(current, forcedRoll);
      const autoMoveTokenId = getAutoMoveTokenId(rolled);
      const extraTurn = rolled.dice === 6 || rolled.phase === 'roll' && current.activePlayerIndex === rolled.activePlayerIndex;

      if (rolled.dice === 6 && rolled.phase === 'move') {
        setMessageFlags((f) => ({ ...f, lastExtraTurn: true }));
      }

      if (autoMoveTokenId) {
        setTimeout(() => applyMoveFn(autoMoveTokenId), AUTO_MOVE_PREVIEW_MS);
      } else if (!extraTurn) {
        setMessageFlags((f) => ({ ...f, lastCapture: false }));
      }

      return rolled;
    });
  }, []);

  return {
    applyMove,
    captureEvent,
    continueSavedGame,
    game,
    gameMode,
    handleRoll,
    messageFlags,
    notice,
    passSetup,
    playerCount,
    savedGamePrompt,
    screen,
    setCaptureEvent,
    setGame,
    setNotice,
    setScreen,
    startFreshFromSavedPrompt,
    startGame,
  };
}
