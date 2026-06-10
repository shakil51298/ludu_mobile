/**
 * Run: npm test
 */
const assert = require('node:assert');

async function run() {
  const {
    createGame,
    moveToken,
    rollDice,
    canMoveToken,
    getAutoMoveTokenId,
    FINISH_PROGRESS,
    normalizeGame,
    isCaptureTarget,
    teamAllTokensFinished,
  } = await import('./ludoEngine.js');

  const game = createGame(2);
  const token = game.tokens.find((t) => t.playerId === 'red' && t.progress === -1);
  assert.ok(token);
  assert.strictEqual(canMoveToken(game, token, 5), false);
  assert.strictEqual(canMoveToken(game, token, 6), true);

  const nearHome = {
    ...game,
    dice: 3,
    phase: 'move',
    tokens: game.tokens.map((t) =>
      t.id === token.id ? { ...t, progress: FINISH_PROGRESS - 2 } : t,
    ),
  };
  const moved = nearHome.tokens.find((t) => t.id === token.id);
  assert.strictEqual(canMoveToken(nearHome, moved, 3), false);
  assert.strictEqual(canMoveToken(nearHome, moved, 2), true);

  let g = createGame(2);
  g = rollDice(g, 6);
  g = { ...g, phase: 'roll', dice: null };
  g = rollDice(g, 6);
  g = { ...g, phase: 'roll', dice: null };
  g = rollDice(g, 6);
  assert.strictEqual(g.phase, 'roll');
  assert.ok(g.log[0].includes('third six'));

  const teamGame = createGame(4, 'red', { teamMode: true });
  assert.strictEqual(isCaptureTarget(teamGame, 'red', { playerId: 'yellow', progress: 5 }), false);
  assert.strictEqual(isCaptureTarget(teamGame, 'red', { playerId: 'green', progress: 5 }), true);

  let teamDone = createGame(4, 'red', { teamMode: true });
  teamDone = {
    ...teamDone,
    tokens: teamDone.tokens.map((t) =>
      ['red', 'yellow'].includes(t.playerId) ? { ...t, progress: FINISH_PROGRESS } : t,
    ),
  };
  assert.strictEqual(teamAllTokensFinished(teamDone, 'red-yellow'), true);

  const legacy = normalizeGame({
    playerIds: ['red', 'green'],
    tokens: createGame(2).tokens,
    activePlayerIndex: 0,
    dice: null,
    phase: 'roll',
    winner: null,
    log: [],
  });
  assert.strictEqual(legacy.teamMode, false);

  console.log('ludoEngine tests: all passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
