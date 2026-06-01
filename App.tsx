import { StatusBar } from 'expo-status-bar';
import LottieView from 'lottie-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import {
  BOARD_SIZE,
  PLAYERS,
  buildCellMap,
  chooseCpuToken,
  createGame,
  findPlayer,
  getAutoMoveTokenId,
  getLegalTokenIds,
  getTokenCoord,
  moveToken,
  rollDice,
  type Game,
  type PlayerId,
  type Token,
} from './src/ludoEngine';

const boardImage = require('./assets/boards/ludo-diagram-board.png');
const crownPulse = require('./assets/lottie/crown-pulse.json');
const diceBounce = require('./assets/lottie/dice-bounce.json');
const coinSparkle = require('./assets/lottie/coin-sparkle.json');
const HOME_TABS = ['HOME', 'EVENT', 'ADDA', 'INVENTORY', 'SOCIAL'] as const;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Screen = 'home' | 'game';
type GameMode = 'pass' | 'computer';
type HomeTab = (typeof HOME_TABS)[number];
type PassVariant = 'classic' | 'team';
type TokenDesign = 'glass' | 'royal' | 'neon';
type DiceMemory = Partial<Record<PlayerId, number>>;

type PassSetup = {
  players: number;
  token: PlayerId;
  design: TokenDesign;
  variant: PassVariant;
};

function useLoopAnimation(duration: number) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(value, {
        duration,
        easing: Easing.inOut(Easing.ease),
        toValue: 1,
        useNativeDriver: true,
      }),
    );

    loop.start();
    return () => loop.stop();
  }, [duration, value]);

  return value;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [gameMode, setGameMode] = useState<GameMode>('pass');
  const [playerCount, setPlayerCount] = useState(4);
  const [game, setGame] = useState(() => createGame(4));
  const [notice, setNotice] = useState('Choose a mode to start.');
  const [passSetup, setPassSetup] = useState<PassSetup>({
    design: 'glass',
    players: 4,
    token: 'red',
    variant: 'classic',
  });

  function startGame(mode: GameMode, count = mode === 'computer' ? 2 : playerCount, setup = passSetup) {
    const firstPlayer = mode === 'pass' ? setup.token : 'red';

    setGameMode(mode);
    setPlayerCount(count);
    setPassSetup(setup);
    setGame(createGame(count, firstPlayer));
    setScreen('game');
    setNotice(
      mode === 'computer'
        ? 'Computer match started.'
        : `${setup.variant === 'team' ? 'Team Up' : 'Classic'} Pass N Play started.`,
    );
  }

  if (screen === 'game') {
    return (
      <GameScreen
        game={game}
        gameMode={gameMode}
        passSetup={passSetup}
        onBack={() => setScreen('home')}
        onMove={(tokenId) => setGame((current) => moveToken(current, tokenId))}
        onRoll={(forcedRoll) => {
          setGame((current) => {
            const rolled = rollDice(current, forcedRoll);
            const autoMoveTokenId = getAutoMoveTokenId(rolled);

            if (autoMoveTokenId) {
              setTimeout(() => {
                setGame((latest) => moveToken(latest, autoMoveTokenId));
              }, 320);
            }

            return rolled;
          });
        }}
      />
    );
  }

  return (
    <HomeScreen
      notice={notice}
      onComputer={() => startGame('computer', 2)}
      onComingSoon={(message) => setNotice(message)}
      onPass={(setup) => startGame('pass', setup.variant === 'team' ? 4 : setup.players, setup)}
    />
  );
}

function HomeScreen({
  notice,
  onComingSoon,
  onComputer,
  onPass,
}: {
  notice: string;
  onComingSoon: (message: string) => void;
  onComputer: () => void;
  onPass: (setup: PassSetup) => void;
}) {
  const [activeTab, setActiveTab] = useState<HomeTab>('HOME');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPassSetup, setShowPassSetup] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [setup, setSetup] = useState<PassSetup>({
    design: 'glass',
    players: 4,
    token: 'red',
    variant: 'classic',
  });
  const shimmer = useLoopAnimation(2600);
  const bounce = useLoopAnimation(1700);
  const logoScale = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.05, 1],
  });
  const floatY = bounce.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -10, 0],
  });
  const shineX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-220, 220],
  });

  return (
    <View style={styles.homeRoot}>
      <StatusBar style="light" />
      <BoardPattern />
      <View pointerEvents="none" style={styles.sparkleCurtain}>
        <Animated.View style={[styles.shineBeam, { transform: [{ translateX: shineX }, { rotate: '-14deg' }] }]} />
        <LottieView autoPlay loop source={coinSparkle} style={styles.coinBurstLeft} />
        <LottieView autoPlay loop source={coinSparkle} style={styles.coinBurstRight} />
      </View>
      <View style={styles.topBar}>
        <View style={styles.avatarFrame}>
          <View style={styles.avatarFace}>
            <Text style={styles.avatarText}>P</Text>
          </View>
          <View style={styles.onlineDot} />
        </View>
        <TopIcon label="SET" onPress={() => onComingSoon('Settings panel is ready for sound, vibration, and table rules.')} />
        <TopIcon
          label="MAIL"
          badge={unreadNotifications > 0 ? String(unreadNotifications) : undefined}
          onPress={() => {
            setShowNotifications((current) => !current);
            setUnreadNotifications(0);
          }}
        />
        <Currency amount="50" tone="gem" />
        <Currency amount="2,550" tone="coin" />
        <TopIcon label="SHOP" onPress={() => onComingSoon('Shop preview: coins, dice skins, frames, and table themes.')} />
      </View>

      <View style={styles.sideRail}>
        <SmallBadge title="STARTER" subtitle="PACK" />
        <RoundBadge title="K" />
        <SmallBadge title="FREE" subtitle="COINS" />
      </View>

      <View style={styles.homeContent}>
        <View style={styles.helpBubble}>
          <GlassSkin />
          <Text style={styles.helpText}>?</Text>
        </View>
        <Animated.View style={[styles.heroLogo, { transform: [{ scale: logoScale }, { translateY: floatY }] }]}>
          <LottieView autoPlay loop source={crownPulse} style={styles.crownLottie} />
          <Text style={styles.kingText}>KING</Text>
          <View style={styles.logoLetters}>
            {'LUDO'.split('').map((letter, index) => (
              <Animated.View
                key={letter}
                style={[
                  styles.logoBall,
                  {
                    backgroundColor: ['#2D8FE8', '#E94751', '#25A866', '#F2C230'][index],
                    transform: [
                      {
                        translateY: shimmer.interpolate({
                          inputRange: [0, 0.25, 0.5, 0.75, 1],
                          outputRange: [0, index % 2 ? -5 : 3, 0, index % 2 ? 3 : -5, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.logoLetter}>{letter}</Text>
              </Animated.View>
            ))}
          </View>
          <MiniBoard />
        </Animated.View>

        <Text selectable style={styles.noticeText}>
          {notice}
        </Text>

        <View style={styles.playOptions}>
          <PlayOptionButton
            accent="#28E365"
            detail="You vs computer"
            icon="🤖"
            onPress={onComputer}
            title="PLAY COMPUTER"
          />
          <PlayOptionButton
            accent="#FFD22D"
            detail="2-4 local players"
            icon="🎲"
            onPress={() => setShowPassSetup(true)}
            title="PASS N PLAY"
          />
        </View>

        <AnimatedBabyField />

        {showNotifications && <NotificationPanel />}

        <HomeTabPanel activeTab={activeTab} />

        <View style={styles.modeGrid}>
          <ModeCard
            icon="GLOBE"
            players="Players: 145,509"
            title="ONLINE"
            onPress={() => onComingSoon('Online matchmaking needs a backend. Local modes are ready.')}
          />
          <ModeCard
            icon="TEAM"
            players="Players: 3,944"
            title="TEAM UP"
            onPress={() => onComingSoon('Team Up is prepared for future multiplayer rooms.')}
          />
          <ModeCard
            icon="LOVE"
            players="Players: 14,749"
            title="FRIENDS"
            onPress={() => onComingSoon('Friends mode will need accounts and invites.')}
          />
        </View>

        <View style={styles.tournamentRow}>
          <GiftButton label="7" />
          <View style={styles.tournamentBadge}>
            <Text style={styles.tournamentCrown}>♕</Text>
            <Text style={styles.tournamentText}>TOURNAMENT</Text>
          </View>
          <GiftButton label="DICE" />
        </View>

        <View style={styles.seasonTicket}>
          <GlassSkin />
          <Text style={styles.seasonText}>SEASON 26</Text>
          <Text style={styles.comingText}>Coming soon!</Text>
        </View>
      </View>

      <View style={styles.bottomTabs}>
        {HOME_TABS.map((tab, index) => (
          <Pressable
            key={tab}
            onPress={() => {
              setActiveTab(tab);
              onComingSoon(`${tab} tab selected.`);
              setShowNotifications(false);
            }}
            style={[styles.bottomTab, activeTab === tab && styles.activeBottomTab]}
          >
            <GlassSkin />
            <Text style={styles.bottomIcon}>{['⌂', '★', 'MIC', 'DICE', 'CHAT'][index]}</Text>
            <Text style={styles.bottomText}>{tab}</Text>
          </Pressable>
        ))}
      </View>
      <PassSetupModal
        onClose={() => setShowPassSetup(false)}
        onNext={() => {
          setShowPassSetup(false);
          onPass(setup);
        }}
        setup={setup}
        setSetup={setSetup}
        visible={showPassSetup}
      />
    </View>
  );
}

function GameScreen({
  game,
  gameMode,
  passSetup,
  onBack,
  onMove,
  onRoll,
}: {
  game: Game;
  gameMode: GameMode;
  passSetup: PassSetup;
  onBack: () => void;
  onMove: (tokenId: string) => void;
  onRoll: (forcedRoll?: number) => void;
}) {
  const { height, width } = useWindowDimensions();
  const [lastDiceByPlayer, setLastDiceByPlayer] = useState<DiceMemory>({});
  const [rollingPlayerId, setRollingPlayerId] = useState<PlayerId | null>(null);
  const [rollingValue, setRollingValue] = useState(1);
  const rollMotion = useRef(new Animated.Value(0)).current;
  const activePlayer = findPlayer(game.playerIds[game.activePlayerIndex]);
  const isRolling = Boolean(rollingPlayerId);
  const isCpuTurn = gameMode === 'computer' && activePlayer.id !== 'red' && !game.winner;
  const legalTokenIds = useMemo(() => getLegalTokenIds(game), [game]);
  const cellMap = useMemo(() => buildCellMap(game.tokens), [game.tokens]);
  const boardWidth = Math.max(260, Math.min(width - 20, height - 250, 540));
  const cellSize = boardWidth / BOARD_SIZE;
  const activePulse = useLoopAnimation(520);
  const activeScale = activePulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.09, 1],
  });
  const activeGlow = activePulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.64, 1, 0.64],
  });
  const arrowShift = activePulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -8, 0],
  });
  const rollingRotate = rollMotion.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  function rollWithAnimation() {
    if (isRolling || game.phase !== 'roll' || game.winner) return;

    const rollingFor = game.playerIds[game.activePlayerIndex];
    const finalDice = Math.floor(Math.random() * 6) + 1;
    let ticks = 0;

    setRollingPlayerId(rollingFor);
    rollMotion.setValue(0);
    Animated.timing(rollMotion, {
      duration: 760,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();

    const interval = setInterval(() => {
      ticks += 1;
      setRollingValue(Math.floor(Math.random() * 6) + 1);
      if (ticks >= 10) clearInterval(interval);
    }, 70);

    setTimeout(() => {
      clearInterval(interval);
      setRollingValue(finalDice);
      setLastDiceByPlayer((current) => ({ ...current, [rollingFor]: finalDice }));
      setRollingPlayerId(null);
      onRoll(finalDice);
    }, 780);
  }

  useEffect(() => {
    if (!isCpuTurn) return;
    const timer = setTimeout(() => {
      if (game.phase === 'roll') rollWithAnimation();
      if (game.phase === 'move') {
        const tokenId = chooseCpuToken(game);
        if (tokenId) onMove(tokenId);
      }
    }, 520);

    return () => clearTimeout(timer);
  }, [game, isCpuTurn, onMove, rollWithAnimation]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.gameRoot}
      contentContainerStyle={[styles.gameContent, { minHeight: height }]}
    >
      <StatusBar style="light" />
      <GameBackdrop />
      <View style={styles.gameHeader}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <GlassSkin />
          <Text style={styles.backText}>BACK</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.gameTitle}>Ludo Play</Text>
          <Text style={styles.gameSubtitle}>
            {gameMode === 'computer'
              ? 'Computer Match'
              : `${passSetup.variant === 'team' ? 'Team Up' : 'Classic'} • ${passSetup.design} tokens`}
          </Text>
        </View>
      </View>

      <View style={styles.gameBoardStage}>
        <View style={[styles.diceRail, { width: boardWidth }]}>
          {(['red', 'green'] as PlayerId[]).map((playerId) => (
            <GameDicePad
              activeGlow={activeGlow}
              activePlayerId={activePlayer.id}
              arrowShift={arrowShift}
              game={game}
              isCpuTurn={isCpuTurn}
              isRolling={isRolling}
              key={playerId}
              lastDice={lastDiceByPlayer[playerId]}
              onRoll={rollWithAnimation}
              playerId={playerId}
              rollingPlayerId={rollingPlayerId}
              rollingRotate={rollingRotate}
              rollingValue={rollingValue}
            />
          ))}
        </View>
        <View style={{ alignSelf: 'center', height: boardWidth, width: boardWidth }}>
          <LudoBoard
            activePlayerId={activePlayer.id}
            boardWidth={boardWidth}
            cellMap={cellMap}
            cellSize={cellSize}
            legalTokenIds={legalTokenIds}
            onMove={onMove}
            playerIds={game.playerIds}
          />
        </View>
        <View style={[styles.diceRail, { width: boardWidth }]}>
          {(['blue', 'yellow'] as PlayerId[]).map((playerId) => (
            <GameDicePad
              activeGlow={activeGlow}
              activePlayerId={activePlayer.id}
              arrowShift={arrowShift}
              game={game}
              isCpuTurn={isCpuTurn}
              isRolling={isRolling}
              key={playerId}
              lastDice={lastDiceByPlayer[playerId]}
              onRoll={rollWithAnimation}
              playerId={playerId}
              rollingPlayerId={rollingPlayerId}
              rollingRotate={rollingRotate}
              rollingValue={rollingValue}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function GameDicePad({
  activeGlow,
  activePlayerId,
  arrowShift,
  game,
  isCpuTurn,
  isRolling,
  lastDice,
  onRoll,
  playerId,
  rollingPlayerId,
  rollingRotate,
  rollingValue,
}: {
  activeGlow: Animated.AnimatedInterpolation<string | number>;
  activePlayerId: PlayerId;
  arrowShift: Animated.AnimatedInterpolation<string | number>;
  game: Game;
  isCpuTurn: boolean;
  isRolling: boolean;
  lastDice?: number;
  onRoll: () => void;
  playerId: PlayerId;
  rollingPlayerId: PlayerId | null;
  rollingRotate: Animated.AnimatedInterpolation<string | number>;
  rollingValue: number;
}) {
  const player = findPlayer(playerId);
  const isInGame = game.playerIds.includes(playerId);
  const isActive = activePlayerId === playerId && isInGame && !game.winner;
  const isThisDiceRolling = rollingPlayerId === playerId;
  const canRoll = isActive && game.phase === 'roll' && !isCpuTurn && !isRolling;
  const displayValue = isThisDiceRolling ? rollingValue : isActive && game.dice ? game.dice : lastDice;

  return (
    <Animated.View
      style={[
        styles.playerDicePad,
        playerId === 'blue' ? styles.blueDicePadOffset : null,
        {
          backgroundColor: player.color,
          borderColor: isActive ? '#FFFFFF' : player.laneColor,
          opacity: isActive ? activeGlow : isInGame ? 0.88 : 0.38,
        },
      ]}
    >
      {isActive && (
        <Animated.View pointerEvents="none" style={[styles.activeDiceArrow, { transform: [{ translateY: arrowShift }] }]}>
          <Text style={styles.activeDiceArrowText}>↓</Text>
        </Animated.View>
      )}
      <Pressable disabled={!canRoll} onPress={onRoll} style={styles.playerDicePressable}>
        <GlassSkin />
        <Animated.View
          style={[
            styles.playerDiceIcon,
            isThisDiceRolling ? { transform: [{ rotate: rollingRotate }, { scale: 1.12 }] } : null,
            !displayValue ? { opacity: 0.5 } : null,
          ]}
        >
          <DiceFace value={displayValue ?? 1} />
        </Animated.View>
        <Text style={styles.playerDiceText}>{isThisDiceRolling ? '...' : displayValue ? String(displayValue) : ''}</Text>
      </Pressable>
    </Animated.View>
  );
}

function DiceFace({ value }: { value: number }) {
  const dotIndexes: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  return (
    <View style={styles.diceFaceGrid}>
      {Array.from({ length: 9 }, (_, index) => (
        <View
          key={index}
          style={[styles.playerDiceDot, dotIndexes[value]?.includes(index) ? null : styles.hiddenDiceDot]}
        />
      ))}
    </View>
  );
}

function LudoBoard({
  activePlayerId,
  boardWidth,
  cellMap,
  cellSize,
  legalTokenIds,
  onMove,
  playerIds,
}: {
  activePlayerId: PlayerId;
  boardWidth: number;
  cellMap: Map<string, Token[]>;
  cellSize: number;
  legalTokenIds: Set<string>;
  onMove: (tokenId: string) => void;
  playerIds: PlayerId[];
}) {
  const allTokens = Array.from(cellMap.entries()).flatMap(([key, tokens]) => {
    const [row, col] = key.split('-').map(Number);
    return tokens.map((token, stackIndex) => ({ col, row, stackIndex, stackSize: tokens.length, token }));
  });
  const inactiveHomeTokens = PLAYERS.filter((player) => !playerIds.includes(player.id)).flatMap((player) =>
    player.yard.map(([row, col]) => ({ col, player, row })),
  );

  return (
    <ImageBackground
      source={boardImage}
      resizeMode="stretch"
      style={{
        ...styles.board,
        height: boardWidth,
        width: boardWidth,
      }}
    >
      {inactiveHomeTokens.map(({ col, player, row }, index) => (
        <View
          key={`${player.id}-inactive-${index}`}
          pointerEvents="none"
          style={[
            styles.token,
            styles.homeTokenButton,
            styles.inactiveHomeToken,
            {
              backgroundColor: player.color,
              height: cellSize * 0.94,
              left: col * cellSize + cellSize * 0.03,
              top: row * cellSize + cellSize * 0.03,
              width: cellSize * 0.94,
            },
          ]}
        >
          <TokenStar color={player.color} />
        </View>
      ))}
      {allTokens.map(({ col, row, stackIndex, stackSize, token }) => {
        const player = findPlayer(token.playerId);
        const isLegal = legalTokenIds.has(token.id);
        const position = getStackedTokenPosition(row, col, stackIndex, stackSize, cellSize, token.progress === -1);

        return (
          <BoardToken
            isHome={token.progress === -1}
            isLegal={isLegal}
            key={token.id}
            onPress={() => onMove(token.id)}
            playerColor={player.color}
            playerName={player.name}
            cellSize={cellSize}
            position={position}
            token={token}
            visibleOpacity={isLegal || player.id === activePlayerId ? 1 : 0.94}
          />
        );
      })}
    </ImageBackground>
  );
}

function BoardToken({
  isHome,
  isLegal,
  onPress,
  playerColor,
  playerName,
  cellSize,
  position,
  token,
  visibleOpacity,
}: {
  isHome: boolean;
  isLegal: boolean;
  onPress: () => void;
  playerColor: string;
  playerName: string;
  cellSize: number;
  position: { left: number; size: number; top: number };
  token: Token;
  visibleOpacity: number;
}) {
  const translateX = useRef(new Animated.Value(position.left)).current;
  const translateY = useRef(new Animated.Value(position.top)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const legalPulse = useRef(new Animated.Value(1)).current;
  const legalGlow = useRef(new Animated.Value(0)).current;
  const previousProgress = useRef(token.progress);

  useEffect(() => {
    if (!isLegal) {
      legalPulse.stopAnimation();
      legalGlow.stopAnimation();
      legalPulse.setValue(1);
      legalGlow.setValue(0);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(legalPulse, {
            duration: 330,
            easing: Easing.inOut(Easing.ease),
            toValue: 1.18,
            useNativeDriver: true,
          }),
          Animated.timing(legalGlow, {
            duration: 330,
            easing: Easing.inOut(Easing.ease),
            toValue: 1,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(legalPulse, {
            duration: 330,
            easing: Easing.inOut(Easing.ease),
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.timing(legalGlow, {
            duration: 330,
            easing: Easing.inOut(Easing.ease),
            toValue: 0.25,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [isLegal, legalGlow, legalPulse]);

  useEffect(() => {
    const priorProgress = previousProgress.current;
    const didAdvance = token.progress > priorProgress && priorProgress >= -1;
    const stepAnimations = didAdvance
      ? Array.from({ length: token.progress - priorProgress }, (_, index) => priorProgress + index + 1).flatMap(
          (progress) => {
            const [row, col] = getTokenCoord({ ...token, progress });
            const stepPosition = getStackedTokenPosition(row, col, 0, 1, cellSize, false);

            return [
              Animated.parallel([
                Animated.timing(translateX, {
                  duration: 120,
                  easing: Easing.inOut(Easing.quad),
                  toValue: stepPosition.left,
                  useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                  duration: 120,
                  easing: Easing.inOut(Easing.quad),
                  toValue: stepPosition.top,
                  useNativeDriver: true,
                }),
              ]),
            ];
          },
        )
      : [];

    previousProgress.current = token.progress;

    Animated.sequence([
      ...stepAnimations,
      Animated.parallel([
        Animated.timing(translateX, {
          duration: didAdvance ? 80 : 260,
          easing: Easing.out(Easing.cubic),
          toValue: position.left,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          duration: didAdvance ? 80 : 260,
          easing: Easing.out(Easing.cubic),
          toValue: position.top,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(pop, {
          duration: 120,
          easing: Easing.out(Easing.quad),
          toValue: 1.18,
          useNativeDriver: true,
        }),
        Animated.timing(pop, {
          duration: 160,
          easing: Easing.out(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [cellSize, pop, position.left, position.top, token.id, token.index, token.playerId, token.progress, translateX, translateY]);

  return (
    <AnimatedPressable
      accessibilityLabel={`${playerName} token ${token.index + 1}`}
      disabled={!isLegal}
      onPress={onPress}
      style={[
        styles.token,
        styles.absoluteToken,
        isHome ? styles.homeTokenButton : null,
        {
          backgroundColor: playerColor,
          height: position.size,
          opacity: visibleOpacity,
          transform: [{ translateX }, { translateY }, { scale: Animated.multiply(pop, legalPulse) }],
          width: position.size,
        },
        isLegal ? styles.legalToken : null,
      ]}
    >
      {isLegal && <Animated.View pointerEvents="none" style={[styles.activeTokenPulse, { opacity: legalGlow }]} />}
      <View pointerEvents="none" style={styles.tokenShine} />
      <TokenStar color={playerColor} />
    </AnimatedPressable>
  );
}

function TokenStar({ color }: { color: string }) {
  return (
    <View pointerEvents="none" style={[styles.tokenStarWrap, { backgroundColor: `${color}88`, borderColor: color }]}>
      <View style={styles.tokenStarGlassTop} />
      <Text style={styles.tokenStar}>★</Text>
    </View>
  );
}

function getStackedTokenPosition(
  row: number,
  col: number,
  stackIndex: number,
  stackSize: number,
  cellSize: number,
  isHome: boolean,
) {
  const size = isHome ? cellSize * 0.94 : stackSize > 1 ? cellSize * 0.52 : cellSize * 0.82;
  const offsets = stackSize > 1
    ? [
        [-0.18, -0.18],
        [0.18, -0.18],
        [-0.18, 0.18],
        [0.18, 0.18],
      ]
    : [[0, 0]];
  const [xOffset, yOffset] = offsets[stackIndex % offsets.length];

  return {
    left: col * cellSize + (cellSize - size) / 2 + xOffset * cellSize,
    size,
    top: row * cellSize + (cellSize - size) / 2 + yOffset * cellSize,
  };
}

function BoardCourtOverlay({ boardWidth }: { boardWidth: number }) {
  const labelSize = Math.max(9, boardWidth * 0.028);

  return (
    <View pointerEvents="none" style={styles.boardCourtOverlay}>
      <CornerCourt color="#B20F25" position="topLeft" title="Player 4" />
      <CornerCourt color="#087C3F" position="topRight" title="Player 3" />
      <CornerCourt color="#064DAE" position="bottomLeft" title="Player 1" />
      <CornerCourt color="#D6A500" position="bottomRight" title="Player 2" />
      <View style={[styles.centerArrow, styles.centerArrowRed]} />
      <View style={[styles.centerArrow, styles.centerArrowGreen]} />
      <View style={[styles.centerArrow, styles.centerArrowBlue]} />
      <View style={[styles.centerArrow, styles.centerArrowYellow]} />
      <Text style={[styles.boardSideLabel, styles.boardSideLeft, { fontSize: labelSize }]}>Player 4</Text>
      <Text style={[styles.boardSideLabel, styles.boardSideTopRight, { fontSize: labelSize }]}>Player 3</Text>
      <Text style={[styles.boardSideLabel, styles.boardSideBottomLeft, { fontSize: labelSize }]}>Player 1</Text>
      <Text style={[styles.boardSideLabel, styles.boardSideRight, { fontSize: labelSize }]}>Player 2</Text>
      <CornerDicePanel position="topLeft" color="#B20F25" />
      <CornerDicePanel position="topRight" color="#087C3F" />
      <CornerDicePanel position="bottomLeft" color="#064DAE" />
      <CornerDicePanel position="bottomRight" color="#D6A500" />
    </View>
  );
}

function CornerCourt({
  color,
  position,
}: {
  color: string;
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  title: string;
}) {
  return (
    <View style={[styles.cornerCourt, styles[position], { borderColor: color }]}>
      {Array.from({ length: 4 }, (_, index) => (
        <View key={index} style={[styles.cornerCourtPeg, { borderColor: color }]}>
          <View style={[styles.cornerCourtPegInner, { backgroundColor: color }]} />
        </View>
      ))}
    </View>
  );
}

function CornerDicePanel({
  color,
  position,
}: {
  color: string;
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}) {
  return (
    <View style={[styles.cornerDicePanel, styles[`${position}Dice`], { borderColor: color }]}>
      <View style={[styles.cornerDiceAvatar, { backgroundColor: color }]} />
      <View style={styles.cornerDiceBox}>
        <View style={styles.cornerDiceDot} />
        <View style={[styles.cornerDiceDot, { alignSelf: 'flex-end' }]} />
      </View>
    </View>
  );
}

function getFloatingDicePosition(playerId: PlayerId, boardWidth: number) {
  const size = 72;
  const inset = 8;
  const middle = boardWidth / 2 - size / 2;
  const max = boardWidth - size - inset;

  if (playerId === 'red') return { left: inset, top: inset };
  if (playerId === 'green') return { left: max, top: inset };
  if (playerId === 'yellow') return { left: max, top: max };
  if (playerId === 'blue') return { left: inset, top: max };
  return { left: middle, top: middle };
}

function CenterTile({ row, col }: { row: number; col: number }) {
  const color = row <= 7 && col <= 7
    ? '#E33D48'
    : row <= 7 && col >= 7
      ? '#25A866'
      : row >= 7 && col >= 7
        ? '#F2B705'
        : '#2574D9';

  return (
    <View style={{ ...styles.centerTile, backgroundColor: color }}>
      <View style={styles.centerInner} />
    </View>
  );
}

function BoardPattern() {
  return (
    <View pointerEvents="none" style={styles.patternLayer}>
      {Array.from({ length: 20 }, (_, index) => (
        <View
          key={index}
          style={[
            styles.patternTile,
            {
              left: `${(index * 23) % 100}%`,
              opacity: index % 3 === 0 ? 0.16 : 0.09,
              top: `${(index * 17) % 100}%`,
              transform: [{ rotate: `${index * 19}deg` }],
            },
          ]}
        >
          <View style={styles.patternDot} />
          <View style={[styles.patternDot, { alignSelf: 'flex-end' }]} />
        </View>
      ))}
    </View>
  );
}

function GameBackdrop() {
  return (
    <View pointerEvents="none" style={styles.gameBackdrop}>
      {Array.from({ length: 14 }, (_, index) => (
        <View
          key={`court-${index}`}
          style={[
            styles.bgCourt,
            {
              borderColor: ['#B20F25', '#087C3F', '#D6A500', '#064DAE'][index % 4],
              left: `${(index * 31) % 94}%`,
              opacity: index % 2 === 0 ? 0.24 : 0.16,
              top: `${(index * 19) % 96}%`,
              transform: [{ rotate: `${index * 17}deg` }],
            },
          ]}
        >
          <View style={styles.bgCourtCenter} />
        </View>
      ))}
      {Array.from({ length: 18 }, (_, index) => (
        <View
          key={`die-${index}`}
          style={[
            styles.bgDie,
            {
              left: `${(index * 23) % 96}%`,
              opacity: index % 3 === 0 ? 0.2 : 0.13,
              top: `${(index * 29) % 96}%`,
              transform: [{ rotate: `${index * 23}deg` }],
            },
          ]}
        >
          <View style={styles.bgDieDot} />
          <View style={[styles.bgDieDot, { alignSelf: 'flex-end' }]} />
          <View style={[styles.bgDieDot, { alignSelf: 'center' }]} />
        </View>
      ))}
      <View style={styles.gameBlackBlur} />
    </View>
  );
}

function TopIcon({ badge, label, onPress }: { badge?: string; label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.topIcon}>
      <GlassSkin />
      <Text style={styles.topIconText}>{label}</Text>
      {badge && (
        <View style={styles.topBadge}>
          <Text style={styles.topBadgeText}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

function Currency({ amount, tone }: { amount: string; tone: 'coin' | 'gem' }) {
  return (
    <View style={styles.currency}>
      <GlassSkin />
      <View style={[styles.currencyIcon, tone === 'gem' ? styles.gemIcon : styles.coinIcon]} />
      <Text selectable style={styles.currencyText}>{amount}</Text>
      <View style={styles.plusBox}>
        <Text style={styles.plusText}>+</Text>
      </View>
    </View>
  );
}

function SmallBadge({ subtitle, title }: { subtitle: string; title: string }) {
  return (
    <View style={styles.smallBadge}>
      <GlassSkin />
      <Text style={styles.smallBadgeTitle}>{title}</Text>
      <Text style={styles.smallBadgeSub}>{subtitle}</Text>
    </View>
  );
}

function RoundBadge({ title }: { title: string }) {
  return (
    <View style={styles.roundBadge}>
      <GlassSkin />
      <Text style={styles.roundBadgeText}>{title}</Text>
    </View>
  );
}

function MiniBoard() {
  return (
    <View style={styles.miniStage}>
      <View style={[styles.previewPawn, { backgroundColor: '#2D8FE8', left: 8, top: 44, transform: [{ scale: 1.28 }] }]} />
      <View style={[styles.previewPawn, { backgroundColor: '#E33D48', left: 72, top: 25 }]} />
      <View style={[styles.previewPawn, { backgroundColor: '#25A866', right: 72, top: 25 }]} />
      <View style={[styles.previewPawn, { backgroundColor: '#F2C230', right: 8, top: 44, transform: [{ scale: 1.28 }] }]} />
      <View style={styles.miniBoard}>
        {['#E33D48', '#25A866', '#2D8FE8', '#F2C230'].map((color) => (
          <View key={color} style={[styles.miniBoardZone, { borderColor: color }]}>
            <View style={[styles.miniDot, { backgroundColor: color }]} />
            <View style={[styles.miniDot, { backgroundColor: color }]} />
            <View style={[styles.miniDot, { backgroundColor: color }]} />
          </View>
        ))}
      </View>
      <LottieView autoPlay loop source={diceBounce} style={styles.heroDiceLottie} />
    </View>
  );
}

function AnimatedBabyField() {
  const run = useLoopAnimation(1800);
  const kick = useLoopAnimation(1200);
  const babyX = run.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-42, 42, -42],
  });
  const babyY = run.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -7, 0],
  });
  const ballX = kick.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [42, -34, 42],
  });
  const ballSpin = kick.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const armSwing = run.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-22deg', '24deg', '-22deg'],
  });
  const legSwing = run.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['28deg', '-30deg', '28deg'],
  });

  return (
    <View style={styles.babyField}>
      <GlassSkin />
      <View style={styles.fieldSun}>
        <Text style={styles.fieldSunText}>☀</Text>
      </View>
      <View style={styles.fieldLine} />
      <Animated.View style={[styles.babyMascot, { transform: [{ translateX: babyX }, { translateY: babyY }] }]}>
        <View style={styles.babyHead}>
          <Text style={styles.babyFace}>•ᴗ•</Text>
        </View>
        <View style={styles.babyBody} />
        <Animated.View style={[styles.babyArmLeft, { transform: [{ rotate: armSwing }] }]} />
        <Animated.View style={[styles.babyArmRight, { transform: [{ rotate: armSwing }] }]} />
        <Animated.View style={[styles.babyLegLeft, { transform: [{ rotate: legSwing }] }]} />
        <Animated.View style={[styles.babyLegRight, { transform: [{ rotate: legSwing }] }]} />
      </Animated.View>
      <Animated.View style={[styles.playBall, { transform: [{ translateX: ballX }, { rotate: ballSpin }] }]}>
        <Text style={styles.playBallText}>★</Text>
      </Animated.View>
      <Text selectable style={styles.fieldCaption}>Animated playground lobby</Text>
    </View>
  );
}

function NotificationPanel() {
  return (
    <View style={styles.notificationPanel}>
      <GlassSkin />
      <Text selectable style={styles.notificationTitle}>Notifications</Text>
      <Text selectable style={styles.notificationLine}>Daily bonus ready: +1,000 coins</Text>
      <Text selectable style={styles.notificationLine}>Computer mode is active now</Text>
      <Text selectable style={styles.notificationLine}>Pass N Play supports 2, 3, or 4 players</Text>
    </View>
  );
}

function HomeTabPanel({ activeTab }: { activeTab: HomeTab }) {
  const copy: Record<HomeTab, string> = {
    HOME: 'Pick Computer or Pass N Play to start playing now.',
    EVENT: 'Events hub ready for daily rewards, missions, and tournaments.',
    ADDA: 'Adda area ready for voice room, chat, and table hangouts.',
    INVENTORY: 'Inventory ready for dice skins, frames, coins, and boards.',
    SOCIAL: 'Social area ready for friends, invites, and leaderboards.',
  };

  return (
    <View style={styles.tabPanel}>
      <GlassSkin />
      <Text selectable style={styles.tabPanelTitle}>{activeTab}</Text>
      <Text selectable style={styles.tabPanelText}>{copy[activeTab]}</Text>
    </View>
  );
}

function PassSetupModal({
  onClose,
  onNext,
  setup,
  setSetup,
  visible,
}: {
  onClose: () => void;
  onNext: () => void;
  setup: PassSetup;
  setSetup: (setup: PassSetup) => void;
  visible: boolean;
}) {
  const goldPulse = useLoopAnimation(1900);
  const glowScale = goldPulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.03, 1],
  });
  const designs: { id: TokenDesign; label: string }[] = [
    { id: 'glass', label: 'Glass' },
    { id: 'royal', label: 'Royal' },
    { id: 'neon', label: 'Neon' },
  ];

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalBlurLayer} />
        <Animated.View style={[styles.passModal, { transform: [{ scale: glowScale }] }]}>
          <GlassSkin />
          <View style={styles.modalHeader}>
            <View>
              <Text selectable style={styles.modalTitle}>PASS N PLAY</Text>
              <Text selectable style={styles.modalSubtitle}>Choose token and game type</Text>
            </View>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <GlassSkin />
              <Text style={styles.modalCloseText}>×</Text>
            </Pressable>
          </View>

          <Text selectable style={styles.modalSectionTitle}>SELECT TOKEN</Text>
          <View style={styles.tokenSelectRow}>
            {PLAYERS.map((player) => {
              const selected = setup.token === player.id;

              return (
                <Pressable
                  key={player.id}
                  onPress={() => setSetup({ ...setup, token: player.id })}
                  style={[
                    styles.tokenChoice,
                    { borderColor: selected ? '#E0A915' : '#7B6423' },
                    selected && styles.selectedGoldCard,
                  ]}
                >
                  <GlassSkin />
                  <View style={[styles.tokenPreview, { backgroundColor: player.color }]}>
                    <Text style={styles.tokenPreviewText}>{player.name.slice(0, 1)}</Text>
                  </View>
                  <Text selectable style={styles.modalTinyText}>{player.name}</Text>
                  {selected && <Text style={styles.goldTick}>✓</Text>}
                </Pressable>
              );
            })}
          </View>

          <Text selectable style={styles.modalSectionTitle}>DESIGN TOKEN</Text>
          <View style={styles.designRow}>
            {designs.map((design) => {
              const selected = setup.design === design.id;

              return (
                <Pressable
                  key={design.id}
                  onPress={() => setSetup({ ...setup, design: design.id })}
                  style={[
                    styles.designChoice,
                    { borderColor: selected ? '#E0A915' : '#7B6423' },
                    selected && styles.selectedGoldCard,
                  ]}
                >
                  <GlassSkin />
                  <TokenDesignPreview design={design.id} color={findPlayer(setup.token).color} />
                  <Text selectable style={styles.modalTinyText}>{design.label}</Text>
                  {selected && <Text style={styles.goldTick}>✓</Text>}
                </Pressable>
              );
            })}
          </View>

          <Text selectable style={styles.modalSectionTitle}>SELECT GAME</Text>
          <View style={styles.gameTypeRow}>
            <GameTypeChoice
              description="Everyone plays single"
              icon="♟"
              selected={setup.variant === 'classic'}
              title="CLASSIC"
              onPress={() => setSetup({ ...setup, variant: 'classic' })}
            />
            <GameTypeChoice
              description="Two people one team"
              icon="⚔"
              selected={setup.variant === 'team'}
              title="TEAM UP"
              onPress={() => setSetup({ ...setup, players: 4, variant: 'team' })}
            />
          </View>

          {setup.variant === 'classic' && (
            <View style={styles.playerCountRow}>
              {[2, 3, 4].map((count) => {
                const selected = setup.players === count;

                return (
                  <Pressable
                    key={count}
                    onPress={() => setSetup({ ...setup, players: count })}
                    style={[
                      styles.modalCountButton,
                      selected && styles.selectedGoldCard,
                      { borderColor: selected ? '#E0A915' : '#7B6423' },
                    ]}
                  >
                    <GlassSkin />
                    <Text style={styles.modalCountText}>{count}P</Text>
                    {selected && <Text style={styles.goldTickSmall}>✓</Text>}
                  </Pressable>
                );
              })}
            </View>
          )}

          <Pressable onPress={onNext} style={styles.modalNextButton}>
            <GlassSkin />
            <Text style={styles.modalNextText}>NEXT</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

function TokenDesignPreview({ color, design }: { color: string; design: TokenDesign }) {
  return (
    <View
      style={[
        styles.designPreview,
        {
          backgroundColor: design === 'royal' ? '#1C2266' : color,
          borderColor: design === 'neon' ? '#70FFF8' : '#E0A915',
        },
      ]}
    >
      <View
        style={[
          styles.designPreviewInner,
          {
            backgroundColor: design === 'glass' ? 'rgba(255,255,255,0.45)' : design === 'royal' ? '#E0A915' : color,
          },
        ]}
      />
      <Text style={styles.designPreviewText}>{design === 'royal' ? '♕' : design === 'neon' ? '✦' : '●'}</Text>
    </View>
  );
}

function GameTypeChoice({
  description,
  icon,
  onPress,
  selected,
  title,
}: {
  description: string;
  icon: string;
  onPress: () => void;
  selected: boolean;
  title: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.gameTypeChoice,
        selected && styles.selectedGoldCard,
        { borderColor: selected ? '#E0A915' : '#7B6423' },
      ]}
    >
      <GlassSkin />
      <Text style={styles.gameTypeIcon}>{icon}</Text>
      <Text selectable style={styles.gameTypeTitle}>{title}</Text>
      <Text selectable style={styles.gameTypeDesc}>{description}</Text>
      {selected && <Text style={styles.goldTick}>✓</Text>}
    </Pressable>
  );
}

function ModeCard({
  icon,
  onPress,
  players,
  title,
}: {
  icon: string;
  onPress: () => void;
  players?: string;
  title: string;
}) {
  const motion = useLoopAnimation(2100);
  const lift = motion.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -4, 0],
  });
  const glow = motion.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.84, 1, 0.84],
  });

  return (
    <Pressable onPress={onPress} style={styles.modeButtonShell}>
      <Animated.View style={[styles.modeCard, { opacity: glow, transform: [{ translateY: lift }] }]}>
        <GlassSkin />
        <View style={styles.modeTop}>
          <Text style={styles.modeIcon}>{icon}</Text>
        </View>
        <View style={styles.modeBottom}>
          <Text style={styles.modeTitle}>{title}</Text>
        </View>
        {players && <Text selectable style={styles.playersText}>{players}</Text>}
      </Animated.View>
    </Pressable>
  );
}

function PlayOptionButton({
  accent,
  detail,
  icon,
  onPress,
  title,
}: {
  accent: string;
  detail: string;
  icon: string;
  onPress: () => void;
  title: string;
}) {
  const pulse = useLoopAnimation(1600);
  const scale = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.04, 1],
  });

  return (
    <Pressable onPress={onPress} style={styles.playOptionShell}>
      <Animated.View
        style={[
          styles.playOptionButton,
          {
            borderColor: accent,
            transform: [{ scale }],
          },
        ]}
      >
        <GlassSkin />
        <View style={[styles.playOptionIcon, { backgroundColor: accent }]}>
          <Text style={styles.playOptionIconText}>{icon}</Text>
        </View>
        <View style={styles.playOptionCopy}>
          <Text style={styles.playOptionTitle}>{title}</Text>
          <Text style={styles.playOptionDetail}>{detail}</Text>
        </View>
        <Text style={styles.playOptionArrow}>▶</Text>
      </Animated.View>
    </Pressable>
  );
}

function GiftButton({ label }: { label: string }) {
  const twinkle = useLoopAnimation(1500);

  return (
    <Animated.View
      style={[
        styles.giftButton,
        {
          transform: [
            {
              rotate: twinkle.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: ['-5deg', '6deg', '-5deg'],
              }),
            },
          ],
        },
      ]}
    >
      <GlassSkin />
      <Text style={styles.giftText}>{label}</Text>
    </Animated.View>
  );
}

function GlassSkin() {
  return (
    <View pointerEvents="none" style={styles.glassLayer}>
      <View style={styles.glassTopWash} />
      <View style={styles.glassReflection} />
      <View style={styles.glassBottomShade} />
      <View style={styles.glassRim} />
    </View>
  );
}

const cardShadow = '0 3px 0 rgba(255, 255, 255, 0.35) inset, 0 -7px 0 rgba(75, 43, 0, 0.45) inset, 0 6px 0 rgba(83, 45, 0, 0.95), 0 12px 18px rgba(0, 0, 0, 0.32)';
const blueGlassShadow = '0 2px 0 rgba(255,255,255,0.35) inset, 0 -5px 0 rgba(0, 36, 104, 0.42) inset, 0 5px 0 rgba(0, 24, 78, 0.65), 0 9px 16px rgba(0, 0, 0, 0.28)';
const yellowGlassShadow = '0 2px 0 rgba(255,255,255,0.5) inset, 0 -5px 0 rgba(156, 93, 0, 0.42) inset, 0 5px 0 rgba(91, 61, 10, 0.9), 0 9px 16px rgba(0, 0, 0, 0.26)';

const styles: Record<string, ViewStyle | TextStyle> = {
  activeBottomTab: {
    backgroundColor: 'rgba(75, 190, 255, 0.72)',
  },
  activePlayerPick: {
    backgroundColor: '#FFD22D',
  },
  activePlayerPickText: {
    color: '#142046',
  },
  avatarFace: {
    alignItems: 'center',
    backgroundColor: '#F1CF9A',
    borderRadius: 6,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  avatarFrame: {
    backgroundColor: '#28B44D',
    borderColor: '#FFE456',
    borderRadius: 7,
    borderWidth: 2,
    padding: 3,
  },
  avatarText: {
    color: '#10214B',
    fontSize: 24,
    fontWeight: '900',
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#FFD22D',
    borderColor: '#6F5200',
    borderRadius: 8,
    borderWidth: 2,
    boxShadow: yellowGlassShadow,
    justifyContent: 'center',
    minHeight: 42,
    overflow: 'hidden',
    paddingHorizontal: 14,
  },
  backText: {
    color: '#10214B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  babyArmLeft: {
    backgroundColor: '#F3B06B',
    borderRadius: 999,
    height: 8,
    left: 10,
    position: 'absolute',
    top: 41,
    width: 28,
  },
  babyArmRight: {
    backgroundColor: '#F3B06B',
    borderRadius: 999,
    height: 8,
    position: 'absolute',
    right: 10,
    top: 41,
    width: 28,
  },
  babyBody: {
    backgroundColor: '#27B5FF',
    borderColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 2,
    height: 40,
    marginTop: -4,
    width: 38,
  },
  babyFace: {
    color: '#412100',
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
  },
  babyField: {
    alignItems: 'center',
    backgroundColor: '#28B85D',
    borderColor: '#B8FF7A',
    borderRadius: 18,
    borderWidth: 3,
    boxShadow: '0 3px 0 rgba(255,255,255,0.3) inset, 0 -8px 0 rgba(0, 89, 37, 0.36) inset, 0 7px 0 rgba(0, 50, 30, 0.64), 0 13px 18px rgba(0,0,0,0.28)',
    height: 126,
    justifyContent: 'center',
    overflow: 'hidden',
    width: '88%',
  },
  babyHead: {
    alignItems: 'center',
    backgroundColor: '#FFD1A3',
    borderColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 2,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  babyLegLeft: {
    backgroundColor: '#FFE54D',
    borderRadius: 999,
    bottom: 0,
    height: 9,
    left: 18,
    position: 'absolute',
    width: 25,
  },
  babyLegRight: {
    backgroundColor: '#FFE54D',
    borderRadius: 999,
    bottom: 0,
    height: 9,
    position: 'absolute',
    right: 18,
    width: 25,
  },
  babyMascot: {
    alignItems: 'center',
    height: 82,
    justifyContent: 'center',
    position: 'absolute',
    top: 18,
    width: 88,
    zIndex: 3,
  },
  board: {
    alignSelf: 'center',
    backgroundColor: '#EBC486',
    borderColor: '#071028',
    borderRadius: 4,
    borderWidth: 2,
    boxShadow: '0 4px 0 rgba(255,255,255,0.24) inset, 0 -8px 0 rgba(0,0,0,0.36) inset, 0 14px 30px rgba(0,0,0,0.55)',
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  absoluteToken: {
    position: 'absolute',
  },
  activeTokenPulse: {
    backgroundColor: 'rgba(255, 241, 89, 0.42)',
    borderRadius: 999,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  activeDiceArrow: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: -25,
    zIndex: 4,
  },
  activeDiceArrowText: {
    color: '#FFD84A',
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 28,
    textShadowColor: '#5A3500',
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 1,
  },
  boardCourtOverlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
  boardSideBottomLeft: {
    bottom: '6%',
    left: '8%',
  },
  boardSideLabel: {
    color: '#FFFFFF',
    fontWeight: '900',
    position: 'absolute',
    textShadowColor: '#000000',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 0,
    zIndex: 2,
  },
  boardSideLeft: {
    left: '-1%',
    top: '20%',
    transform: [{ rotate: '-90deg' }],
  },
  boardSideRight: {
    right: '-1%',
    top: '72%',
    transform: [{ rotate: '90deg' }],
  },
  boardSideTopRight: {
    right: '8%',
    top: '6%',
  },
  bgCourt: {
    borderRadius: 8,
    borderWidth: 6,
    height: 88,
    justifyContent: 'center',
    position: 'absolute',
    width: 88,
  },
  bgCourtCenter: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    height: 38,
    width: 38,
  },
  bgDie: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderColor: 'rgba(255,255,255,0.36)',
    borderRadius: 8,
    borderWidth: 2,
    height: 48,
    padding: 8,
    position: 'absolute',
    width: 48,
  },
  bgDieDot: {
    backgroundColor: 'rgba(0,0,0,0.58)',
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  bottomIcon: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  bottomTab: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    justifyContent: 'center',
    margin: 4,
    overflow: 'hidden',
    paddingVertical: 8,
  },
  bottomTabs: {
    backgroundColor: '#0753AE',
    borderColor: '#47B7FF',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderTopWidth: 2,
    bottom: 0,
    flexDirection: 'row',
    left: 0,
    minHeight: 68,
    position: 'absolute',
    right: 0,
  },
  bottomText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  centerInner: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    height: '100%',
    transform: [{ rotate: '45deg' }],
    width: '100%',
  },
  centerTile: {
    height: '100%',
    opacity: 0.7,
    position: 'absolute',
    width: '100%',
  },
  centerArrow: {
    height: '13.33%',
    position: 'absolute',
    width: '13.33%',
    zIndex: 1,
  },
  centerArrowBlue: {
    backgroundColor: '#064DAE',
    left: '40%',
    top: '46.67%',
    transform: [{ rotate: '45deg' }],
  },
  centerArrowGreen: {
    backgroundColor: '#087C3F',
    left: '46.67%',
    top: '40%',
    transform: [{ rotate: '45deg' }],
  },
  centerArrowRed: {
    backgroundColor: '#B20F25',
    left: '40%',
    top: '40%',
    transform: [{ rotate: '45deg' }],
  },
  centerArrowYellow: {
    backgroundColor: '#D6A500',
    left: '46.67%',
    top: '46.67%',
    transform: [{ rotate: '45deg' }],
  },
  coinIcon: {
    backgroundColor: '#FFC42E',
  },
  coinBurstLeft: {
    height: 118,
    left: -18,
    position: 'absolute',
    top: 88,
    width: 118,
  },
  coinBurstRight: {
    height: 112,
    position: 'absolute',
    right: -18,
    top: 224,
    width: 112,
  },
  cornerCourt: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    borderWidth: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    height: '31%',
    justifyContent: 'center',
    padding: 12,
    position: 'absolute',
    width: '31%',
    zIndex: 1,
  },
  cornerCourtPeg: {
    alignItems: 'center',
    backgroundColor: '#F2F5FA',
    borderRadius: 999,
    borderWidth: 2,
    height: '34%',
    justifyContent: 'center',
    width: '34%',
  },
  cornerCourtPegInner: {
    borderRadius: 999,
    height: '58%',
    width: '58%',
  },
  cornerDiceAvatar: {
    borderColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 2,
    height: 20,
    width: 20,
  },
  cornerDiceBox: {
    backgroundColor: '#EFE9DA',
    borderColor: '#C2A766',
    borderRadius: 4,
    borderWidth: 1,
    height: 28,
    padding: 5,
    width: 32,
  },
  cornerDiceDot: {
    backgroundColor: '#111827',
    borderRadius: 999,
    height: 5,
    width: 5,
  },
  cornerDicePanel: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 230, 140, 0.72)',
    borderRadius: 5,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 6,
    minHeight: 36,
    padding: 4,
    position: 'absolute',
    width: '23%',
    zIndex: 3,
  },
  comingText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  cpuText: {
    color: '#2574D9',
    fontSize: 13,
    fontWeight: '800',
  },
  crownLottie: {
    height: 92,
    marginBottom: -24,
    width: 140,
  },
  currency: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 29, 100, 0.86)',
    borderColor: '#8BE7FF',
    borderRadius: 5,
    borderWidth: 1,
    boxShadow: blueGlassShadow,
    flexDirection: 'row',
    gap: 6,
    minHeight: 34,
    overflow: 'hidden',
    paddingHorizontal: 8,
  },
  currencyIcon: {
    borderRadius: 999,
    height: 17,
    width: 17,
  },
  currencyText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  dice: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderColor: '#D7E0EB',
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    width: 78,
  },
  diceText: {
    color: '#172033',
    fontSize: 40,
    fontWeight: '900',
    lineHeight: 44,
  },
  diceRail: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    overflow: 'visible',
  },
  diceFaceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    height: 22,
    width: 26,
  },
  floatingDiceButton: {
    alignItems: 'center',
    borderRadius: 16,
    height: '100%',
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  floatingDiceText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowColor: '#000000',
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 0,
  },
  floatingDiceWrap: {
    borderColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 3,
    boxShadow: '0 3px 0 rgba(255,255,255,0.38) inset, 0 -8px 0 rgba(0,0,0,0.32) inset, 0 8px 18px rgba(0,0,0,0.45)',
    height: 72,
    overflow: 'hidden',
    position: 'absolute',
    width: 72,
    zIndex: 10,
  },
  disabledButton: {
    backgroundColor: '#8090B5',
  },
  designChoice: {
    alignItems: 'center',
    backgroundColor: 'rgba(22, 20, 38, 0.84)',
    borderRadius: 13,
    borderWidth: 2,
    flex: 1,
    gap: 5,
    minHeight: 88,
    overflow: 'hidden',
    padding: 8,
  },
  designPreview: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 3,
    height: 42,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 42,
  },
  designPreviewInner: {
    borderRadius: 999,
    height: 20,
    left: 7,
    opacity: 0.72,
    position: 'absolute',
    top: 5,
    width: 20,
  },
  designPreviewText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    textShadowColor: '#000000',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 0,
  },
  designRow: {
    flexDirection: 'row',
    gap: 9,
  },
  gameContent: {
    alignItems: 'center',
    gap: 14,
    justifyContent: 'center',
    padding: 10,
    paddingBottom: 26,
    paddingTop: 86,
  },
  gameBoardStage: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  gameBackdrop: {
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  gameBlackBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  gameHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    left: 10,
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 20,
  },
  gameRoot: {
    backgroundColor: '#02040B',
    flex: 1,
  },
  gameSubtitle: {
    color: '#B8DDFF',
    fontSize: 13,
    fontWeight: '800',
  },
  gameTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  gameTypeChoice: {
    alignItems: 'center',
    backgroundColor: 'rgba(22, 20, 38, 0.84)',
    borderRadius: 14,
    borderWidth: 2,
    flex: 1,
    gap: 4,
    minHeight: 105,
    overflow: 'hidden',
    padding: 10,
  },
  gameTypeDesc: {
    color: '#F9E8A9',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
  gameTypeIcon: {
    color: '#E0A915',
    fontSize: 22,
    fontWeight: '900',
  },
  gameTypeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gameTypeTitle: {
    color: '#E0A915',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  gemIcon: {
    backgroundColor: '#77D4FF',
    transform: [{ rotate: '45deg' }],
  },
  giftButton: {
    alignItems: 'center',
    backgroundColor: '#FFD22D',
    borderColor: '#885F00',
    borderRadius: 16,
    borderWidth: 3,
    boxShadow: yellowGlassShadow,
    height: 58,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 58,
  },
  giftText: {
    color: '#10214B',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  fieldCaption: {
    bottom: 5,
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
    position: 'absolute',
    textShadowColor: '#063F20',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 0,
  },
  fieldLine: {
    backgroundColor: 'rgba(255,255,255,0.48)',
    borderRadius: 999,
    height: 3,
    left: 18,
    position: 'absolute',
    right: 18,
    top: 82,
  },
  fieldSun: {
    alignItems: 'center',
    backgroundColor: '#FFD22D',
    borderColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 2,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: 14,
    top: 12,
    width: 32,
  },
  fieldSunText: {
    color: '#B85400',
    fontSize: 17,
    fontWeight: '900',
  },
  glassBottomShade: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    bottom: 0,
    height: '34%',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  glassLayer: {
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  glassReflection: {
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    borderRadius: 999,
    height: '38%',
    left: '10%',
    opacity: 0.72,
    position: 'absolute',
    top: '8%',
    transform: [{ rotate: '-9deg' }],
    width: '70%',
  },
  glassRim: {
    borderColor: 'rgba(255,255,255,0.42)',
    borderRadius: 13,
    borderWidth: 1,
    bottom: 2,
    left: 2,
    position: 'absolute',
    right: 2,
    top: 2,
  },
  glassTopWash: {
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    height: '50%',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  goldTick: {
    color: '#E0A915',
    fontSize: 19,
    fontWeight: '900',
    position: 'absolute',
    right: 8,
    textShadowColor: '#3E2C00',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 0,
    top: 6,
  },
  goldTickSmall: {
    color: '#E0A915',
    fontSize: 13,
    fontWeight: '900',
    position: 'absolute',
    right: 5,
    top: 3,
  },
  helpBubble: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#FFD22D',
    borderColor: '#10214B',
    borderRadius: 9,
    borderWidth: 3,
    boxShadow: yellowGlassShadow,
    height: 46,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 54,
  },
  helpText: {
    color: '#143E87',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 34,
  },
  heroDiceLottie: {
    height: 94,
    left: 92,
    position: 'absolute',
    top: 18,
    width: 94,
  },
  heroLogo: {
    alignItems: 'center',
  },
  homeContent: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 14,
    paddingTop: 160,
    paddingBottom: 94,
  },
  homeRoot: {
    backgroundColor: '#0A3B8E',
    flex: 1,
  },
  homeText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
    position: 'absolute',
    textShadowColor: 'rgba(0,0,0,0.32)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 2,
  },
  homeTokenSlot: {
    backgroundColor: '#F8F8F1',
    borderRadius: 999,
    borderColor: '#071028',
    borderWidth: 1.5,
    boxShadow: '0 1px 0 rgba(255,255,255,0.6) inset, 0 -2px 0 rgba(0,0,0,0.14) inset',
    height: '72%',
    position: 'absolute',
    width: '72%',
  },
  homeTokenButton: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
    boxShadow: '0 4px 0 rgba(255,255,255,0.5) inset, 0 -7px 0 rgba(0,0,0,0.3) inset, 0 6px 11px rgba(0,0,0,0.42)',
  },
  inactiveHomeToken: {
    opacity: 0.86,
    position: 'absolute',
  },
  hiddenDiceDot: {
    opacity: 0,
  },
  kingText: {
    color: '#FFD22D',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: -4,
    textShadowColor: '#6D3A00',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 0,
  },
  legalToken: {
    borderColor: '#FFFFFF',
    borderWidth: 3.5,
    boxShadow: '0 4px 0 rgba(255,255,255,0.52) inset, 0 -7px 0 rgba(0,0,0,0.28) inset, 0 0 0 3px rgba(255,237,87,0.86), 0 0 18px rgba(255,237,87,0.92)',
  },
  laneArrow: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 12,
    position: 'absolute',
    textShadowColor: '#000000',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 0,
    zIndex: 2,
  },
  log: {
    backgroundColor: '#FFFFFF',
    borderColor: '#10214B',
    borderRadius: 8,
    borderWidth: 2,
    gap: 8,
    padding: 14,
  },
  logLine: {
    color: '#475467',
    fontSize: 14,
    lineHeight: 20,
  },
  logoBall: {
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 3,
    height: 43,
    justifyContent: 'center',
    width: 43,
  },
  logoLetter: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 31,
    textShadowColor: '#10214B',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 0,
  },
  logoLetters: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: -1,
  },
  miniBoard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#10214B',
    borderRadius: 4,
    borderWidth: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    height: 92,
    overflow: 'hidden',
    transform: [{ perspective: 160 }, { rotateX: '16deg' }],
    width: 132,
  },
  miniBoardZone: {
    alignItems: 'center',
    borderWidth: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    height: 44,
    justifyContent: 'center',
    width: 64,
  },
  miniDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  miniStage: {
    height: 134,
    justifyContent: 'center',
    marginTop: -2,
    width: 286,
  },
  modeBottom: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 210, 45, 0.92)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 5,
  },
  modeCard: {
    backgroundColor: '#168DF4',
    borderColor: '#FFE456',
    borderRadius: 15,
    borderWidth: 3,
    boxShadow: cardShadow,
    height: '100%',
    overflow: 'hidden',
    width: '100%',
  },
  modeButtonShell: {
    width: '30%',
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 13,
    justifyContent: 'center',
    width: '100%',
  },
  modeIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  modeTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
    textAlign: 'center',
    textShadowColor: '#10214B',
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 0,
  },
  modeTop: {
    alignItems: 'center',
    backgroundColor: 'rgba(25, 159, 255, 0.78)',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    minHeight: 58,
    justifyContent: 'center',
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  modalBlurLayer: {
    backgroundColor: 'rgba(6, 16, 48, 0.78)',
    bottom: 0,
    left: 0,
    opacity: 0.9,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  modalClose: {
    alignItems: 'center',
    backgroundColor: 'rgba(224, 169, 21, 0.24)',
    borderColor: '#E0A915',
    borderRadius: 999,
    borderWidth: 2,
    height: 34,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 34,
  },
  modalCloseText: {
    color: '#E0A915',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 26,
  },
  modalCountButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(22, 20, 38, 0.84)',
    borderRadius: 10,
    borderWidth: 2,
    flex: 1,
    justifyContent: 'center',
    minHeight: 38,
    overflow: 'hidden',
  },
  modalCountText: {
    color: '#E0A915',
    fontSize: 12,
    fontWeight: '900',
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  modalNextButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#E0A915',
    borderColor: '#FFF2B7',
    borderRadius: 14,
    borderWidth: 2,
    boxShadow: yellowGlassShadow,
    justifyContent: 'center',
    minHeight: 48,
    overflow: 'hidden',
    width: '72%',
  },
  modalNextText: {
    color: '#221700',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  modalSectionTitle: {
    color: '#E0A915',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    textShadowColor: '#3E2C00',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 0,
  },
  modalSubtitle: {
    color: '#F9E8A9',
    fontSize: 11,
    fontWeight: '800',
  },
  modalTinyText: {
    color: '#E0A915',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  modalTitle: {
    color: '#E0A915',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.2,
    textShadowColor: '#3E2C00',
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 0,
  },
  newGameButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(237, 242, 247, 0.9)',
    borderColor: '#FFFFFF',
    borderRadius: 7,
    borderWidth: 1,
    boxShadow: '0 2px 0 rgba(255,255,255,0.8) inset, 0 -4px 0 rgba(117, 131, 151, 0.28) inset, 0 4px 0 rgba(31, 41, 55, 0.3)',
    flexBasis: '100%',
    justifyContent: 'center',
    minHeight: 44,
    overflow: 'hidden',
  },
  newGameText: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  notificationLine: {
    color: '#DFF3FF',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 16,
  },
  notificationPanel: {
    backgroundColor: 'rgba(11, 74, 163, 0.92)',
    borderColor: '#8BE7FF',
    borderRadius: 13,
    borderWidth: 2,
    boxShadow: blueGlassShadow,
    gap: 4,
    overflow: 'hidden',
    padding: 12,
    width: '88%',
  },
  notificationTitle: {
    color: '#FFE456',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  noticeText: {
    color: '#B8DDFF',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  onlineDot: {
    backgroundColor: '#29E05A',
    borderColor: '#0B7D28',
    borderRadius: 999,
    borderWidth: 1,
    height: 11,
    position: 'absolute',
    right: -5,
    top: -5,
    width: 11,
  },
  panelEyebrow: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  patternDot: {
    backgroundColor: '#061F4F',
    borderRadius: 999,
    height: 16,
    opacity: 0.8,
    width: 16,
  },
  patternLayer: {
    bottom: 0,
    left: 0,
    opacity: 0.95,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  patternTile: {
    borderColor: '#123E84',
    borderRadius: 4,
    borderWidth: 3,
    height: 78,
    padding: 12,
    position: 'absolute',
    width: 54,
  },
  playerDot: {
    borderRadius: 999,
    height: 14,
    width: 14,
  },
  playerDiceDot: {
    backgroundColor: '#071028',
    borderRadius: 999,
    height: 5,
    width: 5,
  },
  playerDiceIcon: {
    backgroundColor: '#FFF8DD',
    borderColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 2,
    height: 34,
    justifyContent: 'space-between',
    padding: 5,
    width: 38,
  },
  playerDicePad: {
    borderRadius: 10,
    borderWidth: 3,
    boxShadow: '0 3px 0 rgba(255,255,255,0.32) inset, 0 -7px 0 rgba(0,0,0,0.3) inset, 0 7px 14px rgba(0,0,0,0.34)',
    flexBasis: '43%',
    height: 50,
    overflow: 'visible',
  },
  playerDicePressable: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    height: '100%',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 10,
    width: '100%',
  },
  playerDiceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
    textShadowColor: '#000000',
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 0,
  },
  blueDicePadOffset: {
    flexBasis: '34%',
    marginRight: '9%',
  },
  passModal: {
    backgroundColor: 'rgba(10, 13, 30, 0.96)',
    borderColor: '#E0A915',
    borderRadius: 22,
    borderWidth: 3,
    boxShadow: '0 3px 0 rgba(255,255,255,0.2) inset, 0 -10px 0 rgba(0,0,0,0.3) inset, 0 12px 28px rgba(0,0,0,0.48)',
    gap: 12,
    maxWidth: 430,
    overflow: 'hidden',
    padding: 16,
    width: '100%',
  },
  playerPick: {
    alignItems: 'center',
    backgroundColor: '#123E84',
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 6,
    borderWidth: 1,
    boxShadow: blueGlassShadow,
    height: 34,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 38,
  },
  playerPicker: {
    flexDirection: 'row',
    gap: 6,
  },
  playerPickText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  playerCountRow: {
    flexDirection: 'row',
    gap: 8,
  },
  playOptionArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    textShadowColor: '#10214B',
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 0,
  },
  playOptionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(13, 112, 226, 0.92)',
    borderRadius: 18,
    borderWidth: 3,
    boxShadow: '0 3px 0 rgba(255,255,255,0.38) inset, 0 -8px 0 rgba(0, 35, 119, 0.38) inset, 0 8px 0 rgba(0, 25, 87, 0.75), 0 14px 20px rgba(0,0,0,0.33)',
    flexDirection: 'row',
    gap: 9,
    minHeight: 72,
    overflow: 'hidden',
    paddingHorizontal: 10,
    width: '100%',
  },
  playOptionCopy: {
    flex: 1,
    gap: 1,
  },
  playOptionDetail: {
    color: '#DFF3FF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  playOptionIcon: {
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 2,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  playOptionIconText: {
    fontSize: 22,
    lineHeight: 26,
  },
  playOptionShell: {
    width: '47%',
  },
  playOptions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    width: '94%',
  },
  playOptionTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    textShadowColor: '#10214B',
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 0,
  },
  playBall: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#10214B',
    borderRadius: 999,
    borderWidth: 2,
    bottom: 34,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    width: 28,
    zIndex: 4,
  },
  playBallText: {
    color: '#F0242F',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 18,
  },
  playersText: {
    bottom: -22,
    color: '#49ED44',
    fontSize: 8,
    fontWeight: '800',
    left: 0,
    position: 'absolute',
    right: 0,
    textAlign: 'center',
  },
  playPanel: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#10214B',
    borderRadius: 8,
    borderTopWidth: 8,
    borderWidth: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 14,
  },
  playPanelTitle: {
    color: '#172033',
    fontSize: 20,
    fontWeight: '900',
  },
  plusBox: {
    alignItems: 'center',
    backgroundColor: '#27B54F',
    borderRadius: 4,
    height: 23,
    justifyContent: 'center',
    width: 23,
  },
  plusText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
  },
  previewPawn: {
    borderColor: 'rgba(255,255,255,0.75)',
    borderRadius: 999,
    borderWidth: 2,
    height: 54,
    position: 'absolute',
    width: 32,
  },
  rollButton: {
    alignItems: 'center',
    backgroundColor: '#142B78',
    borderColor: '#8BE7FF',
    borderWidth: 1,
    borderRadius: 7,
    boxShadow: blueGlassShadow,
    flexBasis: '100%',
    justifyContent: 'center',
    minHeight: 46,
    overflow: 'hidden',
  },
  rollButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  roundBadge: {
    alignItems: 'center',
    backgroundColor: '#141414',
    borderColor: '#FFD22D',
    borderRadius: 999,
    borderWidth: 3,
    boxShadow: '0 2px 0 rgba(255,255,255,0.26) inset, 0 -5px 0 rgba(0,0,0,0.45) inset, 0 6px 0 rgba(255, 210, 45, 0.45), 0 10px 18px rgba(0,0,0,0.32)',
    height: 58,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 58,
  },
  roundBadgeText: {
    color: '#FFD22D',
    fontSize: 30,
    fontWeight: '900',
  },
  safeCircle: {
    alignItems: 'center',
    borderColor: '#172033',
    borderRadius: 999,
    borderWidth: 1.5,
    height: '68%',
    justifyContent: 'center',
    position: 'absolute',
    width: '68%',
  },
  safeText: {
    color: '#172033',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 15,
  },
  scoreboard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#10214B',
    borderRadius: 8,
    borderWidth: 2,
    overflow: 'hidden',
  },
  scoreMeta: {
    color: '#475467',
    fontSize: 13,
  },
  scoreName: {
    color: '#172033',
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
  },
  scoreRow: {
    alignItems: 'center',
    borderBottomColor: '#ECF0F5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  seasonText: {
    color: '#FFD22D',
    fontSize: 13,
    fontWeight: '900',
  },
  seasonTicket: {
    alignItems: 'center',
    backgroundColor: 'rgba(18, 109, 209, 0.9)',
    borderColor: '#FFE456',
    borderRadius: 10,
    borderWidth: 2,
    boxShadow: blueGlassShadow,
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  selectedGoldCard: {
    backgroundColor: 'rgba(71, 51, 8, 0.88)',
    boxShadow: '0 2px 0 rgba(255,255,255,0.28) inset, 0 -5px 0 rgba(0,0,0,0.28) inset, 0 0 16px rgba(224, 169, 21, 0.65)',
  },
  shineBeam: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 999,
    height: 760,
    position: 'absolute',
    top: -120,
    width: 70,
  },
  sideRail: {
    gap: 22,
    left: 8,
    position: 'absolute',
    top: 154,
    zIndex: 3,
  },
  sparkleCurtain: {
    bottom: 68,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 58,
  },
  tabPanel: {
    backgroundColor: 'rgba(20, 43, 120, 0.82)',
    borderColor: '#8BE7FF',
    borderRadius: 13,
    borderWidth: 2,
    boxShadow: blueGlassShadow,
    gap: 3,
    overflow: 'hidden',
    padding: 11,
    width: '88%',
  },
  tabPanelText: {
    color: '#DFF3FF',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 16,
    textAlign: 'center',
  },
  tabPanelTitle: {
    color: '#FFE456',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.7,
    textAlign: 'center',
  },
  smallBadge: {
    alignItems: 'center',
    backgroundColor: '#FFD22D',
    borderColor: '#FFFFFF',
    borderRadius: 9,
    borderWidth: 2,
    boxShadow: yellowGlassShadow,
    justifyContent: 'center',
    minHeight: 44,
    overflow: 'hidden',
    paddingHorizontal: 4,
    width: 58,
  },
  smallBadgeSub: {
    color: '#F0242F',
    fontSize: 9,
    fontWeight: '900',
  },
  smallBadgeTitle: {
    color: '#F0242F',
    fontSize: 10,
    fontWeight: '900',
  },
  token: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.98)',
    borderRadius: 999,
    borderWidth: 3,
    boxShadow: '0 5px 0 rgba(255,255,255,0.5) inset, 0 -8px 0 rgba(0,0,0,0.34) inset, 0 8px 14px rgba(0,0,0,0.42)',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tokenShine: {
    backgroundColor: 'rgba(255,255,255,0.48)',
    borderRadius: 999,
    height: '38%',
    left: '16%',
    position: 'absolute',
    top: '10%',
    width: '52%',
  },
  tokenStar: {
    color: '#FFD84A',
    fontSize: 21,
    fontWeight: '900',
    lineHeight: 23,
    textAlign: 'center',
    textShadowColor: '#5A3500',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 2,
    zIndex: 2,
  },
  tokenStarGlassTop: {
    backgroundColor: 'rgba(255,255,255,0.42)',
    borderRadius: 999,
    height: '48%',
    left: '9%',
    position: 'absolute',
    top: '6%',
    width: '82%',
  },
  tokenStarWrap: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1.5,
    boxShadow: '0 3px 0 rgba(255,255,255,0.36) inset, 0 -4px 0 rgba(0,0,0,0.28) inset',
    height: '70%',
    justifyContent: 'center',
    overflow: 'hidden',
    width: '70%',
  },
  tokenText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 13,
    textShadowColor: '#000000',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 0,
  },
  tokenChoice: {
    alignItems: 'center',
    backgroundColor: 'rgba(22, 20, 38, 0.84)',
    borderRadius: 13,
    borderWidth: 2,
    flex: 1,
    gap: 5,
    minHeight: 84,
    overflow: 'hidden',
    padding: 8,
  },
  tokenPreview: {
    alignItems: 'center',
    borderColor: '#E0A915',
    borderRadius: 999,
    borderWidth: 3,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  tokenPreviewText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  tokenSelectRow: {
    flexDirection: 'row',
    gap: 8,
  },
  topLeft: {
    left: '6.67%',
    top: '6.67%',
  },
  topLeftDice: {
    left: '0.5%',
    top: '0.5%',
  },
  topRight: {
    right: '6.67%',
    top: '6.67%',
  },
  topRightDice: {
    right: '0.5%',
    top: '0.5%',
  },
  bottomLeft: {
    bottom: '6.67%',
    left: '6.67%',
  },
  bottomLeftDice: {
    bottom: '0.5%',
    left: '0.5%',
  },
  bottomRight: {
    bottom: '6.67%',
    right: '6.67%',
  },
  bottomRightDice: {
    bottom: '0.5%',
    right: '0.5%',
  },
  topBadge: {
    alignItems: 'center',
    backgroundColor: '#F0242F',
    borderColor: '#FFD22D',
    borderRadius: 999,
    borderWidth: 1,
    height: 15,
    justifyContent: 'center',
    position: 'absolute',
    right: -4,
    top: -4,
    width: 15,
  },
  topBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: '#0B4AA3',
    borderBottomColor: '#F1D35A',
    borderBottomWidth: 2,
    flexDirection: 'row',
    gap: 9,
    minHeight: 58,
    paddingHorizontal: 10,
    paddingTop: 4,
    zIndex: 4,
  },
  topIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(29, 120, 219, 0.6)',
    borderColor: 'rgba(255,255,255,0.32)',
    borderRadius: 8,
    borderWidth: 1,
    boxShadow: blueGlassShadow,
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 34,
    overflow: 'hidden',
  },
  topIconText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  tournamentBadge: {
    alignItems: 'center',
  },
  tournamentCrown: {
    color: '#FFD22D',
    fontSize: 46,
    fontWeight: '900',
    lineHeight: 42,
  },
  tournamentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '86%',
  },
  tournamentText: {
    color: '#FFD22D',
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: '#10214B',
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 0,
  },
};
