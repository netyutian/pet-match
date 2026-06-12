# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev server
npm run dev

# Build for production
npm run build

# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run a single test file
npx vitest run tests/core/MatchEngine.test.ts
```

Tests run with Vitest in a jsdom environment (see `vite.config.ts`). No linter is configured.

## Architecture

This is a browser-based match-3 game (消消乐) with pet collection and room decoration. It is a Vite + TypeScript SPA with no framework.

### Entry and Screen Management

`src/main.ts` bootstraps `GameApp`, which owns all subsystems and registers screens with `ScreenManager` (`src/ui/ScreenManager.ts`). Screens are full-viewport DOM elements switched via CSS `display`. There are four screens: `menu`, `levelSelect`, `game`, and `home`.

### Game Core (`src/core/`)

- **`Board`** — 8x8 grid state. Handles cell creation (avoiding initial matches), swapping, gravity (collapse + refill), and `shuffle()`.
- **`MatchEngine`** — Pure static functions. `findMatches` detects horizontal/vertical runs of 3+. `findHint` searches for any swap that would create a match (used for player hints and deadlock detection). `findSpecials` detects 4/5-length matches for special piece spawning.
- **`GameState`** — Tracks score, moves left, collected elements, cleared obstacles, and win/loss status per level goal.
- **`LevelConfig`** — Hardcoded 20 levels. Types: `score`, `collect` (target element), `clear` (obstacles). Some levels include `wood` obstacles on specific board positions.

### Game Loop and Animation (`src/ui/GameScreen.ts`)

`GameScreen.handleSwap` is async. After a valid swap, it calls `processMatches`, which runs a `while` loop for chain reactions:

1. Find matches + specials
2. Easter egg: 5-match or any special triggers instant win
3. Play elimination animation (`markEliminating` CSS class + 350ms delay)
4. Remove matched cells, record obstacles cleared
5. Add score + floating text for target animal collection
6. **Big clear bonus** — if a single chain reaction clears 8+ target animals, award +50 bonus points
7. Apply gravity, animate falling new cells, repeat

After the chain ends, `handleSwap` checks for deadlocks with `MatchEngine.findHint`. If none exists, it calls `performShuffle()` to regenerate the board (up to 10 attempts) without consuming a move.

### Rendering (`src/ui/BoardRenderer.ts`)

Renders the grid as CSS Grid divs. Supports drag/swipe input (mouse and touch), hint pulsing, target animal glow, elimination/falling animations, and floating text overlays.

### Systems (`src/systems/`)

- **`SaveManager`** — `localStorage` persistence of `SaveData`.
- **`ResourceSystem`** — Coins and pet fragments economy.
- **`PetSystem`** — Pet intimacy, clothes unlocking/equipping.
- **`HomeSystem`** — Room unlocking, furniture placement.

These systems are owned by `GameApp` and their state is merged back into `SaveData` before persisting.

### Important Constants

- `BOARD_SIZE = 8`
- `ELEMENTS`: `['cat', 'dog', 'rabbit', 'bear', 'bird', 'hamster']`
- Colors and emojis mapped in `src/constants.ts`

## Key Patterns

- **No framework** — all UI is vanilla DOM manipulation.
- **Async animation chain** — `processMatches` uses `await delay(ms)` between animation phases. `isAnimating` guards prevent concurrent swap handling.
- **Hint system** — `startHintTimer` sets a 4s timeout; any interaction resets it. Hints are shown via `markHint`.
- **Target highlighting** — `highlightTargets` scans the board for the current level's goal element and adds the `target` CSS class.
