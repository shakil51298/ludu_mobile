import { View } from 'react-native';
import { SAFE_GLOBAL_INDEXES } from '../../ludoConfig';
import { BOARD_SIZE, getCellMeta, PLAYERS, type PlayerId } from '../../ludoEngine';
import { colors, playerGem } from '../../theme';

const TRACK_COLORS = {
  red: playerGem.red.base,
  green: playerGem.green.base,
  yellow: playerGem.yellow.base,
  blue: playerGem.blue.base,
};

const NEUTRAL = colors.navyLight;
const WHITE = 'rgba(255,255,255,0.95)';
const GRID_LINE = 'rgba(7, 16, 40, 0.22)';

function cellBackground(row: number, col: number): string {
  const meta = getCellMeta(row, col);

  if (meta.isCenter) {
    if (row === 7 && col === 7) return '#1A1A2E';
    if (row <= 7 && col <= 7) return TRACK_COLORS.red;
    if (row <= 7 && col >= 7) return TRACK_COLORS.green;
    if (row >= 7 && col <= 7) return TRACK_COLORS.blue;
    return TRACK_COLORS.yellow;
  }

  if (meta.yardPlayer) return `${meta.yardPlayer.color}33`;
  if (meta.homePlayer) return meta.homePlayer.color;
  if (meta.lanePlayer) return meta.lanePlayer.laneColor;

  if (meta.trackIndex >= 0) {
    const globalIndex = meta.trackIndex;
    if (SAFE_GLOBAL_INDEXES.has(globalIndex)) return WHITE;
    const player = PLAYERS.find((p) => p.startIndex === globalIndex);
    if (player) return `${player.color}44`;
    return NEUTRAL;
  }

  return NEUTRAL;
}

export function LudoBoardGrid({
  boardWidth,
  playerIds,
}: {
  boardWidth: number;
  playerIds: PlayerId[];
}) {
  const cellSize = boardWidth / BOARD_SIZE;
  const cells = [];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const meta = getCellMeta(row, col);
      const inactiveYard = meta.yardPlayer && !playerIds.includes(meta.yardPlayer.id);

      cells.push(
        <View
          key={`${row}-${col}`}
          style={{
            position: 'absolute',
            left: col * cellSize,
            top: row * cellSize,
            width: cellSize,
            height: cellSize,
            backgroundColor: inactiveYard ? '#B0B0B0' : cellBackground(row, col),
            borderWidth: 0.5,
            borderColor: GRID_LINE,
            opacity: inactiveYard ? 0.35 : 1,
          }}
        />,
      );

      if (meta.trackIndex >= 0 && SAFE_GLOBAL_INDEXES.has(meta.trackIndex)) {
        cells.push(
          <View
            key={`star-${row}-${col}`}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: col * cellSize + cellSize * 0.28,
              top: row * cellSize + cellSize * 0.28,
              width: cellSize * 0.44,
              height: cellSize * 0.44,
              borderRadius: 4,
              backgroundColor: colors.gold,
              shadowColor: colors.gold,
              shadowOpacity: 0.9,
              shadowRadius: 6,
              transform: [{ rotate: '45deg' }],
            }}
          />,
        );
      }
    }
  }

  return <View style={{ width: boardWidth, height: boardWidth }}>{cells}</View>;
}
