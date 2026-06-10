import type { Game, PlayerId, TeamId } from './ludoEngine';
import { findPlayer, getLegalTokenIds, getMovableTokens, getTeamLabel } from './ludoEngine';

const TEAM_BY_PLAYER: Record<PlayerId, TeamId> = {
  red: 'red-yellow',
  yellow: 'red-yellow',
  green: 'green-blue',
  blue: 'green-blue',
};

export type GameMessageContext = {
  lastCapture?: boolean;
  lastExtraTurn?: boolean;
};

export function getGameMessage(
  game: Game,
  context: GameMessageContext = {},
): string {
  if (game.winner) {
    if (game.teamMode && game.winningTeam) {
      return `${getTeamLabel(game.winningTeam)} wins!`;
    }
    const winner = findPlayer(game.winner);
    return `${winner?.name ?? game.winner} wins!`;
  }

  if (game.phase === 'roll') {
    const active = findPlayer(game.playerIds[game.activePlayerIndex]);
    if (context.lastCapture) return 'Captured! Extra turn — roll again';
    if (context.lastExtraTurn) return 'Extra turn — roll the dice';
    return `${active?.name ?? 'Player'}: Roll the dice`;
  }

  const legal = getLegalTokenIds(game);
  const movable = getMovableTokens(game);
  const allHome = movable.every((t) => t.progress === -1);

  if (game.dice === 6 && allHome && movable.length > 0) {
    return 'Need 6 to start — choose a token';
  }

  if (legal.size === 1) {
    return 'Choose token (auto-moving…)';
  }

  if (legal.size > 0) {
    return 'Choose a token to move';
  }

  return 'Choose token';
}

export function getWinnerDisplayName(game: Game, winnerId: PlayerId): string {
  if (game.teamMode && game.winningTeam) {
    return getTeamLabel(game.winningTeam);
  }
  return findPlayer(winnerId)?.name ?? winnerId;
}

export function getPlayerTeamBadge(playerId: PlayerId, teamMode: boolean): string | null {
  if (!teamMode) return null;
  const team = TEAM_BY_PLAYER[playerId];
  return team === 'red-yellow' ? 'RY' : 'GB';
}
