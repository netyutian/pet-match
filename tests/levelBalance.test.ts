import { describe, it } from 'vitest';
import { Board } from '../src/core/Board';
import { MatchEngine } from '../src/core/MatchEngine';
import { GameState } from '../src/core/GameState';
import { getLevel } from '../src/core/LevelConfig';
import { BOARD_SIZE } from '../src/constants';
import type { LevelConfig } from '../src/types';

interface SimResult {
  levelId: number;
  won: boolean;
  moves: number;
  score: number;
  deadlocks: number;
  chainRounds: number;
  maxChainDepth: number;
  reason: string;
}

function processMatches(board: Board, state: GameState, level: LevelConfig): number {
  const goalElement = level.goal.element;
  let totalScore = 0;
  let rounds = 0;

  while (MatchEngine.hasMatch(board.getGrid())) {
    rounds++;
    const matches = MatchEngine.findMatches(board.getGrid());
    const bombSpawns = MatchEngine.findSpecials(board.getGrid()).filter((s) => {
      if (s.type !== 'bomb') return false;
      const cell = board.getCell(s.position.row, s.position.col);
      return !cell?.obstacle;
    });
    const bombKeys = new Set(bombSpawns.map((s) => `${s.position.row},${s.position.col}`));
    const allPositions = matches.flatMap((m) => m.positions);
    const eliminatePositions = allPositions.filter((p) => !bombKeys.has(`${p.row},${p.col}`));

    for (const pos of eliminatePositions) {
      const cell = board.getCell(pos.row, pos.col);
      if (cell?.obstacle) {
        const destroyed = board.hitObstacle(pos.row, pos.col);
        if (destroyed) state.recordObstacleCleared();
      }
      board.setCell(pos.row, pos.col, null);
    }

    const affectedRows = new Set<number>();
    const affectedCols = new Set<number>();
    for (const pos of allPositions) {
      affectedRows.add(pos.row);
      affectedCols.add(pos.col);
    }
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (affectedRows.has(r) || affectedCols.has(c)) {
          const cell = board.getCell(r, c);
          if (cell?.obstacle) {
            const destroyed = board.hitObstacle(r, c);
            if (destroyed) state.recordObstacleCleared();
          }
        }
      }
    }

    for (const sp of bombSpawns) {
      const cell = board.getCell(sp.position.row, sp.position.col);
      if (cell) cell.special = 'bomb';
    }

    for (const match of matches) {
      totalScore += match.positions.length * 10;
      state.recordMatch(match.element, match.positions.length);
    }

    board.applyGravity();
  }

  state.addScore(totalScore);
  return rounds;
}

function findHintNearObstacles(board: Board): [Position, Position] | null {
  const grid = board.getGrid();
  const obstaclePositions: Position[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (grid[r]?.[c]?.obstacle) {
        obstaclePositions.push({ row: r, col: c });
      }
    }
  }
  if (obstaclePositions.length === 0) return null;

  const fallback = MatchEngine.findHint(grid);
  if (!fallback) return null;

  // Try every possible swap (not just the basic hint) and prefer one that clears an obstacle row/col
  const directions = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
  ];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (!grid[r]?.[c]) continue;
      for (const d of directions) {
        const nr = r + d.dr;
        const nc = c + d.dc;
        if (nr >= BOARD_SIZE || nc >= BOARD_SIZE) continue;
        if (!grid[nr]?.[nc]) continue;
        const pos1: Position = { row: r, col: c };
        const pos2: Position = { row: nr, col: nc };

        const temp = grid[r][c];
        grid[r][c] = grid[nr][nc];
        grid[nr][nc] = temp;
        const matches = MatchEngine.findMatches(grid);
        const hitsObstacle = matches.some((m) =>
          m.positions.some((p) =>
            obstaclePositions.some((o) => o.row === p.row || o.col === p.col)
          )
        );
        grid[nr][nc] = grid[r][c];
        grid[r][c] = temp;

        if (matches.length > 0 && hitsObstacle) {
          return [pos1, pos2];
        }
      }
    }
  }
  return fallback;
}

function simulateLevel(levelId: number): SimResult {
  const level = getLevel(levelId);
  if (!level) throw new Error(`Level ${levelId} not found`);

  const board = new Board();
  board.setPreferredElement(level.goal.element, Math.max(0.2, 0.5 - (levelId - 1) * 0.02));
  if (level.obstacles) {
    board.setObstacles(level.obstacles);
  }
  const state = new GameState(level);

  let moves = 0;
  let deadlocks = 0;
  let chainRounds = 0;
  let maxChainDepth = 0;

  while (moves < level.moves && state.getStatus() === 'playing') {
    let hint: [Position, Position] | null = null;
    if (level.goal.type === 'clear' && Math.random() < 0.7) {
      hint = findHintNearObstacles(board);
    } else {
      hint = MatchEngine.findHint(board.getGrid(), level.goal.element);
    }
    if (!hint) {
      deadlocks++;
      let attempts = 0;
      do {
        board.shuffle();
        attempts++;
      } while (!MatchEngine.findHint(board.getGrid()) && attempts < 10);
      if (!MatchEngine.findHint(board.getGrid())) {
        return { levelId, won: false, moves, score: state.getScore(), deadlocks, chainRounds, maxChainDepth, reason: 'deadlock-unresolvable' };
      }
      hint = level.goal.type === 'clear' && Math.random() < 0.7
        ? findHintNearObstacles(board)
        : MatchEngine.findHint(board.getGrid(), level.goal.element);
    }

    const [from, to] = hint!;
    board.swap(from, to);
    state.useMove();
    moves++;

    if (MatchEngine.hasMatch(board.getGrid())) {
      const depth = processMatches(board, state, level);
      chainRounds++;
      maxChainDepth = Math.max(maxChainDepth, depth);
    }

    if (state.getStatus() === 'won') {
      return { levelId, won: true, moves, score: state.getScore(), deadlocks, chainRounds, maxChainDepth, reason: 'won' };
    }
  }

  return {
    levelId,
    won: state.getStatus() === 'won',
    moves,
    score: state.getScore(),
    deadlocks,
    chainRounds,
    maxChainDepth,
    reason: state.getStatus() === 'won' ? 'won' : 'out-of-moves',
  };
}

function difficultyLabel(winRate: number): string {
  if (winRate >= 0.95) return '极简';
  if (winRate >= 0.8) return '简单';
  if (winRate >= 0.6) return '中等';
  if (winRate >= 0.4) return '较难';
  if (winRate >= 0.2) return '困难';
  return '极难';
}

describe('Level 1-20 balance simulation', () => {
  it('runs 50 simulations per level and prints a report', () => {
    const runs = 50;
    const report: {
      level: number;
      type: string;
      target: string;
      moves: number;
      winRate: string;
      avgMoves: number;
      avgScore: number;
      avgDeadlocks: number;
      avgChains: number;
      difficulty: string;
    }[] = [];

    for (let levelId = 1; levelId <= 20; levelId++) {
      const level = getLevel(levelId)!;
      const results: SimResult[] = [];
      for (let i = 0; i < runs; i++) {
        results.push(simulateLevel(levelId));
      }

      const wins = results.filter((r) => r.won).length;
      const avgMoves = results.reduce((s, r) => s + r.moves, 0) / runs;
      const avgScore = results.reduce((s, r) => s + r.score, 0) / runs;
      const avgDeadlocks = results.reduce((s, r) => s + r.deadlocks, 0) / runs;
      const avgChains = results.reduce((s, r) => s + r.chainRounds, 0) / runs;
      const winRate = wins / runs;

      const targetStr =
        level.goal.type === 'score'
          ? `${level.goal.target}分`
          : level.goal.type === 'collect'
          ? `${level.goal.target} ${level.goal.element}`
          : `${level.goal.target} 解救`;

      report.push({
        level: levelId,
        type: level.goal.type,
        target: targetStr,
        moves: level.moves,
        winRate: `${(winRate * 100).toFixed(0)}%`,
        avgMoves: Number(avgMoves.toFixed(1)),
        avgScore: Math.round(avgScore),
        avgDeadlocks: Number(avgDeadlocks.toFixed(2)),
        avgChains: Number(avgChains.toFixed(1)),
        difficulty: difficultyLabel(winRate),
      });
    }

    console.log('\n========== 消消乐 1-20 关难度模拟报告 ==========');
    console.log(`每关模拟 ${runs} 次，AI 采用目标优先提示策略\n`);
    console.table(report);
    console.log('\n结论：');
    const tooHard = report.filter((r) => parseFloat(r.winRate) < 30);
    const tooEasy = report.filter((r) => parseFloat(r.winRate) > 95);
    if (tooHard.length) {
      console.log(`偏难关卡（胜率 <30%）：${tooHard.map((r) => r.level).join(', ')}`);
    }
    if (tooEasy.length) {
      console.log(`偏简单关卡（胜率 >95%）：${tooEasy.map((r) => r.level).join(', ')}`);
    }
    if (!tooHard.length && !tooEasy.length) {
      console.log('整体难度分布较均匀，没有明显偏难或偏简单关卡。');
    }
  });
});
