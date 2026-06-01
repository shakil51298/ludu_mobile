export type PlayerId = 'red' | 'green' | 'yellow' | 'blue';
export type Coord = [number, number];
export type Phase = 'roll' | 'move' | 'done';

export type Player = {
  id: PlayerId;
  name: string;
  color: string;
  softColor: string;
  laneColor: string;
  startIndex: number;
  yard: Coord[];
  lane: Coord[];
};

export type Token = {
  id: string;
  playerId: PlayerId;
  index: number;
  progress: number;
};

export type Game = {
  playerIds: PlayerId[];
  tokens: Token[];
  activePlayerIndex: number;
  consecutiveSixes: number;
  dice: number | null;
  phase: Phase;
  winner: PlayerId | null;
  log: string[];
};

export type CellMeta = {
  key: string;
  trackIndex: number;
  lanePlayer?: Player;
  yardPlayer?: Player;
  homePlayer?: Player;
  isCenter: boolean;
  isCenterLabel: boolean;
};

export const BOARD_SIZE: number;
export const FINISH_PROGRESS: number;
export const HOME_CELLS: Record<PlayerId, Coord[]>;
export const PLAYERS: Player[];
export const SAFE_GLOBAL_INDEXES: Set<number>;

export function orderPlayerIds(playerCount: number, firstPlayer?: PlayerId): PlayerId[];
export function makeTokens(playerIds: PlayerId[]): Token[];
export function createGame(playerCount?: number, firstPlayer?: PlayerId): Game;
export function resetGame(playerCount?: number, firstPlayer?: PlayerId): Game;
export function findPlayer(playerId: PlayerId): Player;
export function coordKey(coord: Coord): string;
export function getGlobalIndex(token: Token): number;
export function getTokenCoord(token: Token): Coord;
export function isTrackProgress(progress: number): boolean;
export function nextTurn(game: Game): Game;
export function nextActiveIndex(game: Game): number;
export function getBlockedTrackKeys(game: Game): Map<string, PlayerId>;
export function isBlockedByOpponent(game: Game, token: Token, progress: number): boolean;
export function pathCrossesOpponentBlock(game: Game, token: Token, roll: number): boolean;
export function canMoveToken(game: Game, token: Token, roll: number): boolean;
export function getMovableTokens(game: Game): Token[];
export function getLegalTokenIds(game: Game): Set<string>;
export function getFirstHomeTokenToLaunch(game: Game): string | undefined;
export function getAutoMoveTokenId(game: Game): string | undefined;
export function rollDice(game: Game, forcedRoll?: number): Game;
export function moveToken(game: Game, tokenId: string): Game;
export function chooseCpuToken(game: Game): string | undefined;
export function buildCellMap(tokens: Token[]): Map<string, Token[]>;
export function getCellMeta(row: number, col: number): CellMeta;
