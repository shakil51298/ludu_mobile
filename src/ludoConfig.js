export const BOARD_SIZE = 15;
export const TOKEN_COUNT = 4;
export const FINISH_PROGRESS = 57;

export const PLAYERS = [
  {
    id: 'red',
    name: 'You',
    color: '#005AA8',
    softColor: '#004B8D',
    laneColor: '#0E67A5',
    startIndex: 0,
    yard: [[1.8, 1.8], [1.8, 3.2], [3.2, 1.8], [3.2, 3.2]],
    lane: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  },
  {
    id: 'green',
    name: 'Green',
    color: '#D94D00',
    softColor: '#B84000',
    laneColor: '#F06B18',
    startIndex: 13,
    yard: [[1.8, 10.8], [1.8, 12.2], [3.2, 10.8], [3.2, 12.2]],
    lane: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  },
  {
    id: 'yellow',
    name: 'Yellow',
    color: '#067A2F',
    softColor: '#056528',
    laneColor: '#239A3F',
    startIndex: 26,
    yard: [[10.8, 10.8], [10.8, 12.2], [12.2, 10.8], [12.2, 12.2]],
    lane: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
  },
  {
    id: 'blue',
    name: 'Blue',
    color: '#E6B800',
    softColor: '#C79A00',
    laneColor: '#F4E733',
    startIndex: 39,
    yard: [[10.8, 1.8], [10.8, 3.2], [12.2, 1.8], [12.2, 3.2]],
    lane: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
  },
];

export const TRACK = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [5, 6], [4, 6], [3, 6], [2, 6],
  [1, 6], [0, 6], [0, 7], [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], [9, 8], [10, 8], [11, 8],
  [12, 8], [13, 8], [14, 8], [14, 7], [14, 6], [13, 6], [12, 6], [11, 6],
  [10, 6], [9, 6], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [7, 0],
  [6, 0],
];

const SAFE_START_RUN = PLAYERS.flatMap((player) => [
  player.startIndex,
  (player.startIndex + 8) % TRACK.length,
]);

export const SAFE_GLOBAL_INDEXES = new Set(SAFE_START_RUN);

export const HOME_CELLS = {
  red: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]],
  green: [[0, 13], [0, 14], [1, 13], [1, 14], [2, 13], [2, 14]],
  yellow: [[13, 13], [13, 14], [14, 13], [14, 14], [12, 13], [12, 14]],
  blue: [[13, 0], [13, 1], [14, 0], [14, 1], [12, 0], [12, 1]],
};
