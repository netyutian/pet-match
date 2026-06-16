import { Board } from '../src/core/Board';
import { MatchEngine } from '../src/core/MatchEngine';
import { LEVELS } from '../src/core/LevelConfig';
import type { LevelConfig } from '../src/types';

function simulateLevel(level: LevelConfig, moves: number): boolean {
  const board = new Board();
  const preferredChance = Math.max(0.2, 0.5 - (level.id - 1) * 0.02);
  board.setPreferredElement(level.goal.element, preferredChance);
  if (level.obstacles) {
    board.setObstacles(level.obstacles);
  }

  let score = 0;
  const collectedElements: Record<string, number> = {};
  let clearedObstacles = 0;

  for (let move = 0; move < moves; move++) {
    let hint = MatchEngine.findHint(board.getGrid(), level.goal.element);
    if (!hint) {
      board.shuffle();
      hint = MatchEngine.findHint(board.getGrid(), level.goal.element);
      if (!hint) break;
    }

    board.swap(hint[0], hint[1]);

    while (MatchEngine.hasMatch(board.getGrid())) {
      const matches = MatchEngine.findMatches(board.getGrid());
      const allPositions = matches.flatMap(m => m.positions);

      for (const pos of allPositions) {
        const cell = board.getCell(pos.row, pos.col);
        if (cell?.obstacle) {
          const destroyed = board.hitObstacle(pos.row, pos.col);
          if (destroyed) {
            clearedObstacles++;
          } else {
            continue;
          }
        }
        board.setCell(pos.row, pos.col, null);
      }

      for (const match of matches) {
        score += match.positions.length * 10;
        collectedElements[match.element] = (collectedElements[match.element] || 0) + match.positions.length;
      }

      board.applyGravity();
    }
  }

  if (level.goal.type === 'score') {
    return score >= level.goal.target;
  } else if (level.goal.type === 'collect' && level.goal.element) {
    return (collectedElements[level.goal.element] || 0) >= level.goal.target;
  } else if (level.goal.type === 'clear') {
    return clearedObstacles >= level.goal.target;
  }
  return false;
}

function findMinMoves(level: LevelConfig, maxMoves = 40): { minMoves: number; winRate: number } {
  for (let moves = 5; moves <= maxMoves; moves++) {
    let wins = 0;
    const trials = 50;
    for (let i = 0; i < trials; i++) {
      if (simulateLevel(level, moves)) wins++;
    }
    const winRate = wins / trials;
    if (winRate >= 0.5) {
      return { minMoves: moves, winRate: Math.round(winRate * 100) };
    }
  }
  return { minMoves: maxMoves, winRate: 0 };
}

function testAt25Moves(level: LevelConfig): { winRate: number; avgDone: number } {
  let wins = 0;
  let totalDone = 0;
  const trials = 50;
  for (let i = 0; i < trials; i++) {
    const board = new Board();
    const preferredChance = Math.max(0.2, 0.5 - (level.id - 1) * 0.02);
    board.setPreferredElement(level.goal.element, preferredChance);
    if (level.obstacles) {
      board.setObstacles(level.obstacles);
    }

    let score = 0;
    const collectedElements: Record<string, number> = {};
    let clearedObstacles = 0;

    for (let move = 0; move < 25; move++) {
      let hint = MatchEngine.findHint(board.getGrid(), level.goal.element);
      if (!hint) {
        board.shuffle();
        hint = MatchEngine.findHint(board.getGrid(), level.goal.element);
        if (!hint) break;
      }
      board.swap(hint[0], hint[1]);
      while (MatchEngine.hasMatch(board.getGrid())) {
        const matches = MatchEngine.findMatches(board.getGrid());
        const allPositions = matches.flatMap(m => m.positions);
        for (const pos of allPositions) {
          const cell = board.getCell(pos.row, pos.col);
          if (cell?.obstacle) {
            const destroyed = board.hitObstacle(pos.row, pos.col);
            if (destroyed) clearedObstacles++;
            else continue;
          }
          board.setCell(pos.row, pos.col, null);
        }
        for (const match of matches) {
          score += match.positions.length * 10;
          collectedElements[match.element] = (collectedElements[match.element] || 0) + match.positions.length;
        }
        board.applyGravity();
      }
    }

    let done = 0;
    let won = false;
    if (level.goal.type === 'score') {
      done = score;
      won = score >= level.goal.target;
    } else if (level.goal.type === 'collect' && level.goal.element) {
      done = collectedElements[level.goal.element] || 0;
      won = done >= level.goal.target;
    } else if (level.goal.type === 'clear') {
      done = clearedObstacles;
      won = done >= level.goal.target;
    }
    wins += won ? 1 : 0;
    totalDone += done;
  }

  return { winRate: Math.round(wins / trials * 100), avgDone: Math.round(totalDone / trials) };
}

console.log('Level  Type   Target  Moves  Obst  25步胜率  25步平均  最小步数  50%胜率');
console.log('----------------------------------------------------------------------');

for (const level of LEVELS) {
  const minMoves = findMinMoves(level, 40);
  const at25 = testAt25Moves(level);
  const doneLabel = level.goal.type === 'score' ? '分' : level.goal.type === 'collect' ? '个' : '个';
  console.log(
    `${level.id.toString().padStart(2)}     ${level.goal.type.padEnd(6)} ${level.goal.target.toString().padStart(6)} ${level.moves.toString().padStart(5)} ${level.obstacles ? 'Yes' : 'No '}${'  '}${at25.winRate.toString().padStart(4)}%   ${(at25.avgDone + doneLabel).padStart(6)} ${minMoves.minMoves.toString().padStart(6)}步   ${minMoves.winRate}%`
  );
}
