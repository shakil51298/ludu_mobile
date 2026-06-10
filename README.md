# Ludo Play (ludo-mobile)

Premium-styled Expo 54 Ludo game — royal blue & gold theme, glassmorphism UI, Pass N Play, Vs Computer, and Team Up.

## Run

```bash
npm install
npx expo start
```

**Note:** After installing `react-native-reanimated`, restart the dev server with cache clear:

```bash
npx expo start -c
```

Press `i` for iOS simulator or `a` for Android emulator, or scan the QR code with Expo Go.

## Tests (game rules)

```bash
npm test
```

## Project layout

| Path | Purpose |
|------|---------|
| `App.tsx` | Home + game screens, UI, animations |
| `src/ludoEngine.js` | Rules, moves, CPU, team wins |
| `src/ludoConfig.js` | Board geometry, track, players |
| `src/teams.js` | Red+Yellow vs Green+Blue teams |
| `src/gameMessages.ts` | Turn hints (“Roll the dice”, etc.) |
| `src/components/` | Board grid, message banner |
| `src/hooks/` | `useSounds`, `useLudoGame` (optional integration) |
| `assets/` | Board image, sounds, Lottie, backgrounds |

## Modes

- **Pass N Play** — 2–4 players, classic rules
- **Vs Computer** — you (red) vs CPU
- **Team Up** — 4 players, Red+Yellow vs Green+Blue; all 8 team tokens must finish; teammates cannot capture each other
- **Continue** — resumes from AsyncStorage save
