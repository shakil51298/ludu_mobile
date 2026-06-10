import AsyncStorage from '@react-native-async-storage/async-storage';
import { createGame, normalizeGame } from '../ludoEngine';
import { SAVED_GAME_KEY } from '../constants/game';
import type { SavedGameSnapshot } from '../types/setup';

export async function saveGame(snapshot: Omit<SavedGameSnapshot, 'savedAt'>) {
  await AsyncStorage.setItem(SAVED_GAME_KEY, JSON.stringify({ ...snapshot, savedAt: Date.now() }));
}

export async function loadSavedGame(): Promise<SavedGameSnapshot | null> {
  const rawSave = await AsyncStorage.getItem(SAVED_GAME_KEY);
  if (!rawSave) return null;

  try {
    const parsed = JSON.parse(rawSave) as SavedGameSnapshot;
    if (!parsed?.game?.tokens || !parsed?.passSetup || !parsed?.gameMode) return null;
    return {
      ...parsed,
      game: normalizeGame(parsed.game),
    };
  } catch {
    await AsyncStorage.removeItem(SAVED_GAME_KEY);
    return null;
  }
}

export async function clearSavedGame() {
  await AsyncStorage.removeItem(SAVED_GAME_KEY);
}

export function createDefaultGame() {
  return createGame(4);
}
