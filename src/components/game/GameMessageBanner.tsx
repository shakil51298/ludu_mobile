import { Text, View } from 'react-native';
import type { Game } from '../../ludoEngine';
import { getGameMessage, type GameMessageContext } from '../../gameMessages';

export function GameMessageBanner({
  context,
  game,
  style,
  textStyle,
}: {
  context: GameMessageContext;
  game: Game;
  style?: object;
  textStyle?: object;
}) {
  const message = getGameMessage(game, context);

  return (
    <View style={style}>
      <Text selectable style={textStyle}>
        {message}
      </Text>
    </View>
  );
}
