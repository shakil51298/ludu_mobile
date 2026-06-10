/** Red+Yellow vs Green+Blue (Ludo King style team up). */
export const TEAM_A = ['red', 'yellow'];
export const TEAM_B = ['green', 'blue'];

export const TEAM_BY_PLAYER = {
  red: 'red-yellow',
  yellow: 'red-yellow',
  green: 'green-blue',
  blue: 'green-blue',
};

export function isTeammate(playerA, playerB) {
  if (playerA === playerB) return true;
  return TEAM_BY_PLAYER[playerA] === TEAM_BY_PLAYER[playerB];
}

export function isTeamOpponent(playerA, playerB) {
  if (playerA === playerB) return false;
  return TEAM_BY_PLAYER[playerA] !== TEAM_BY_PLAYER[playerB];
}

export function getTeamLabel(teamId) {
  if (teamId === 'red-yellow') return 'Red & Yellow';
  if (teamId === 'green-blue') return 'Green & Blue';
  return teamId;
}

export function getTeamPlayerIds(teamId) {
  return teamId === 'red-yellow' ? TEAM_A : TEAM_B;
}
