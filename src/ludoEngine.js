import {
  FINISH_PROGRESS,
  HOME_CELLS,
  PLAYERS,
  SAFE_GLOBAL_INDEXES,
  TOKEN_COUNT,
  TRACK,
} from './ludoConfig.js';
import {
  getTeamLabel,
  getTeamPlayerIds,
  isTeammate,
  isTeamOpponent,
  TEAM_BY_PLAYER,
} from './teams.js';

const OPPOSITE_PLAYERS = {
  red: 'yellow',
  yellow: 'red',
  green: 'blue',
  blue: 'green',
};

const BOARD_PLAYER_ORDER = ['red', 'green', 'yellow', 'blue'];

export {
  BOARD_SIZE,
  FINISH_PROGRESS,
  HOME_CELLS,
  PLAYERS,
  SAFE_GLOBAL_INDEXES,
} from './ludoConfig.js';

export { isTeammate, isTeamOpponent, TEAM_BY_PLAYER, getTeamLabel } from './teams.js';

export function orderPlayerIds(playerCount, firstPlayer = 'red') {
  const count = Math.max(2, Math.min(4, playerCount));
  const first = BOARD_PLAYER_ORDER.includes(firstPlayer) ? firstPlayer : 'red';

  if (count === 2) return [first, OPPOSITE_PLAYERS[first]];

  const ids = BOARD_PLAYER_ORDER;
  const firstIndex = ids.indexOf(first);

  return [...ids.slice(firstIndex), ...ids.slice(0, firstIndex)].slice(0, count);
}

export function makeTokens(playerIds) {
  return playerIds.flatMap((playerId) =>
    Array.from({ length: TOKEN_COUNT }, (_, index) => ({
      id: `${playerId}-${index}`,
      playerId,
      index,
      progress: -1,
    })),
  );
}

/**
 * @param {number} playerCount
 * @param {import('./ludoEngine').PlayerId} [firstPlayer]
 * @param {{ teamMode?: boolean }} [options]
 */
export function createGame(playerCount = 4, firstPlayer = 'red', options = {}) {
  const teamMode = Boolean(options.teamMode);
  const count = teamMode ? 4 : playerCount;
  const playerIds = orderPlayerIds(count, firstPlayer);

  return {
    playerIds,
    tokens: makeTokens(playerIds),
    activePlayerIndex: 0,
    dice: null,
    phase: 'roll',
    winner: null,
    winningTeam: null,
    teamMode,
    consecutiveSixes: 0,
    log: [
      teamMode
        ? 'Team match started. Red+Yellow vs Green+Blue.'
        : 'Match started. Roll a six to bring a token out.',
    ],
  };
}

export function resetGame(playerCount = 4, firstPlayer = 'red', options = {}) {
  return createGame(playerCount, firstPlayer, options);
}

export function findPlayer(playerId) {
  return PLAYERS.find((player) => player.id === playerId);
}

export function coordKey(coord) {
  return coord.join('-');
}

export function getGlobalIndex(token) {
  const player = findPlayer(token.playerId);
  return (player.startIndex + token.progress) % TRACK.length;
}

export function getTokenCoord(token) {
  const player = findPlayer(token.playerId);

  if (token.progress === -1) return player.yard[token.index];
  if (token.progress > 51) return player.lane[token.progress - 52];
  return TRACK[getGlobalIndex(token)];
}

export function isTrackProgress(progress) {
  return progress >= 0 && progress <= 51;
}

export function isCaptureTarget(game, moverPlayerId, targetToken) {
  if (targetToken.playerId === moverPlayerId) return false;
  if (game.teamMode && isTeammate(moverPlayerId, targetToken.playerId)) return false;
  return true;
}

export function teamAllTokensFinished(game, teamId) {
  const ids = getTeamPlayerIds(teamId);
  return game.tokens
    .filter((token) => ids.includes(token.playerId))
    .every((token) => token.progress === FINISH_PROGRESS);
}

export function getWinningTeamIfAny(game) {
  if (!game.teamMode) return null;
  if (teamAllTokensFinished(game, 'red-yellow')) return 'red-yellow';
  if (teamAllTokensFinished(game, 'green-blue')) return 'green-blue';
  return null;
}

export function nextTurn(game) {
  return {
    ...game,
    activePlayerIndex: (game.activePlayerIndex + 1) % game.playerIds.length,
    consecutiveSixes: 0,
    dice: null,
    phase: game.winner ? 'done' : 'roll',
  };
}

export function nextActiveIndex(game) {
  return (game.activePlayerIndex + 1) % game.playerIds.length;
}

export function getBlockedTrackKeys(game) {
  const groups = new Map();

  for (const token of game.tokens) {
    if (!isTrackProgress(token.progress)) continue;

    const key = coordKey(getTokenCoord(token));
    const groupKey = `${token.playerId}:${key}`;

    if (!groups.has(groupKey)) groups.set(groupKey, { key, playerId: token.playerId, count: 0 });
    groups.get(groupKey).count += 1;
  }

  return new Map(
    Array.from(groups.values())
      .filter((group) => group.count >= 2)
      .map((group) => [group.key, group.playerId]),
  );
}

export function isBlockedByOpponent(game, token, progress) {
  if (!isTrackProgress(progress)) return false;

  const movedToken = { ...token, progress };
  const blockOwner = getBlockedTrackKeys(game).get(coordKey(getTokenCoord(movedToken)));

  if (!blockOwner || blockOwner === token.playerId) return false;
  if (game.teamMode && isTeammate(token.playerId, blockOwner)) return false;

  return true;
}

export function pathCrossesOpponentBlock(game, token, roll) {
  if (token.progress === -1) return isBlockedByOpponent(game, token, 0);

  for (let step = 1; step <= roll; step += 1) {
    const progress = token.progress + step;
    if (isBlockedByOpponent(game, token, progress)) return true;
  }

  return false;
}

export function canMoveToken(game, token, roll) {
  if (token.progress === FINISH_PROGRESS) return false;
  if (token.progress === -1) return roll === 6 && !isBlockedByOpponent(game, token, 0);
  if (token.progress + roll > FINISH_PROGRESS) return false;
  return !pathCrossesOpponentBlock(game, token, roll);
}

export function getMovableTokens(game) {
  if (!game.dice || game.phase !== 'move' || game.winner) return [];

  const activePlayerId = game.playerIds[game.activePlayerIndex];
  return game.tokens.filter(
    (token) => token.playerId === activePlayerId && canMoveToken(game, token, game.dice),
  );
}

export function getLegalTokenIds(game) {
  return new Set(getMovableTokens(game).map((token) => token.id));
}

export function getFirstHomeTokenToLaunch(game) {
  const activePlayerId = game.playerIds[game.activePlayerIndex];
  const activeTokens = game.tokens.filter((token) => token.playerId === activePlayerId);

  if (game.dice !== 6 || !activeTokens.every((token) => token.progress === -1)) return undefined;
  return getMovableTokens(game).find((token) => token.progress === -1)?.id;
}

export function getAutoMoveTokenId(game) {
  const movableTokens = getMovableTokens(game);
  if (movableTokens.length === 1) return movableTokens[0].id;
  return getFirstHomeTokenToLaunch(game);
}

export function rollDice(game, forcedRoll) {
  if (game.phase !== 'roll' || game.winner) return game;

  const dice = forcedRoll ?? Math.floor(Math.random() * 6) + 1;
  const activePlayer = findPlayer(game.playerIds[game.activePlayerIndex]);
  const consecutiveSixes = dice === 6 ? (game.consecutiveSixes ?? 0) + 1 : 0;

  if (consecutiveSixes >= 3) {
    const passedGame = nextTurn({ ...game, consecutiveSixes, dice });
    const nextPlayer = findPlayer(passedGame.playerIds[passedGame.activePlayerIndex]);

    return {
      ...passedGame,
      log: [
        `${activePlayer.name} rolled a third six and lost the turn. ${nextPlayer.name} is up.`,
        ...game.log,
      ].slice(0, 8),
    };
  }

  const nextGame = {
    ...game,
    consecutiveSixes,
    dice,
    phase: 'move',
    log: [`${activePlayer.name} rolled ${dice}.`, ...game.log].slice(0, 8),
  };
  const legalMoves = getMovableTokens(nextGame);

  if (!legalMoves.length) {
    const passedGame = nextTurn(nextGame);
    const nextPlayer = findPlayer(passedGame.playerIds[passedGame.activePlayerIndex]);

    return {
      ...passedGame,
      log: [
        `${activePlayer.name} rolled ${dice}, no move. ${nextPlayer.name} is up.`,
        ...game.log,
      ].slice(0, 8),
    };
  }

  return nextGame;
}

export function resolveWinner(game, lastMoverPlayerId) {
  if (game.teamMode) {
    const winningTeam = getWinningTeamIfAny(game);
    if (winningTeam) {
      return {
        winner: lastMoverPlayerId,
        winningTeam,
        phase: 'done',
      };
    }
    return { winner: null, winningTeam: null, phase: 'roll' };
  }

  const playerFinished = game.tokens
    .filter((token) => token.playerId === lastMoverPlayerId)
    .every((token) => token.progress === FINISH_PROGRESS);

  if (playerFinished) {
    return { winner: lastMoverPlayerId, winningTeam: null, phase: 'done' };
  }

  return { winner: null, winningTeam: null, phase: 'roll' };
}

export function moveToken(game, tokenId) {
  const legalTokenIds = getLegalTokenIds(game);

  if (!legalTokenIds.has(tokenId) || game.winner) return game;

  const movingToken = game.tokens.find((token) => token.id === tokenId);
  const activePlayer = findPlayer(movingToken.playerId);
  const nextProgress = movingToken.progress === -1 ? 0 : movingToken.progress + game.dice;
  const movedToken = { ...movingToken, progress: nextProgress };
  const targetCoord = getTokenCoord(movedToken);
  const targetKey = coordKey(targetCoord);
  const isSafe = isTrackProgress(nextProgress) && SAFE_GLOBAL_INDEXES.has(getGlobalIndex(movedToken));
  const capturedIds = [];

  const updatedTokens = game.tokens.map((token) => {
    if (token.id === tokenId) return movedToken;

    const sameColorOnTarget = game.tokens.filter(
      (other) =>
        other.playerId === token.playerId &&
        isTrackProgress(other.progress) &&
        coordKey(getTokenCoord(other)) === targetKey,
    );

    if (
      !isCaptureTarget(game, movingToken.playerId, token) ||
      !isTrackProgress(token.progress) ||
      isSafe ||
      sameColorOnTarget.length >= 2
    ) {
      return token;
    }

    if (coordKey(getTokenCoord(token)) === targetKey) {
      capturedIds.push(token.id);
      return { ...token, progress: -1 };
    }

    return token;
  });

  const tokensGame = { ...game, tokens: updatedTokens };
  const reachedHome = nextProgress === FINISH_PROGRESS;
  const winState = resolveWinner(tokensGame, movingToken.playerId);
  const getsExtraTurn = game.dice === 6 || capturedIds.length > 0 || reachedHome;
  const nextIndex = getsExtraTurn && !winState.winner ? game.activePlayerIndex : nextActiveIndex(game);
  const nextPlayer = findPlayer(game.playerIds[nextIndex]);
  const outcome = movingToken.progress === -1
    ? 'entered the board'
    : reachedHome
      ? 'reached home'
      : `moved ${game.dice}`;
  const captureText = capturedIds.length ? ` and captured ${capturedIds.length}` : '';

  const winMessage = winState.winningTeam
    ? `${getTeamLabel(winState.winningTeam)} wins the match.`
    : winState.winner
      ? `${activePlayer.name} wins the match.`
      : `${activePlayer.name} ${outcome}${captureText}. ${nextPlayer.name} is up${getsExtraTurn ? ' again' : ''}.`;

  return {
    ...tokensGame,
    activePlayerIndex: winState.winner ? game.activePlayerIndex : nextIndex,
    consecutiveSixes: getsExtraTurn && !winState.winner ? game.consecutiveSixes : 0,
    dice: null,
    phase: winState.phase,
    winner: winState.winner,
    winningTeam: winState.winningTeam,
    log: [winMessage, ...game.log].slice(0, 8),
  };
}

function simulateMove(game, token, roll = game.dice) {
  const nextProgress = token.progress === -1 ? 0 : token.progress + roll;
  return { ...token, progress: nextProgress };
}

function wouldCapture(game, token, roll) {
  const moved = simulateMove(game, token, roll);
  if (!isTrackProgress(moved.progress)) return false;
  const targetKey = coordKey(getTokenCoord(moved));
  const safe = SAFE_GLOBAL_INDEXES.has(getGlobalIndex(moved));
  if (safe) return false;

  return game.tokens.some(
    (other) =>
      isCaptureTarget(game, token.playerId, other) &&
      isTrackProgress(other.progress) &&
      coordKey(getTokenCoord(other)) === targetKey,
  );
}

function wouldWin(game, token, roll) {
  if (game.teamMode) {
    const moved = simulateMove(game, token, roll);
    const trial = {
      ...game,
      tokens: game.tokens.map((t) => (t.id === token.id ? moved : t)),
    };
    return Boolean(getWinningTeamIfAny(trial));
  }
  return token.progress + roll === FINISH_PROGRESS &&
    game.tokens
      .filter((t) => t.playerId === token.playerId && t.id !== token.id)
      .every((t) => t.progress === FINISH_PROGRESS);
}

function isInDanger(game, token) {
  if (!isTrackProgress(token.progress)) return false;
  const key = coordKey(getTokenCoord(token));
  const opponentIds = game.teamMode
    ? game.playerIds.filter((id) => isTeamOpponent(token.playerId, id))
    : game.playerIds.filter((id) => id !== token.playerId);

  for (const oppId of opponentIds) {
    for (const oppToken of game.tokens.filter((t) => t.playerId === oppId && isTrackProgress(t.progress))) {
      for (let roll = 1; roll <= 6; roll += 1) {
        const moved = simulateMove(game, oppToken, roll);
        if (isTrackProgress(moved.progress) && coordKey(getTokenCoord(moved)) === key) {
          const landingSafe = SAFE_GLOBAL_INDEXES.has(getGlobalIndex(moved));
          if (!landingSafe) return true;
        }
      }
    }
  }
  return false;
}

function landsOnSafe(game, token, roll) {
  const moved = simulateMove(game, token, roll);
  return isTrackProgress(moved.progress) && SAFE_GLOBAL_INDEXES.has(getGlobalIndex(moved));
}

function scoreToken(game, token) {
  const roll = game.dice;
  if (wouldWin(game, token, roll)) return 1000;
  if (wouldCapture(game, token, roll)) return 500;
  if (isInDanger(game, token) && !wouldCapture(game, token, roll)) {
    const escaped = simulateMove(game, token, roll);
    if (!isInDanger({ ...game, tokens: game.tokens.map((t) => (t.id === token.id ? escaped : t)) }, escaped)) {
      return 300;
    }
  }
  if (landsOnSafe(game, token, roll)) return 200;
  if (token.progress === -1 && roll === 6) return 150;
  return token.progress;
}

export function chooseCpuToken(game) {
  const legalTokens = getMovableTokens(game);
  if (!legalTokens.length) return undefined;

  const ranked = [...legalTokens].sort((a, b) => scoreToken(game, b) - scoreToken(game, a));
  return ranked[0]?.id;
}

export function buildCellMap(tokens) {
  const cells = new Map();

  for (const token of tokens) {
    const key = coordKey(getTokenCoord(token));
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(token);
  }

  return cells;
}

export function getCellMeta(row, col) {
  const key = `${row}-${col}`;
  const trackIndex = TRACK.findIndex(([trackRow, trackCol]) => trackRow === row && trackCol === col);
  const lanePlayer = PLAYERS.find((player) =>
    player.lane.some(([laneRow, laneCol]) => laneRow === row && laneCol === col),
  );
  const yardPlayer = PLAYERS.find((player) =>
    player.yard.some(([yardRow, yardCol]) => yardRow === row && yardCol === col),
  );
  const homePlayer = PLAYERS.find((player) =>
    HOME_CELLS[player.id].some(([homeRow, homeCol]) => homeRow === row && homeCol === col),
  );

  return {
    key,
    trackIndex,
    lanePlayer,
    yardPlayer,
    homePlayer,
    isCenter: row >= 6 && row <= 8 && col >= 6 && col <= 8,
    isCenterLabel: row === 7 && col === 7,
  };
}

/** Migrate saves from before team fields existed. */
export function normalizeGame(game) {
  if (!game?.tokens) return createGame(4);
  return {
    ...createGame(4),
    ...game,
    teamMode: Boolean(game.teamMode),
    winningTeam: game.winningTeam ?? null,
    consecutiveSixes: game.consecutiveSixes ?? 0,
  };
}
