import type { Game, PlayerId } from '../ludoEngine';

export type Screen = 'home' | 'game';
export type GameMode = 'pass' | 'computer' | 'team';
export type PassVariant = 'classic' | 'team';
export type HomeTab = 'HOME' | 'EVENT' | 'ADDA' | 'INVENTORY' | 'SOCIAL';
export type TokenDesign = 'glass' | 'royal' | 'neon';

export type PassSetup = {
  players: number;
  token: PlayerId;
  design: TokenDesign;
  variant: PassVariant;
};

export type CaptureEvent = {
  actorTokenId: string;
  capturedTokenIds: string[];
  eventId: number;
  hitDelayMs: number;
  returnDelayMs: number;
};

export type SavedGameSnapshot = {
  game: Game;
  gameMode: GameMode;
  passSetup: PassSetup;
  playerCount: number;
  savedAt: number;
};
