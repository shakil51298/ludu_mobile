import {
  FINISH_PROGRESS,
  HOME_CELLS,
  PLAYERS,
  SAFE_GLOBAL_INDEXES,
  TOKEN_COUNT,
  TRACK,
} from './ludoConfig';

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
} from './ludoConfig';

export function orderPlayerIds(playerCount, firstPlayer = 'red') {
  const count = Math.max(2, Math.min(4, playerCount));
  const first = BOARD_PLAYER_ORDER.includes(firstPlayer) ? firstPlayer : 'red';

  // Rule: two-player games should use opposite board corners, not adjacent colors.
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

export function createGame(playerCount = 4, firstPlayer = 'red') {
  const playerIds = orderPlayerIds(playerCount, firstPlayer);

  return {
    playerIds,
    tokens: makeTokens(playerIds),
    activePlayerIndex: 0,
    dice: null,
    phase: 'roll',
    winner: null,
    consecutiveSixes: 0,
    log: ['Match started. Roll a six to bring a token out.'],
  };
}

export function resetGame(playerCount = 4, firstPlayer = 'red') {
  return createGame(playerCount, firstPlayer);
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

  return Boolean(blockOwner && blockOwner !== token.playerId);
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
  // Rule: finished tokens never move again.
  if (token.progress === FINISH_PROGRESS) return false;

  // Rule: a token can leave home only on a six.
  if (token.progress === -1) return roll === 6 && !isBlockedByOpponent(game, token, 0);

  // Rule: the final home cell must be reached by exact dice value.
  if (token.progress + roll > FINISH_PROGRESS) return false;

  // Rule: blocked spaces made by two same-color pieces cannot be landed on or passed by opponents.
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

  // Rule: when all tokens are still at home and a six is rolled, one home token can start.
  if (game.dice !== 6 || !activeTokens.every((token) => token.progress === -1)) return undefined;
  return getMovableTokens(game).find((token) => token.progress === -1)?.id;
}

export function getAutoMoveTokenId(game) {
  const movableTokens = getMovableTokens(game);

  // Rule: if there is only one legal token, move it automatically.
  if (movableTokens.length === 1) return movableTokens[0].id;

  // Rule: at the start, a six can launch one identical home token automatically.
  return getFirstHomeTokenToLaunch(game);
}

export function rollDice(game, forcedRoll) {
  if (game.phase !== 'roll' || game.winner) return game;

  const dice = forcedRoll ?? Math.floor(Math.random() * 6) + 1;
  const activePlayer = findPlayer(game.playerIds[game.activePlayerIndex]);
  const consecutiveSixes = dice === 6 ? (game.consecutiveSixes ?? 0) + 1 : 0;

  // Rule: three sixes in a row loses the turn.
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

  // Rule: if no token can move after a roll, the turn passes immediately.
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

export function moveToken(game, tokenId) {
  const legalTokenIds = getLegalTokenIds(game);

  // Invalid moves are ignored: no dice roll, opponent token, finished token, or inexact home value.
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

    const opponentTokensOnTarget = game.tokens.filter(
      (other) =>
        other.playerId === token.playerId &&
        isTrackProgress(other.progress) &&
        coordKey(getTokenCoord(other)) === targetKey,
    );

    // Rule: same-color tokens, home/final-lane tokens, safe-star cells, and blocked pairs cannot be captured.
    if (
      token.playerId === movingToken.playerId ||
      !isTrackProgress(token.progress) ||
      isSafe ||
      opponentTokensOnTarget.length >= 2
    ) {
      return token;
    }

    // Rule: landing on an opponent token sends that token back home.
    if (coordKey(getTokenCoord(token)) === targetKey) {
      capturedIds.push(token.id);
      return { ...token, progress: -1 };
    }

    return token;
  });

  const playerFinished = updatedTokens
    .filter((token) => token.playerId === activePlayer.id)
    .every((token) => token.progress === FINISH_PROGRESS);
  const reachedHome = nextProgress === FINISH_PROGRESS;

  // Rule: rolling a six, capturing an opponent, or reaching final home grants another dice roll.
  const getsExtraTurn = game.dice === 6 || capturedIds.length > 0 || reachedHome;
  const nextIndex = getsExtraTurn ? game.activePlayerIndex : nextActiveIndex(game);
  const nextPlayer = findPlayer(game.playerIds[nextIndex]);
  const outcome = movingToken.progress === -1
    ? 'entered the board'
    : reachedHome
      ? 'reached home'
      : `moved ${game.dice}`;
  const captureText = capturedIds.length ? ` and captured ${capturedIds.length}` : '';

  return {
    ...game,
    tokens: updatedTokens,
    activePlayerIndex: nextIndex,
    consecutiveSixes: getsExtraTurn ? game.consecutiveSixes : 0,
    dice: null,
    phase: playerFinished ? 'done' : 'roll',
    winner: playerFinished ? activePlayer.id : null,
    log: [
      playerFinished
        ? `${activePlayer.name} wins the match.`
        : `${activePlayer.name} ${outcome}${captureText}. ${nextPlayer.name} is up${getsExtraTurn ? ' again' : ''}.`,
      ...game.log,
    ].slice(0, 8),
  };
}

export function chooseCpuToken(game) {
  const legalTokens = getMovableTokens(game);
  const currentPlayerId = game.playerIds[game.activePlayerIndex];

  const capture = legalTokens.find((token) => {
    const moved = { ...token, progress: token.progress === -1 ? 0 : token.progress + game.dice };
    if (!isTrackProgress(moved.progress)) return false;
    const targetKey = coordKey(getTokenCoord(moved));
    const safe = SAFE_GLOBAL_INDEXES.has(getGlobalIndex(moved));
    return !safe && game.tokens.some(
      (other) =>
        other.playerId !== currentPlayerId &&
        isTrackProgress(other.progress) &&
        coordKey(getTokenCoord(other)) === targetKey,
    );
  });

  return capture?.id
    ?? legalTokens.find((token) => token.progress + game.dice === FINISH_PROGRESS)?.id
    ?? legalTokens.find((token) => token.progress === -1)?.id
    ?? legalTokens.sort((a, b) => b.progress - a.progress)[0]?.id;
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
