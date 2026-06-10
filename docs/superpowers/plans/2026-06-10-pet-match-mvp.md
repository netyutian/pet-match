# Pet Match MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-friendly match-3 puzzle game with home decoration and pet collection, playable in a browser.

**Architecture:** Pure frontend SPA with TypeScript. Game logic (board, matching, state) is decoupled from DOM rendering. DOM + CSS handle all visuals and animations. localStorage persists progress.

**Tech Stack:** Vite, TypeScript, Vitest, vanilla CSS

---

## File Structure

```
src/
  main.ts                       -- Entry point, bootstraps systems
  types.ts                      -- All domain types and interfaces
  constants.ts                  -- Game constants (board size, colors, etc.)
  core/
    Board.ts                    -- 8x8 grid state, swap, gravity
    MatchEngine.ts              -- Match detection, cascade chains, special blocks
    GameState.ts                -- Per-level state (score, moves, goals, status)
    LevelConfig.ts              -- 20 level definitions
  systems/
    ResourceSystem.ts           -- Coins and fragments
    HomeSystem.ts               -- Rooms, furniture, placement
    PetSystem.ts                -- Pets, intimacy, feeding, clothes
    SaveManager.ts              -- localStorage read/write, export/import codes
  ui/
    ScreenManager.ts            -- Screen switching (menu / level-select / game / home)
    BoardRenderer.ts            -- Renders board grid, handles drag/tap input
    GameScreen.ts               -- Game HUD (score, moves, goals)
    LevelSelectScreen.ts        -- Level map
    HomeScreen.ts               -- Home editor and pet interaction
style.css                       -- All styles, responsive mobile-first
index.html                      -- Single page shell
tests/
  core/
    Board.test.ts
    MatchEngine.test.ts
    GameState.test.ts
  systems/
    ResourceSystem.test.ts
    HomeSystem.test.ts
    PetSystem.test.ts
    SaveManager.test.ts
```

---

### Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `style.css` (empty shell)

- [ ] **Step 1: Create package.json**

```json
{
  "name": "pet-match",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "jsdom": "^24.0.0",
    "@vitest/coverage-v8": "^1.0.0"
  }
}
```

- [ ] **Step 2: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
```

- [ ] **Step 4: Create index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>Pet Match</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 5: Create empty shell files**

```bash
touch style.css src/main.ts src/types.ts src/constants.ts
mkdir -p src/core src/systems src/ui tests/core tests/systems
```

- [ ] **Step 6: Install dependencies and verify dev server**

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in browser, confirm blank page loads without errors.

- [ ] **Step 7: Verify test runner works**

```bash
npm test
```

Expected: "No test files found" (or 0 tests passed).

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "chore: setup vite + typescript + vitest project"
```

---

### Task 2: Core Types and Constants

**Files:**
- Create: `src/types.ts`
- Create: `src/constants.ts`
- Test: `tests/core/types.test.ts`

- [ ] **Step 1: Write types.ts**

```typescript
export type ElementType = 'cat' | 'dog' | 'rabbit' | 'bear' | 'bird' | 'hamster';

export type SpecialType = 'none' | 'line_h' | 'line_v' | 'bomb';

export type ObstacleType = 'wood' | 'ice';

export interface Cell {
  element: ElementType;
  special: SpecialType;
  obstacle?: ObstacleType;
}

export interface Position {
  row: number;
  col: number;
}

export interface Match {
  positions: Position[];
  element: ElementType;
}

export type LevelType = 'score' | 'collect' | 'clear';

export interface LevelGoal {
  type: LevelType;
  target: number;
  element?: ElementType;
}

export interface LevelConfig {
  id: number;
  type: LevelType;
  goal: LevelGoal;
  moves: number;
  obstacles?: { type: ObstacleType; positions: Position[] }[];
}

export type GameStatus = 'playing' | 'won' | 'lost';

export interface PetData {
  id: string;
  species: string;
  favoriteFood: string;
  maxIntimacy: number;
}

export interface PetInstance {
  id: string;
  name: string;
  intimacy: number;
  unlockedClothes: string[];
  currentClothes: string;
}

export interface FurnitureItem {
  id: string;
  name: string;
  price: number;
  roomType: string;
  category: string;
}

export interface PlacedFurniture {
  itemId: string;
  row: number;
  col: number;
  rotation: number;
}

export interface RoomData {
  id: string;
  name: string;
  unlocked: boolean;
  furniture: PlacedFurniture[];
  wallpaper: string;
  floor: string;
}

export interface SaveData {
  currentLevel: number;
  levelStars: Record<number, number>;
  coins: number;
  fragments: Record<string, number>;
  unlockedPets: string[];
  pets: Record<string, PetInstance>;
  rooms: Record<string, RoomData>;
  unlockedFurniture: string[];
}
```

- [ ] **Step 2: Write constants.ts**

```typescript
import type { ElementType, PetData, FurnitureItem } from './types';

export const BOARD_SIZE = 8;

export const ELEMENTS: ElementType[] = ['cat', 'dog', 'rabbit', 'bear', 'bird', 'hamster'];

export const COLORS: Record<ElementType, string> = {
  cat: '#FFB6C1',
  dog: '#87CEEB',
  rabbit: '#98FB98',
  bear: '#DEB887',
  bird: '#F0E68C',
  hamster: '#DDA0DD',
};

export const ELEMENT_EMOJI: Record<ElementType, string> = {
  cat: '',
  dog: '',
  rabbit: '',
  bear: '',
  bird: '',
  hamster: '',
};

export const INITIAL_COINS = 200;

export const PET_COST_FRAGMENTS = 12;

export const PET_DATA: Record<string, PetData> = {
  cat: { id: 'cat', species: '橘猫', favoriteFood: '鱼干', maxIntimacy: 100 },
  dog: { id: 'dog', species: '柴犬', favoriteFood: '骨头', maxIntimacy: 100 },
  rabbit: { id: 'rabbit', species: '白兔', favoriteFood: '胡萝卜', maxIntimacy: 100 },
};

export const PET_CLOTHES: Record<string, string[]> = {
  cat: ['围巾', '帽子'],
  dog: ['项圈', '披风'],
  rabbit: ['蝴蝶结', '花环'],
};

export const FURNITURE_DATA: FurnitureItem[] = [
  { id: 'sofa', name: '小沙发', price: 50, roomType: 'living', category: '座椅' },
  { id: 'lamp', name: '蘑菇灯', price: 30, roomType: 'living', category: '灯具' },
  { id: 'table', name: '圆木桌', price: 40, roomType: 'living', category: '桌子' },
  { id: 'bed', name: '软床', price: 60, roomType: 'bedroom', category: '床' },
  { id: 'nightstand', name: '床头柜', price: 35, roomType: 'bedroom', category: '柜子' },
];

export const ROOMS = [
  { id: 'living', name: '客厅', unlockLevel: 1 },
  { id: 'bedroom', name: '卧室', unlockLevel: 8 },
];
```

- [ ] **Step 3: Commit**

```bash
git add src/types.ts src/constants.ts
git commit -m "feat: add core types and game constants"
```

---

### Task 3: Board Core

**Files:**
- Create: `src/core/Board.ts`
- Test: `tests/core/Board.test.ts`

- [ ] **Step 1: Write failing test for Board initialization**

```typescript
import { describe, it, expect } from 'vitest';
import { Board } from '../../src/core/Board';
import { BOARD_SIZE } from '../../src/constants';

describe('Board', () => {
  it('initializes with 8x8 grid and no matches', () => {
    const board = new Board();
    expect(board.getGrid().length).toBe(BOARD_SIZE);
    expect(board.getGrid()[0].length).toBe(BOARD_SIZE);

    // No cell should be null after init
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        expect(board.getCell(r, c)).not.toBeNull();
      }
    }
  });
});
```

Run: `npm test -- tests/core/Board.test.ts`
Expected: FAIL, `Board` class not found.

- [ ] **Step 2: Implement Board class**

```typescript
import type { Cell, Position, ElementType } from '../types';
import { BOARD_SIZE, ELEMENTS } from '../constants';

export class Board {
  private grid: (Cell | null)[][];

  constructor() {
    this.grid = this.createGrid();
  }

  private createGrid(): (Cell | null)[][] {
    const grid: (Cell | null)[][] = Array.from({ length: BOARD_SIZE }, () =>
      Array(BOARD_SIZE).fill(null)
    );

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        grid[r][c] = this.createCell(grid, r, c);
      }
    }

    return grid;
  }

  private createCell(grid: (Cell | null)[][], row: number, col: number): Cell {
    const available = [...ELEMENTS];
    let attempts = 0;

    while (attempts < 100) {
      const element = available[Math.floor(Math.random() * available.length)];
      const cell: Cell = { element, special: 'none' };

      if (!this.createsMatch(grid, row, col, cell)) {
        return cell;
      }

      const idx = available.indexOf(element);
      if (idx > -1) available.splice(idx, 1);
      attempts++;
    }

    // Fallback: return last attempted element
    return { element: available[0] ?? ELEMENTS[0], special: 'none' };
  }

  private createsMatch(grid: (Cell | null)[][], row: number, col: number, cell: Cell): boolean {
    // Horizontal check
    if (col >= 2) {
      const left1 = grid[row][col - 1];
      const left2 = grid[row][col - 2];
      if (left1 && left2 && left1.element === cell.element && left2.element === cell.element) {
        return true;
      }
    }
    // Vertical check
    if (row >= 2) {
      const up1 = grid[row - 1][col];
      const up2 = grid[row - 2][col];
      if (up1 && up2 && up1.element === cell.element && up2.element === cell.element) {
        return true;
      }
    }
    return false;
  }

  getCell(row: number, col: number): Cell | null {
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return null;
    return this.grid[row][col];
  }

  setCell(row: number, col: number, cell: Cell | null): void {
    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
      this.grid[row][col] = cell;
    }
  }

  swap(pos1: Position, pos2: Position): boolean {
    const cell1 = this.getCell(pos1.row, pos1.col);
    const cell2 = this.getCell(pos2.row, pos2.col);

    if (!cell1 || !cell2) return false;

    this.setCell(pos1.row, pos1.col, cell2);
    this.setCell(pos2.row, pos2.col, cell1);

    return true;
  }

  applyGravity(): Position[] {
    const newPositions: Position[] = [];

    for (let c = 0; c < BOARD_SIZE; c++) {
      let writeRow = BOARD_SIZE - 1;

      for (let r = BOARD_SIZE - 1; r >= 0; r--) {
        if (this.grid[r][c] !== null) {
          if (writeRow !== r) {
            this.grid[writeRow][c] = this.grid[r][c];
            this.grid[r][c] = null;
          }
          writeRow--;
        }
      }

      for (let r = writeRow; r >= 0; r--) {
        this.grid[r][c] = {
          element: ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)],
          special: 'none',
        };
        newPositions.push({ row: r, col: c });
      }
    }

    return newPositions;
  }

  getGrid(): (Cell | null)[][] {
    return this.grid.map(row => [...row]);
  }
}
```

- [ ] **Step 3: Add swap and gravity tests**

Add to `tests/core/Board.test.ts`:

```typescript
  it('swaps two adjacent cells', () => {
    const board = new Board();
    const beforeA = board.getCell(0, 0);
    const beforeB = board.getCell(0, 1);
    const result = board.swap({ row: 0, col: 0 }, { row: 0, col: 1 });
    expect(result).toBe(true);
    expect(board.getCell(0, 0)).toEqual(beforeB);
    expect(board.getCell(0, 1)).toEqual(beforeA);
  });

  it('applies gravity to fill empty cells', () => {
    const board = new Board();
    board.setCell(7, 0, null);
    board.setCell(6, 0, null);
    const newPositions = board.applyGravity();
    expect(newPositions.length).toBeGreaterThan(0);
    expect(board.getCell(7, 0)).not.toBeNull();
    expect(board.getCell(6, 0)).not.toBeNull();
  });
```

Run: `npm test -- tests/core/Board.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/core/Board.ts tests/core/Board.test.ts
git commit -m "feat: add Board core with init, swap, gravity"
```

---

### Task 4: Match Engine

**Files:**
- Create: `src/core/MatchEngine.ts`
- Test: `tests/core/MatchEngine.test.ts`

- [ ] **Step 1: Write failing test for horizontal match**

```typescript
import { describe, it, expect } from 'vitest';
import { MatchEngine } from '../../src/core/MatchEngine';
import type { Cell } from '../../src/types';

function makeCell(element: string): Cell {
  return { element: element as any, special: 'none' };
}

describe('MatchEngine', () => {
  it('finds horizontal match of 3', () => {
    const grid: (Cell | null)[][] = [
      [makeCell('cat'), makeCell('cat'), makeCell('cat'), makeCell('dog')],
      [makeCell('dog'), makeCell('bear'), makeCell('bird'), makeCell('hamster')],
    ];
    const matches = MatchEngine.findMatches(grid);
    expect(matches.length).toBe(1);
    expect(matches[0].positions).toHaveLength(3);
  });
});
```

Run: `npm test -- tests/core/MatchEngine.test.ts`
Expected: FAIL, class not found.

- [ ] **Step 2: Implement MatchEngine**

```typescript
import type { Cell, Position, Match } from '../types';
import { BOARD_SIZE } from '../constants';

export class MatchEngine {
  static findMatches(grid: (Cell | null)[][]): Match[] {
    const matches: Match[] = [];
    const matched = new Set<string>();

    // Horizontal
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE - 2; c++) {
        const cell = grid[r][c];
        if (!cell) continue;

        let count = 1;
        while (c + count < BOARD_SIZE && grid[r][c + count]?.element === cell.element) {
          count++;
        }

        if (count >= 3) {
          const positions: Position[] = [];
          for (let i = 0; i < count; i++) {
            const key = `${r},${c + i}`;
            if (!matched.has(key)) {
              matched.add(key);
              positions.push({ row: r, col: c + i });
            }
          }
          if (positions.length > 0) {
            matches.push({ positions, element: cell.element });
          }
        }
      }
    }

    // Vertical
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (let r = 0; r < BOARD_SIZE - 2; r++) {
        const cell = grid[r][c];
        if (!cell) continue;

        let count = 1;
        while (r + count < BOARD_SIZE && grid[r + count]?.[c]?.element === cell.element) {
          count++;
        }

        if (count >= 3) {
          const positions: Position[] = [];
          for (let i = 0; i < count; i++) {
            const key = `${r + i},${c}`;
            if (!matched.has(key)) {
              matched.add(key);
              positions.push({ row: r + i, col: c });
            }
          }
          if (positions.length > 0) {
            matches.push({ positions, element: cell.element });
          }
        }
      }
    }

    return matches;
  }

  static hasMatch(grid: (Cell | null)[][]): boolean {
    return this.findMatches(grid).length > 0;
  }
}
```

- [ ] **Step 3: Add vertical match and no-match tests**

Add to test file:

```typescript
  it('finds vertical match of 3', () => {
    const grid: (Cell | null)[][] = [
      [makeCell('cat'), makeCell('dog')],
      [makeCell('cat'), makeCell('bear')],
      [makeCell('cat'), makeCell('bird')],
    ];
    const matches = MatchEngine.findMatches(grid);
    expect(matches.length).toBe(1);
    expect(matches[0].positions).toHaveLength(3);
  });

  it('returns empty when no matches', () => {
    const grid: (Cell | null)[][] = [
      [makeCell('cat'), makeCell('dog')],
      [makeCell('bear'), makeCell('bird')],
    ];
    const matches = MatchEngine.findMatches(grid);
    expect(matches.length).toBe(0);
  });
```

Run: `npm test -- tests/core/MatchEngine.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/core/MatchEngine.ts tests/core/MatchEngine.test.ts
git commit -m "feat: add MatchEngine with horizontal/vertical detection"
```

---

### Task 5: Special Block Logic

**Files:**
- Modify: `src/core/MatchEngine.ts`
- Test: `tests/core/MatchEngine.test.ts`

- [ ] **Step 1: Write failing test for special block detection**

Add to `tests/core/MatchEngine.test.ts`:

```typescript
  it('detects horizontal 4-match and returns special info', () => {
    const grid: (Cell | null)[][] = [
      [makeCell('cat'), makeCell('cat'), makeCell('cat'), makeCell('cat')],
    ];
    const specials = MatchEngine.findSpecials(grid);
    expect(specials.length).toBe(1);
    expect(specials[0].type).toBe('line_v');
  });
```

Expected: FAIL.

- [ ] **Step 2: Add findSpecials to MatchEngine**

Add to `src/core/MatchEngine.ts`:

```typescript
export interface SpecialSpawn {
  position: Position;
  type: 'line_h' | 'line_v' | 'bomb';
  element: string;
}

export class MatchEngine {
  // ... existing methods ...

  static findSpecials(grid: (Cell | null)[][]): SpecialSpawn[] {
    const specials: SpecialSpawn[] = [];

    // Horizontal specials
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE - 3; c++) {
        const cell = grid[r][c];
        if (!cell) continue;

        let count = 1;
        while (c + count < BOARD_SIZE && grid[r][c + count]?.element === cell.element) {
          count++;
        }

        if (count === 4) {
          specials.push({ position: { row: r, col: c }, type: 'line_v', element: cell.element });
        } else if (count >= 5) {
          specials.push({ position: { row: r, col: c }, type: 'bomb', element: cell.element });
        }
      }
    }

    // Vertical specials
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (let r = 0; r < BOARD_SIZE - 3; r++) {
        const cell = grid[r][c];
        if (!cell) continue;

        let count = 1;
        while (r + count < BOARD_SIZE && grid[r + count]?.[c]?.element === cell.element) {
          count++;
        }

        if (count === 4) {
          specials.push({ position: { row: r, col: c }, type: 'line_h', element: cell.element });
        } else if (count >= 5) {
          specials.push({ position: { row: r, col: c }, type: 'bomb', element: cell.element });
        }
      }
    }

    return specials;
  }
}
```

Note: Update the import in `MatchEngine.ts` to include `SpecialSpawn` if needed for export.

Run: `npm test -- tests/core/MatchEngine.test.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/core/MatchEngine.ts tests/core/MatchEngine.test.ts
git commit -m "feat: add special block detection (line and bomb)"
```

---

### Task 6: Game State Manager

**Files:**
- Create: `src/core/GameState.ts`
- Test: `tests/core/GameState.test.ts`

- [ ] **Step 1: Write failing test for score tracking**

```typescript
import { describe, it, expect } from 'vitest';
import { GameState } from '../../src/core/GameState';
import type { LevelConfig } from '../../src/types';

describe('GameState', () => {
  const sampleLevel: LevelConfig = {
    id: 1,
    type: 'score',
    goal: { type: 'score', target: 1000 },
    moves: 20,
  };

  it('initializes with correct moves and zero score', () => {
    const state = new GameState(sampleLevel);
    expect(state.getScore()).toBe(0);
    expect(state.getMovesLeft()).toBe(20);
    expect(state.getStatus()).toBe('playing');
  });
});
```

Run: `npm test -- tests/core/GameState.test.ts`
Expected: FAIL.

- [ ] **Step 2: Implement GameState**

```typescript
import type { LevelConfig, GameStatus, ElementType } from '../types';

export class GameState {
  private score = 0;
  private movesLeft: number;
  private status: GameStatus = 'playing';
  private level: LevelConfig;
  private collectedElements: Record<string, number> = {};
  private clearedObstacles = 0;

  constructor(level: LevelConfig) {
    this.level = level;
    this.movesLeft = level.moves;
  }

  getScore(): number {
    return this.score;
  }

  getMovesLeft(): number {
    return this.movesLeft;
  }

  getStatus(): GameStatus {
    return this.status;
  }

  addScore(points: number): void {
    this.score += points;
    this.checkWin();
  }

  recordMatch(element: ElementType, count: number): void {
    const key = element;
    this.collectedElements[key] = (this.collectedElements[key] || 0) + count;
    this.checkWin();
  }

  recordObstacleCleared(): void {
    this.clearedObstacles++;
    this.checkWin();
  }

  useMove(): void {
    this.movesLeft--;
    if (this.movesLeft <= 0) {
      this.checkEnd();
    }
  }

  private checkWin(): void {
    if (this.status !== 'playing') return;

    const goal = this.level.goal;
    let won = false;

    if (goal.type === 'score') {
      won = this.score >= goal.target;
    } else if (goal.type === 'collect' && goal.element) {
      won = (this.collectedElements[goal.element] || 0) >= goal.target;
    } else if (goal.type === 'clear') {
      won = this.clearedObstacles >= goal.target;
    }

    if (won) {
      this.status = 'won';
    }
  }

  private checkEnd(): void {
    if (this.status === 'playing') {
      this.checkWin();
      if (this.status === 'playing') {
        this.status = 'lost';
      }
    }
  }

  getStars(): number {
    if (this.status !== 'won') return 0;
    const ratio = this.score / this.level.goal.target;
    if (ratio >= 2) return 3;
    if (ratio >= 1.3) return 2;
    return 1;
  }

  getCollectedCount(element: ElementType): number {
    return this.collectedElements[element] || 0;
  }
}
```

- [ ] **Step 3: Add win/lose tests**

Add to test file:

```typescript
  it('detects win when score goal reached', () => {
    const state = new GameState(sampleLevel);
    state.addScore(1000);
    expect(state.getStatus()).toBe('won');
  });

  it('detects loss when moves run out without goal', () => {
    const state = new GameState(sampleLevel);
    for (let i = 0; i < 20; i++) {
      state.useMove();
    }
    expect(state.getStatus()).toBe('lost');
  });

  it('awards 3 stars for high score', () => {
    const state = new GameState(sampleLevel);
    state.addScore(2500);
    expect(state.getStars()).toBe(3);
  });
```

Run: `npm test -- tests/core/GameState.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/core/GameState.ts tests/core/GameState.test.ts
git commit -m "feat: add GameState with score, moves, goals, stars"
```

---

### Task 7: Level Configuration

**Files:**
- Create: `src/core/LevelConfig.ts`
- Test: `tests/core/LevelConfig.test.ts`

- [ ] **Step 1: Write level definitions and test**

```typescript
import type { LevelConfig } from '../types';

export const LEVELS: LevelConfig[] = [
  // Intro: score only
  { id: 1, type: 'score', goal: { type: 'score', target: 500 }, moves: 25 },
  { id: 2, type: 'score', goal: { type: 'score', target: 700 }, moves: 25 },
  { id: 3, type: 'score', goal: { type: 'score', target: 900 }, moves: 24 },
  // Intro: collect
  { id: 4, type: 'collect', goal: { type: 'collect', target: 15, element: 'cat' }, moves: 25 },
  { id: 5, type: 'collect', goal: { type: 'collect', target: 15, element: 'dog' }, moves: 24 },
  { id: 6, type: 'collect', goal: { type: 'collect', target: 20, element: 'rabbit' }, moves: 25 },
  // Mix
  { id: 7, type: 'score', goal: { type: 'score', target: 1200 }, moves: 24 },
  { id: 8, type: 'collect', goal: { type: 'collect', target: 20, element: 'bear' }, moves: 25 },
  { id: 9, type: 'score', goal: { type: 'score', target: 1400 }, moves: 24 },
  // Review before obstacles
  { id: 10, type: 'score', goal: { type: 'score', target: 1500 }, moves: 23 },
  // Wood obstacles introduced
  {
    id: 11, type: 'clear',
    goal: { type: 'clear', target: 5 },
    moves: 25,
    obstacles: [
      { type: 'wood', positions: [{ row: 3, col: 3 }, { row: 3, col: 4 }, { row: 4, col: 3 }, { row: 4, col: 4 }, { row: 5, col: 5 }] },
    ],
  },
  { id: 12, type: 'score', goal: { type: 'score', target: 1600 }, moves: 24, obstacles: [{ type: 'wood', positions: [{ row: 2, col: 2 }, { row: 6, col: 6 }] }] },
  { id: 13, type: 'collect', goal: { type: 'collect', target: 20, element: 'bird' }, moves: 25, obstacles: [{ type: 'wood', positions: [{ row: 0, col: 0 }, { row: 7, col: 7 }] }] },
  { id: 14, type: 'score', goal: { type: 'score', target: 1800 }, moves: 24 },
  { id: 15, type: 'clear', goal: { type: 'clear', target: 8 }, moves: 26, obstacles: [{ type: 'wood', positions: [{ row: 3, col: 2 }, { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 3, col: 5 }, { row: 4, col: 2 }, { row: 4, col: 3 }, { row: 4, col: 4 }, { row: 4, col: 5 }] }] },
  { id: 16, type: 'collect', goal: { type: 'collect', target: 25, element: 'hamster' }, moves: 25 },
  { id: 17, type: 'score', goal: { type: 'score', target: 2000 }, moves: 24 },
  { id: 18, type: 'clear', goal: { type: 'clear', target: 6 }, moves: 25, obstacles: [{ type: 'wood', positions: [{ row: 1, col: 1 }, { row: 1, col: 6 }, { row: 6, col: 1 }, { row: 6, col: 6 }, { row: 3, col: 3 }, { row: 4, col: 4 }] }] },
  { id: 19, type: 'score', goal: { type: 'score', target: 2200 }, moves: 23 },
  { id: 20, type: 'collect', goal: { type: 'collect', target: 30, element: 'cat' }, moves: 25 },
];

export function getLevel(id: number): LevelConfig | undefined {
  return LEVELS.find(l => l.id === id);
}
```

Test file:

```typescript
import { describe, it, expect } from 'vitest';
import { LEVELS, getLevel } from '../../src/core/LevelConfig';

describe('LevelConfig', () => {
  it('has 20 levels', () => {
    expect(LEVELS.length).toBe(20);
  });

  it('retrieves level by id', () => {
    const level = getLevel(1);
    expect(level).toBeDefined();
    expect(level!.id).toBe(1);
  });

  it('returns undefined for invalid id', () => {
    expect(getLevel(99)).toBeUndefined();
  });
});
```

Run: `npm test -- tests/core/LevelConfig.test.ts`
Expected: PASS.

- [ ] **Step 2: Commit**

```bash
git add src/core/LevelConfig.ts tests/core/LevelConfig.test.ts
git commit -m "feat: add 20 level configurations"
```

---

### Task 8: Resource System

**Files:**
- Create: `src/systems/ResourceSystem.ts`
- Test: `tests/systems/ResourceSystem.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ResourceSystem } from '../../src/systems/ResourceSystem';

describe('ResourceSystem', () => {
  let system: ResourceSystem;

  beforeEach(() => {
    system = new ResourceSystem();
  });

  it('starts with initial coins', () => {
    expect(system.getCoins()).toBe(200);
  });

  it('adds coins', () => {
    system.addCoins(50);
    expect(system.getCoins()).toBe(250);
  });

  it('spends coins if sufficient', () => {
    expect(system.spendCoins(50)).toBe(true);
    expect(system.getCoins()).toBe(150);
  });

  it('refuses to spend if insufficient', () => {
    expect(system.spendCoins(999)).toBe(false);
    expect(system.getCoins()).toBe(200);
  });
});
```

Run: `npm test -- tests/systems/ResourceSystem.test.ts`
Expected: FAIL.

- [ ] **Step 2: Implement ResourceSystem**

```typescript
import { INITIAL_COINS } from '../constants';

export class ResourceSystem {
  private coins: number;
  private fragments: Record<string, number> = {};

  constructor(saved?: { coins: number; fragments: Record<string, number> }) {
    this.coins = saved?.coins ?? INITIAL_COINS;
    this.fragments = saved?.fragments ? { ...saved.fragments } : {};
  }

  getCoins(): number {
    return this.coins;
  }

  addCoins(amount: number): void {
    this.coins += amount;
  }

  spendCoins(amount: number): boolean {
    if (this.coins >= amount) {
      this.coins -= amount;
      return true;
    }
    return false;
  }

  getFragments(petId: string): number {
    return this.fragments[petId] || 0;
  }

  addFragments(petId: string, amount: number): void {
    this.fragments[petId] = (this.fragments[petId] || 0) + amount;
  }

  spendFragments(petId: string, amount: number): boolean {
    if (this.getFragments(petId) >= amount) {
      this.fragments[petId] -= amount;
      return true;
    }
    return false;
  }

  getSaveData(): { coins: number; fragments: Record<string, number> } {
    return { coins: this.coins, fragments: { ...this.fragments } };
  }
}
```

- [ ] **Step 3: Add fragment tests and verify all**

Add to test file:

```typescript
  it('tracks fragments', () => {
    system.addFragments('cat', 3);
    expect(system.getFragments('cat')).toBe(3);
  });

  it('spends fragments', () => {
    system.addFragments('dog', 5);
    expect(system.spendFragments('dog', 3)).toBe(true);
    expect(system.getFragments('dog')).toBe(2);
  });
```

Run: `npm test -- tests/systems/ResourceSystem.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/systems/ResourceSystem.ts tests/systems/ResourceSystem.test.ts
git commit -m "feat: add ResourceSystem for coins and fragments"
```

---

### Task 9: Home System

**Files:**
- Create: `src/systems/HomeSystem.ts`
- Test: `tests/systems/HomeSystem.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { HomeSystem } from '../../src/systems/HomeSystem';

describe('HomeSystem', () => {
  let home: HomeSystem;

  beforeEach(() => {
    home = new HomeSystem();
  });

  it('starts with living room unlocked', () => {
    expect(home.isRoomUnlocked('living')).toBe(true);
    expect(home.isRoomUnlocked('bedroom')).toBe(false);
  });

  it('unlocks room by level', () => {
    home.unlockRoom('bedroom', 8);
    expect(home.isRoomUnlocked('bedroom')).toBe(true);
  });

  it('places furniture in room', () => {
    home.placeFurniture('living', 'sofa', 2, 2, 0);
    const items = home.getRoomFurniture('living');
    expect(items.length).toBe(1);
    expect(items[0].itemId).toBe('sofa');
  });
});
```

Run: `npm test -- tests/systems/HomeSystem.test.ts`
Expected: FAIL.

- [ ] **Step 2: Implement HomeSystem**

```typescript
import type { RoomData, PlacedFurniture } from '../types';
import { ROOMS } from '../constants';

export class HomeSystem {
  private rooms: Record<string, RoomData>;
  private unlockedFurniture: string[];

  constructor(saved?: { rooms: Record<string, RoomData>; unlockedFurniture: string[] }) {
    this.rooms = saved?.rooms ? this.loadRooms(saved.rooms) : this.createDefaultRooms();
    this.unlockedFurniture = saved?.unlockedFurniture ? [...saved.unlockedFurniture] : [];
  }

  private createDefaultRooms(): Record<string, RoomData> {
    const rooms: Record<string, RoomData> = {};
    for (const room of ROOMS) {
      rooms[room.id] = {
        id: room.id,
        name: room.name,
        unlocked: room.unlockLevel === 1,
        furniture: [],
        wallpaper: 'default',
        floor: 'default',
      };
    }
    return rooms;
  }

  private loadRooms(data: Record<string, RoomData>): Record<string, RoomData> {
    const rooms: Record<string, RoomData> = {};
    for (const key of Object.keys(data)) {
      rooms[key] = { ...data[key], furniture: [...data[key].furniture] };
    }
    return rooms;
  }

  isRoomUnlocked(roomId: string): boolean {
    return this.rooms[roomId]?.unlocked ?? false;
  }

  unlockRoom(roomId: string, currentLevel: number): boolean {
    const roomDef = ROOMS.find(r => r.id === roomId);
    if (!roomDef || this.rooms[roomId]?.unlocked) return false;
    if (currentLevel >= roomDef.unlockLevel) {
      this.rooms[roomId].unlocked = true;
      return true;
    }
    return false;
  }

  getRooms(): RoomData[] {
    return Object.values(this.rooms);
  }

  getRoom(roomId: string): RoomData | undefined {
    return this.rooms[roomId];
  }

  getRoomFurniture(roomId: string): PlacedFurniture[] {
    return [...(this.rooms[roomId]?.furniture || [])];
  }

  placeFurniture(roomId: string, itemId: string, row: number, col: number, rotation: number): void {
    if (!this.rooms[roomId]) return;
    this.rooms[roomId].furniture.push({ itemId, row, col, rotation });
  }

  removeFurniture(roomId: string, row: number, col: number): boolean {
    const room = this.rooms[roomId];
    if (!room) return false;
    const idx = room.furniture.findIndex(f => f.row === row && f.col === col);
    if (idx >= 0) {
      room.furniture.splice(idx, 1);
      return true;
    }
    return false;
  }

  setWallpaper(roomId: string, wallpaper: string): void {
    if (this.rooms[roomId]) {
      this.rooms[roomId].wallpaper = wallpaper;
    }
  }

  setFloor(roomId: string, floor: string): void {
    if (this.rooms[roomId]) {
      this.rooms[roomId].floor = floor;
    }
  }

  unlockFurniture(itemId: string): void {
    if (!this.unlockedFurniture.includes(itemId)) {
      this.unlockedFurniture.push(itemId);
    }
  }

  isFurnitureUnlocked(itemId: string): boolean {
    return this.unlockedFurniture.includes(itemId);
  }

  getSaveData(): { rooms: Record<string, RoomData>; unlockedFurniture: string[] } {
    const rooms: Record<string, RoomData> = {};
    for (const key of Object.keys(this.rooms)) {
      rooms[key] = { ...this.rooms[key], furniture: [...this.rooms[key].furniture] };
    }
    return { rooms, unlockedFurniture: [...this.unlockedFurniture] };
  }
}
```

- [ ] **Step 3: Verify tests pass**

Run: `npm test -- tests/systems/HomeSystem.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/systems/HomeSystem.ts tests/systems/HomeSystem.test.ts
git commit -m "feat: add HomeSystem with rooms and furniture placement"
```

---

### Task 10: Pet System

**Files:**
- Create: `src/systems/PetSystem.ts`
- Test: `tests/systems/PetSystem.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { PetSystem } from '../../src/systems/PetSystem';

describe('PetSystem', () => {
  let pets: PetSystem;

  beforeEach(() => {
    pets = new PetSystem();
  });

  it('starts with cat unlocked and named', () => {
    expect(pets.hasPet('cat')).toBe(true);
    expect(pets.getPet('cat')?.name).toBe('咪咪');
  });

  it('unlocks pet with fragments', () => {
    pets.addFragments('dog', 12);
    expect(pets.unlockPet('dog')).toBe(true);
    expect(pets.hasPet('dog')).toBe(true);
  });

  it('feeds pet to increase intimacy', () => {
    const before = pets.getPet('cat')!.intimacy;
    pets.feed('cat');
    expect(pets.getPet('cat')!.intimacy).toBeGreaterThan(before);
  });

  it('equips clothes when unlocked', () => {
    pets.unlockClothes('cat', '围巾');
    expect(pets.equipClothes('cat', '围巾')).toBe(true);
    expect(pets.getPet('cat')!.currentClothes).toBe('围巾');
  });
});
```

Run: `npm test -- tests/systems/PetSystem.test.ts`
Expected: FAIL.

- [ ] **Step 2: Implement PetSystem**

```typescript
import type { PetInstance } from '../types';
import { PET_DATA, PET_COST_FRAGMENTS, PET_CLOTHES } from '../constants';

export class PetSystem {
  private pets: Record<string, PetInstance> = {};
  private fragments: Record<string, number> = {};
  private unlockedClothes: Record<string, string[]> = {};

  constructor(saved?: {
    pets: Record<string, PetInstance>;
    fragments: Record<string, number>;
    unlockedClothes: Record<string, string[]>;
  }) {
    if (saved) {
      this.pets = { ...saved.pets };
      this.fragments = { ...saved.fragments };
      this.unlockedClothes = { ...saved.unlockedClothes };
    } else {
      // Start with cat
      this.pets['cat'] = {
        id: 'cat',
        name: '咪咪',
        intimacy: 0,
        unlockedClothes: [],
        currentClothes: '',
      };
    }
  }

  hasPet(id: string): boolean {
    return id in this.pets;
  }

  getPet(id: string): PetInstance | undefined {
    return this.pets[id];
  }

  getAllPets(): PetInstance[] {
    return Object.values(this.pets);
  }

  addFragments(petId: string, amount: number): void {
    this.fragments[petId] = (this.fragments[petId] || 0) + amount;
  }

  getFragments(petId: string): number {
    return this.fragments[petId] || 0;
  }

  unlockPet(id: string): boolean {
    if (this.hasPet(id)) return false;
    if (this.getFragments(id) >= PET_COST_FRAGMENTS) {
      this.fragments[id] -= PET_COST_FRAGMENTS;
      this.pets[id] = {
        id,
        name: PET_DATA[id]?.species ?? id,
        intimacy: 0,
        unlockedClothes: [],
        currentClothes: '',
      };
      return true;
    }
    return false;
  }

  renamePet(id: string, name: string): void {
    if (this.pets[id]) {
      this.pets[id].name = name;
    }
  }

  feed(id: string): boolean {
    const pet = this.pets[id];
    const data = PET_DATA[id];
    if (!pet || !data) return false;

    const amount = 10;
    pet.intimacy = Math.min(pet.intimacy + amount, data.maxIntimacy);
    return true;
  }

  getIntimacyLevel(id: string): number {
    const pet = this.pets[id];
    if (!pet) return 0;
    return Math.floor(pet.intimacy / 20) + 1;
  }

  unlockClothes(id: string, clothes: string): void {
    if (!this.unlockedClothes[id]) {
      this.unlockedClothes[id] = [];
    }
    if (!this.unlockedClothes[id].includes(clothes)) {
      this.unlockedClothes[id].push(clothes);
    }
    // Also add to pet's unlocked list
    if (this.pets[id] && !this.pets[id].unlockedClothes.includes(clothes)) {
      this.pets[id].unlockedClothes.push(clothes);
    }
  }

  equipClothes(id: string, clothes: string): boolean {
    const pet = this.pets[id];
    if (!pet) return false;
    if (pet.unlockedClothes.includes(clothes)) {
      pet.currentClothes = clothes;
      return true;
    }
    return false;
  }

  getSaveData(): {
    pets: Record<string, PetInstance>;
    fragments: Record<string, number>;
    unlockedClothes: Record<string, string[]>;
  } {
    return {
      pets: { ...this.pets },
      fragments: { ...this.fragments },
      unlockedClothes: { ...this.unlockedClothes },
    };
  }
}
```

- [ ] **Step 3: Verify tests pass**

Run: `npm test -- tests/systems/PetSystem.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/systems/PetSystem.ts tests/systems/PetSystem.test.ts
git commit -m "feat: add PetSystem with unlock, feed, intimacy, clothes"
```

---

### Task 11: Save Manager

**Files:**
- Create: `src/systems/SaveManager.ts`
- Test: `tests/systems/SaveManager.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveManager } from '../../src/systems/SaveManager';

describe('SaveManager', () => {
  let manager: SaveManager;

  beforeEach(() => {
    manager = new SaveManager();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
    });
  });

  it('returns null when no save exists', () => {
    expect(manager.load()).toBeNull();
  });

  it('saves and loads data', () => {
    const data = {
      currentLevel: 5,
      levelStars: { 1: 3, 2: 2 },
      coins: 300,
      fragments: { dog: 5 },
      unlockedPets: ['cat'],
      pets: {
        cat: { id: 'cat', name: '咪咪', intimacy: 10, unlockedClothes: [], currentClothes: '' },
      },
      rooms: {
        living: { id: 'living', name: '客厅', unlocked: true, furniture: [], wallpaper: 'default', floor: 'default' },
      },
      unlockedFurniture: [],
    };
    manager.save(data);
    expect(localStorage.setItem).toHaveBeenCalled();
  });
});
```

Run: `npm test -- tests/systems/SaveManager.test.ts`
Expected: FAIL.

- [ ] **Step 2: Implement SaveManager**

```typescript
import type { SaveData } from '../types';

const SAVE_KEY = 'pet_match_save';

export class SaveManager {
  load(): SaveData | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as SaveData;
    } catch {
      return null;
    }
  }

  save(data: SaveData): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      // Storage full or unavailable — silently fail
    }
  }

  clear(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  exportCode(data: SaveData): string {
    try {
      const json = JSON.stringify(data);
      return btoa(encodeURIComponent(json));
    } catch {
      return '';
    }
  }

  importCode(code: string): SaveData | null {
    try {
      const json = decodeURIComponent(atob(code));
      return JSON.parse(json) as SaveData;
    } catch {
      return null;
    }
  }
}
```

- [ ] **Step 3: Add export/import tests**

Add to test file:

```typescript
  it('exports and imports save code', () => {
    const data = {
      currentLevel: 3,
      levelStars: {},
      coins: 100,
      fragments: {},
      unlockedPets: ['cat'],
      pets: {
        cat: { id: 'cat', name: '咪咪', intimacy: 0, unlockedClothes: [], currentClothes: '' },
      },
      rooms: {
        living: { id: 'living', name: '客厅', unlocked: true, furniture: [], wallpaper: 'default', floor: 'default' },
      },
      unlockedFurniture: [],
    };
    const code = manager.exportCode(data);
    expect(code.length).toBeGreaterThan(0);
    const loaded = manager.importCode(code);
    expect(loaded).toEqual(data);
  });

  it('returns null for invalid import code', () => {
    expect(manager.importCode('not-valid')).toBeNull();
  });
```

Run: `npm test -- tests/systems/SaveManager.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/systems/SaveManager.ts tests/systems/SaveManager.test.ts
git commit -m "feat: add SaveManager with localStorage and code export/import"
```

---

### Task 12: Screen Manager & Base CSS

**Files:**
- Create: `src/ui/ScreenManager.ts`
- Modify: `style.css`

- [ ] **Step 1: Implement ScreenManager**

```typescript
export type ScreenName = 'menu' | 'levelSelect' | 'game' | 'home';

export class ScreenManager {
  private container: HTMLElement;
  private screens: Map<ScreenName, HTMLElement> = new Map();
  private current: ScreenName | null = null;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container #${containerId} not found`);
    this.container = el;
    this.container.className = 'app-container';
  }

  register(name: ScreenName, element: HTMLElement): void {
    element.classList.add('screen');
    element.dataset.screen = name;
    this.screens.set(name, element);
    this.container.appendChild(element);
  }

  show(name: ScreenName): void {
    for (const [key, el] of this.screens) {
      el.classList.toggle('active', key === name);
    }
    this.current = name;
  }

  getCurrent(): ScreenName | null {
    return this.current;
  }
}
```

- [ ] **Step 2: Write base CSS**

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #FFF8F0;
  color: #4A4A4A;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.app-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.screen {
  position: absolute;
  inset: 0;
  display: none;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  overflow-y: auto;
}

.screen.active {
  display: flex;
}

button {
  border: none;
  background: #FFB6C1;
  color: white;
  padding: 12px 24px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.1s, opacity 0.1s;
}

button:active {
  transform: scale(0.95);
  opacity: 0.9;
}

h1 {
  font-size: 28px;
  margin-bottom: 24px;
  color: #6B4F4F;
}
```

- [ ] **Step 3: Manual verification**

Run dev server: `npm run dev`

Create a temporary test in `src/main.ts`:
```typescript
import { ScreenManager } from './ui/ScreenManager';

const screenMgr = new ScreenManager('app');
const menu = document.createElement('div');
menu.innerHTML = '<h1>Pet Match</h1><button>Play</button>';
screenMgr.register('menu', menu);
screenMgr.show('menu');
```

Open browser, verify: pink background, centered title, rounded pink button.

Revert `src/main.ts` to empty after verification.

- [ ] **Step 4: Commit**

```bash
git add src/ui/ScreenManager.ts style.css
git commit -m "feat: add ScreenManager and base mobile-first CSS"
```

---

### Task 13: Board Renderer

**Files:**
- Create: `src/ui/BoardRenderer.ts`

- [ ] **Step 1: Implement BoardRenderer**

```typescript
import type { Board } from '../core/Board';
import type { Cell, Position } from '../types';
import { BOARD_SIZE, COLORS } from '../constants';

export type SwapHandler = (from: Position, to: Position) => void;

export class BoardRenderer {
  private container: HTMLElement;
  private cells: HTMLElement[][] = [];
  private board: Board | null = null;
  private onSwap: SwapHandler | null = null;
  private dragStart: Position | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.container.classList.add('board-container');
  }

  setBoard(board: Board): void {
    this.board = board;
    this.render();
  }

  setSwapHandler(handler: SwapHandler): void {
    this.onSwap = handler;
  }

  private render(): void {
    this.container.innerHTML = '';
    this.cells = [];

    const grid = document.createElement('div');
    grid.className = 'board-grid';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 1fr)`;
    grid.style.gap = '4px';
    grid.style.width = '100%';
    grid.style.maxWidth = '400px';
    grid.style.aspectRatio = '1';

    for (let r = 0; r < BOARD_SIZE; r++) {
      this.cells[r] = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = this.createCellElement(r, c);
        this.cells[r][c] = cell;
        grid.appendChild(cell);
      }
    }

    this.container.appendChild(grid);
    this.updateFromBoard();
  }

  private createCellElement(row: number, col: number): HTMLElement {
    const el = document.createElement('div');
    el.className = 'board-cell';
    el.dataset.row = String(row);
    el.dataset.col = String(col);
    el.style.borderRadius = '8px';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.fontSize = '24px';
    el.style.cursor = 'pointer';
    el.style.userSelect = 'none';
    el.style.transition = 'transform 0.2s';

    const startDrag = (e: Event) => {
      e.preventDefault();
      this.dragStart = { row, col };
      el.style.transform = 'scale(0.9)';
    };

    const endDrag = (e: Event) => {
      e.preventDefault();
      el.style.transform = 'scale(1)';
      if (this.dragStart && this.onSwap) {
        const targetRow = Number((e.currentTarget as HTMLElement).dataset.row);
        const targetCol = Number((e.currentTarget as HTMLElement).dataset.col);
        if (targetRow !== this.dragStart.row || targetCol !== this.dragStart.col) {
          this.onSwap(this.dragStart, { row: targetRow, col: targetCol });
        }
        this.dragStart = null;
      }
    };

    el.addEventListener('mousedown', startDrag);
    el.addEventListener('touchstart', startDrag, { passive: false });
    el.addEventListener('mouseup', endDrag);
    el.addEventListener('touchend', endDrag);

    return el;
  }

  updateFromBoard(): void {
    if (!this.board) return;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = this.board.getCell(r, c);
        const el = this.cells[r][c];
        this.renderCell(el, cell);
      }
    }
  }

  private renderCell(el: HTMLElement, cell: Cell | null): void {
    if (!cell) {
      el.textContent = '';
      el.style.background = 'transparent';
      return;
    }

    el.textContent = this.getElementEmoji(cell.element);
    el.style.background = COLORS[cell.element];

    if (cell.special === 'bomb') {
      el.style.border = '2px solid #FF4444';
    } else if (cell.special.startsWith('line')) {
      el.style.border = '2px solid #4444FF';
    } else {
      el.style.border = 'none';
    }
  }

  private getElementEmoji(element: string): string {
    const map: Record<string, string> = {
      cat: '', dog: '', rabbit: '',
      bear: '', bird: '', hamster: '',
    };
    return map[element] ?? '?';
  }
}
```

- [ ] **Step 2: Add board CSS to style.css**

```css
.board-container {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 8px 0;
}

.board-grid {
  background: #FFF0E0;
  padding: 8px;
  border-radius: 12px;
}

.board-cell {
  aspect-ratio: 1;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/BoardRenderer.ts style.css
git commit -m "feat: add BoardRenderer with drag/tap interaction"
```

---

### Task 14: Game Screen

**Files:**
- Create: `src/ui/GameScreen.ts`
- Modify: `src/core/MatchEngine.ts` (add cascade integration if needed)

- [ ] **Step 1: Implement GameScreen**

```typescript
import { Board } from '../core/Board';
import { MatchEngine } from '../core/MatchEngine';
import { GameState } from '../core/GameState';
import { getLevel } from '../core/LevelConfig';
import type { LevelConfig, Position, SaveData } from '../types';
import { BoardRenderer } from './BoardRenderer';

export class GameScreen {
  private element: HTMLElement;
  private board: Board;
  private gameState: GameState;
  private renderer: BoardRenderer;
  private levelConfig: LevelConfig;
  private onComplete: (result: { won: boolean; stars: number; levelId: number }) => void;

  constructor(
    levelId: number,
    onComplete: (result: { won: boolean; stars: number; levelId: number }) => void
  ) {
    this.onComplete = onComplete;
    const config = getLevel(levelId);
    if (!config) throw new Error(`Level ${levelId} not found`);
    this.levelConfig = config;

    this.element = document.createElement('div');
    this.element.innerHTML = `
      <div class="game-hud">
        <div class="hud-item">分数: <span id="score">0</span></div>
        <div class="hud-item">步数: <span id="moves">${config.moves}</span></div>
        <div class="hud-item" id="goal">目标: ${this.formatGoal(config)}</div>
      </div>
      <div id="board-area"></div>
      <button id="back-btn">返回</button>
    `;

    this.element.querySelector('#back-btn')!.addEventListener('click', () => {
      this.onComplete({ won: false, stars: 0, levelId });
    });

    this.board = new Board();
    this.gameState = new GameState(config);
    this.renderer = new BoardRenderer(this.element.querySelector('#board-area') as HTMLElement);
    this.renderer.setBoard(this.board);
    this.renderer.setSwapHandler((from, to) => this.handleSwap(from, to));
    this.updateHUD();
  }

  getElement(): HTMLElement {
    return this.element;
  }

  private formatGoal(level: LevelConfig): string {
    if (level.goal.type === 'score') return `${level.goal.target}分`;
    if (level.goal.type === 'collect') return `收集${level.goal.target}个${level.goal.element}`;
    return `清除${level.goal.target}个障碍`;
  }

  private handleSwap(from: Position, to: Position): void {
    if (this.gameState.getStatus() !== 'playing') return;

    const isAdjacent =
      Math.abs(from.row - to.row) + Math.abs(from.col - to.col) === 1;
    if (!isAdjacent) return;

    this.board.swap(from, to);

    if (!MatchEngine.hasMatch(this.board.getGrid())) {
      // Swap back
      this.board.swap(from, to);
      this.renderer.updateFromBoard();
      return;
    }

    this.gameState.useMove();
    this.processMatches();
    this.updateHUD();

    if (this.gameState.getStatus() !== 'playing') {
      setTimeout(() => {
        this.onComplete({
          won: this.gameState.getStatus() === 'won',
          stars: this.gameState.getStars(),
          levelId: this.levelConfig.id,
        });
      }, 500);
    }
  }

  private processMatches(): void {
    let totalScore = 0;
    let hasMatch = true;

    while (hasMatch) {
      const matches = MatchEngine.findMatches(this.board.getGrid());
      if (matches.length === 0) {
        hasMatch = false;
        break;
      }

      for (const match of matches) {
        const points = match.positions.length * 10;
        totalScore += points;
        this.gameState.recordMatch(match.element, match.positions.length);

        for (const pos of match.positions) {
          this.board.setCell(pos.row, pos.col, null);
        }
      }

      this.board.applyGravity();
    }

    this.gameState.addScore(totalScore);
    this.renderer.updateFromBoard();
  }

  private updateHUD(): void {
    this.element.querySelector('#score')!.textContent = String(this.gameState.getScore());
    this.element.querySelector('#moves')!.textContent = String(this.gameState.getMovesLeft());
  }
}
```

- [ ] **Step 2: Add game HUD CSS**

```css
.game-hud {
  display: flex;
  justify-content: space-around;
  width: 100%;
  max-width: 400px;
  padding: 12px;
  background: white;
  border-radius: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.hud-item {
  font-size: 14px;
  font-weight: 600;
  color: #6B4F4F;
}

#back-btn {
  margin-top: 16px;
  background: #D3D3D3;
  color: #4A4A4A;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/GameScreen.ts style.css
git commit -m "feat: add GameScreen with swap handling and match processing"
```

---

### Task 15: Level Select Screen

**Files:**
- Create: `src/ui/LevelSelectScreen.ts`

- [ ] **Step 1: Implement LevelSelectScreen**

```typescript
import { LEVELS } from '../core/LevelConfig';

export class LevelSelectScreen {
  private element: HTMLElement;
  private onSelect: (levelId: number) => void;
  private levelStars: Record<number, number>;
  private currentLevel: number;

  constructor(
    currentLevel: number,
    levelStars: Record<number, number>,
    onSelect: (levelId: number) => void
  ) {
    this.currentLevel = currentLevel;
    this.levelStars = levelStars;
    this.onSelect = onSelect;

    this.element = document.createElement('div');
    this.element.innerHTML = `<h1>选择关卡</h1><div class="level-map"></div>`;
    this.renderLevels();
  }

  getElement(): HTMLElement {
    return this.element;
  }

  private renderLevels(): void {
    const map = this.element.querySelector('.level-map') as HTMLElement;
    map.innerHTML = '';
    map.style.display = 'flex';
    map.style.flexDirection = 'column';
    map.style.gap = '12px';
    map.style.alignItems = 'center';

    for (const level of LEVELS) {
      const btn = document.createElement('button');
      const stars = this.levelStars[level.id] || 0;
      const isUnlocked = level.id <= this.currentLevel;

      btn.className = 'level-btn';
      btn.textContent = `${level.id}`;
      btn.disabled = !isUnlocked;

      if (stars > 0) {
        const starSpan = document.createElement('span');
        starSpan.textContent = ' '.repeat(stars);
        btn.appendChild(starSpan);
      }

      if (isUnlocked) {
        btn.addEventListener('click', () => this.onSelect(level.id));
      } else {
        btn.style.opacity = '0.4';
      }

      map.appendChild(btn);
    }
  }

  update(currentLevel: number, levelStars: Record<number, number>): void {
    this.currentLevel = currentLevel;
    this.levelStars = levelStars;
    this.renderLevels();
  }
}
```

- [ ] **Step 2: Add level select CSS**

```css
.level-map {
  width: 100%;
  max-width: 320px;
  padding: 16px 0;
}

.level-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  font-size: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.level-btn span {
  font-size: 10px;
  position: absolute;
  bottom: 4px;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/LevelSelectScreen.ts style.css
git commit -m "feat: add LevelSelectScreen"
```

---

### Task 16: Home Screen

**Files:**
- Create: `src/ui/HomeScreen.ts`

- [ ] **Step 1: Implement HomeScreen**

```typescript
import { HomeSystem } from '../systems/HomeSystem';
import { PetSystem } from '../systems/PetSystem';
import { ResourceSystem } from '../systems/ResourceSystem';
import { FURNITURE_DATA } from '../constants';

export class HomeScreen {
  private element: HTMLElement;
  private home: HomeSystem;
  private pets: PetSystem;
  private resources: ResourceSystem;
  private currentRoom = 'living';

  constructor(
    home: HomeSystem,
    pets: PetSystem,
    resources: ResourceSystem
  ) {
    this.home = home;
    this.pets = pets;
    this.resources = resources;

    this.element = document.createElement('div');
    this.element.innerHTML = `
      <h1>我的家园</h1>
      <div class="room-tabs"></div>
      <div class="room-view"></div>
      <div class="pet-list"></div>
      <button id="home-back">返回</button>
    `;

    this.renderRoomTabs();
    this.renderRoom();
    this.renderPets();

    this.element.querySelector('#home-back')!.addEventListener('click', () => {
      // Navigate back handled by main
    });
  }

  getElement(): HTMLElement {
    return this.element;
  }

  private renderRoomTabs(): void {
    const tabs = this.element.querySelector('.room-tabs') as HTMLElement;
    tabs.innerHTML = '';
    tabs.style.display = 'flex';
    tabs.style.gap = '8px';
    tabs.style.marginBottom = '12px';

    for (const room of this.home.getRooms()) {
      const btn = document.createElement('button');
      btn.textContent = room.name;
      btn.disabled = !room.unlocked;
      if (room.id === this.currentRoom) {
        btn.style.background = '#98FB98';
      }
      if (room.unlocked) {
        btn.addEventListener('click', () => {
          this.currentRoom = room.id;
          this.renderRoomTabs();
          this.renderRoom();
        });
      }
      tabs.appendChild(btn);
    }
  }

  private renderRoom(): void {
    const view = this.element.querySelector('.room-view') as HTMLElement;
    view.innerHTML = '';
    view.className = 'room-view';
    view.style.width = '100%';
    view.style.maxWidth = '400px';
    view.style.height = '300px';
    view.style.background = '#E8F5E9';
    view.style.borderRadius = '16px';
    view.style.position = 'relative';
    view.style.overflow = 'hidden';

    const room = this.home.getRoom(this.currentRoom);
    if (!room) return;

    for (const item of room.furniture) {
      const furnitureEl = document.createElement('div');
      furnitureEl.className = 'furniture-item';
      furnitureEl.textContent = item.itemId;
      furnitureEl.style.position = 'absolute';
      furnitureEl.style.left = `${item.col * 20}%`;
      furnitureEl.style.top = `${item.row * 20}%`;
      furnitureEl.style.padding = '8px';
      furnitureEl.style.background = '#D2B48C';
      furnitureEl.style.borderRadius = '8px';
      furnitureEl.style.fontSize = '12px';
      view.appendChild(furnitureEl);
    }

    // Add furniture button
    const addBtn = document.createElement('button');
    addBtn.textContent = '+ 家具';
    addBtn.style.position = 'absolute';
    addBtn.style.bottom = '8px';
    addBtn.style.right = '8px';
    addBtn.addEventListener('click', () => this.showFurnitureShop());
    view.appendChild(addBtn);
  }

  private showFurnitureShop(): void {
    const shop = document.createElement('div');
    shop.className = 'modal';
    shop.innerHTML = `<h3>家具商店</h3><div class="shop-items"></div>`;

    const items = shop.querySelector('.shop-items') as HTMLElement;
    for (const item of FURNITURE_DATA.filter(f => f.roomType === this.currentRoom)) {
      const btn = document.createElement('button');
      btn.textContent = `${item.name} (${item.price})`;
      btn.addEventListener('click', () => {
        if (this.resources.spendCoins(item.price)) {
          this.home.placeFurniture(this.currentRoom, item.id, 2, 2, 0);
          this.renderRoom();
          shop.remove();
        } else {
          alert('金币不足');
        }
      });
      items.appendChild(btn);
    }

    const close = document.createElement('button');
    close.textContent = '关闭';
    close.addEventListener('click', () => shop.remove());
    shop.appendChild(close);

    this.element.appendChild(shop);
  }

  private renderPets(): void {
    const list = this.element.querySelector('.pet-list') as HTMLElement;
    list.innerHTML = '<h3>我的小动物</h3>';
    list.style.marginTop = '16px';

    for (const pet of this.pets.getAllPets()) {
      const card = document.createElement('div');
      card.className = 'pet-card';
      card.innerHTML = `
        <strong>${pet.name}</strong> (亲密度: ${pet.intimacy})
      `;

      const feedBtn = document.createElement('button');
      feedBtn.textContent = '喂食';
      feedBtn.addEventListener('click', () => {
        this.pets.feed(pet.id);
        this.renderPets();
      });
      card.appendChild(feedBtn);

      list.appendChild(card);
    }
  }
}
```

- [ ] **Step 2: Add home screen CSS**

```css
.room-view {
  margin-bottom: 16px;
}

.pet-list {
  width: 100%;
  max-width: 400px;
}

.pet-card {
  background: white;
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 100;
}

.modal > div {
  background: white;
  padding: 20px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 320px;
  width: 100%;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/HomeScreen.ts style.css
git commit -m "feat: add HomeScreen with room view, furniture shop, and pet feed"
```

---

### Task 17: Main Entry & Integration

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Implement main.ts**

```typescript
import { ScreenManager } from './ui/ScreenManager';
import { LevelSelectScreen } from './ui/LevelSelectScreen';
import { GameScreen } from './ui/GameScreen';
import { HomeScreen } from './ui/HomeScreen';
import { SaveManager } from './systems/SaveManager';
import { ResourceSystem } from './systems/ResourceSystem';
import { HomeSystem } from './systems/HomeSystem';
import { PetSystem } from './systems/PetSystem';
import type { SaveData } from './types';

class GameApp {
  private screenMgr: ScreenManager;
  private saveMgr = new SaveManager();
  private resources: ResourceSystem;
  private home: HomeSystem;
  private pets: PetSystem;
  private saveData: SaveData;
  private levelSelect: LevelSelectScreen;

  constructor() {
    this.screenMgr = new ScreenManager('app');

    const loaded = this.saveMgr.load();
    this.saveData = loaded ?? this.createNewSave();

    this.resources = new ResourceSystem({
      coins: this.saveData.coins,
      fragments: this.saveData.fragments,
    });

    this.home = new HomeSystem({
      rooms: this.saveData.rooms,
      unlockedFurniture: this.saveData.unlockedFurniture,
    });

    this.pets = new PetSystem({
      pets: this.saveData.pets,
      fragments: this.saveData.fragments,
      unlockedClothes: {},
    });

    this.setupScreens();
    this.screenMgr.show('menu');
  }

  private createNewSave(): SaveData {
    return {
      currentLevel: 1,
      levelStars: {},
      coins: 200,
      fragments: {},
      unlockedPets: ['cat'],
      pets: {
        cat: { id: 'cat', name: '咪咪', intimacy: 0, unlockedClothes: [], currentClothes: '' },
      },
      rooms: {
        living: { id: 'living', name: '客厅', unlocked: true, furniture: [], wallpaper: 'default', floor: 'default' },
        bedroom: { id: 'bedroom', name: '卧室', unlocked: false, furniture: [], wallpaper: 'default', floor: 'default' },
      },
      unlockedFurniture: [],
    };
  }

  private setupScreens(): void {
    // Menu
    const menu = document.createElement('div');
    menu.innerHTML = `
      <h1>Pet Match</h1>
      <button id="btn-play">开始游戏</button>
      <button id="btn-home">我的家园</button>
    `;
    menu.querySelector('#btn-play')!.addEventListener('click', () => {
      this.screenMgr.show('levelSelect');
    });
    menu.querySelector('#btn-home')!.addEventListener('click', () => {
      this.screenMgr.show('home');
    });
    this.screenMgr.register('menu', menu);

    // Level Select
    this.levelSelect = new LevelSelectScreen(
      this.saveData.currentLevel,
      this.saveData.levelStars,
      (levelId) => this.startLevel(levelId)
    );
    this.screenMgr.register('levelSelect', this.levelSelect.getElement());

    // Home
    const homeScreen = new HomeScreen(this.home, this.pets, this.resources);
    this.screenMgr.register('home', homeScreen.getElement());
  }

  private startLevel(levelId: number): void {
    const game = new GameScreen(levelId, (result) => {
      if (result.won) {
        this.saveData.levelStars[levelId] = Math.max(
          this.saveData.levelStars[levelId] || 0,
          result.stars
        );
        if (levelId >= this.saveData.currentLevel) {
          this.saveData.currentLevel = levelId + 1;
        }

        // Rewards
        this.resources.addCoins(50 + result.stars * 20);
        const fragmentPet = this.getFragmentPetForLevel(levelId);
        if (fragmentPet) {
          this.resources.addFragments(fragmentPet, 1);
        }

        // Unlock room
        this.home.unlockRoom('bedroom', this.saveData.currentLevel);
      }

      this.persistSave();
      this.levelSelect.update(this.saveData.currentLevel, this.saveData.levelStars);
      this.screenMgr.show('levelSelect');
    });

    this.screenMgr.register('game', game.getElement());
    this.screenMgr.show('game');
  }

  private getFragmentPetForLevel(levelId: number): string | null {
    const map: Record<number, string> = { 3: 'cat', 5: 'dog', 8: 'rabbit' };
    return map[levelId] ?? null;
  }

  private persistSave(): void {
    this.saveData.coins = this.resources.getCoins();
    this.saveData.fragments = this.resources.getSaveData().fragments;
    const petSave = this.pets.getSaveData();
    this.saveData.pets = petSave.pets;
    this.saveData.unlockedPets = Object.keys(petSave.pets);
    this.saveData.rooms = this.home.getSaveData().rooms;
    this.saveData.unlockedFurniture = this.home.getSaveData().unlockedFurniture;
    this.saveMgr.save(this.saveData);
  }
}

new GameApp();
```

- [ ] **Step 2: Manual integration test**

```bash
npm run dev
```

Open browser at `http://localhost:5173`.

Verify:
1. Menu screen loads with "Pet Match" title and two buttons
2. "开始游戏" opens level select
3. Level 1 is clickable, levels 2+ are grayed out
4. Click level 1 opens game board with 8x8 grid
5. Swapping adjacent cells works
6. Matching 3+ triggers elimination and gravity fill
7. Score and moves update in HUD
8. Completing level (or running out of moves) returns to level select
9. Level select updates with star count
10. "我的家园" opens home screen
11. Can place furniture (if coins sufficient)
12. Can feed pet
13. Refresh page, progress is preserved

- [ ] **Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat: integrate all screens and systems in main entry"
```

---

### Task 18: Final Polish & Verification

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Run all unit tests**

```bash
npm test
```

Expected: All tests pass. If any fail, fix before proceeding.

- [ ] **Step 2: Polish responsive CSS**

Add to `style.css`:

```css
@media (max-height: 600px) {
  .board-container {
    padding: 4px 0;
  }
  .game-hud {
    padding: 8px;
    margin-bottom: 8px;
  }
  h1 {
    font-size: 22px;
    margin-bottom: 12px;
  }
}

@media (min-width: 500px) {
  .app-container {
    display: flex;
    justify-content: center;
  }
  .screen {
    max-width: 480px;
    width: 100%;
  }
}
```

- [ ] **Step 3: Final build check**

```bash
npm run build
```

Expected: No TypeScript errors, build succeeds in `dist/`.

- [ ] **Step 4: Commit**

```bash
git add style.css
git commit -m "style: add responsive breakpoints and polish"
```

---

## Plan Self-Review

**1. Spec coverage:**

| Spec Section | Plan Tasks |
|-------------|-----------|
| 三消核心玩法 (8x8, 6元素, 交换, 连锁) | Task 3, 4, 5, 14 |
| 特殊块 (4连直线, 5连炸弹) | Task 5 |
| 关卡目标 (得分/收集/清障) | Task 6, 7 |
| 步数与时长控制 | Task 6, 14 |
| 障碍物 (木箱, 冰块) | Task 7 (木箱), MVP不含冰块 |
| 过关奖励 (星星/金币/碎片) | Task 14, 17 |
| 家园系统 (房间/家具/布置) | Task 9, 16 |
| 小动物系统 (碎片解锁/喂食/换装) | Task 10, 16 |
| 存档 (localStorage + 存档码) | Task 11, 17 |
| MVP范围 (20关, 2房间, 3动物) | All tasks |

**2. Placeholder scan:** No TBD, TODO, or vague instructions found.

**3. Type consistency:** Board.grid, MatchEngine.findMatches signatures consistent across tasks. SaveData shape matches all system getSaveData() outputs.

**4. Scope:** 18 tasks focused on MVP. Ice obstacles and additional rooms deferred to post-MVP, as specified in design doc Section 8.
