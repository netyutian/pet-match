import { Board } from '../src/core/Board';
import { MatchEngine } from '../src/core/MatchEngine';
import { LEVELS } from '../src/core/LevelConfig';
import type { LevelConfig, Position } from '../src/types';

function simulateLevel(level: LevelConfig): {
  score: number;
  collected: number;
  cleared: number;
  won: boolean;
} {
  const board = new Board();
  const preferredChance = Math.max(0.2, 0.5 - (level.id - 1) * 0.02);
  board.setPreferredElement(level.goal.element, preferredChance);
  if (level.obstacles) {
    board.setObstacles(level.obstacles);
  }

  let score = 0;
  const collectedElements: Record<string, number> = {};
  let clearedObstacles = 0;

  for (let move = 0; move < level.moves; move++) {
    let hint = MatchEngine.findHint(board.getGrid(), level.goal.element);
    if (!hint) {
      board.shuffle();
      hint = MatchEngine.findHint(board.getGrid(), level.goal.element);
      if (!hint) break;
    }

    board.swap(hint[0], hint[1]);
    let moveScore = 0;

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
        moveScore += match.positions.length * 10;
        collectedElements[match.element] = (collectedElements[match.element] || 0) + match.positions.length;
      }

      board.applyGravity();
    }

    score += moveScore;
  }

  let won = false;
  if (level.goal.type === 'score') {
    won = score >= level.goal.target;
  } else if (level.goal.type === 'collect' && level.goal.element) {
    won = (collectedElements[level.goal.element] || 0) >= level.goal.target;
  } else if (level.goal.type === 'clear') {
    won = clearedObstacles >= level.goal.target;
  }

  return {
    score,
    collected: collectedElements[level.goal.element || ''] || 0,
    cleared: clearedObstacles,
    won,
  };
}

function testLevel(level: LevelConfig, trials = 100) {
  let wins = 0;
  let totalScore = 0;
  let totalCollected = 0;
  let totalCleared = 0;
  let minScore = Infinity;
  let maxScore = -Infinity;

  for (let i = 0; i < trials; i++) {
    const result = simulateLevel(level);
    wins += result.won ? 1 : 0;
    totalScore += result.score;
    totalCollected += result.collected;
    totalCleared += result.cleared;
    minScore = Math.min(minScore, result.score);
    maxScore = Math.max(maxScore, result.score);
  }

  const avgScore = Math.round(totalScore / trials);
  const avgCollected = Math.round(totalCollected / trials);
  const avgCleared = Math.round(totalCleared / trials);
  const winRate = (wins / trials * 100).toFixed(0);

  let suggestion = '';
  if (level.goal.type === 'score') {
    const ratio = avgScore / level.goal.target;
    if (ratio < 0.5) suggestion = '大幅降目标或加步数';
    else if (ratio < 0.7) suggestion = '降目标或加步数';
    else if (ratio < 0.9) suggestion = '微调';
    else suggestion = '难度合适';
  } else if (level.goal.type === 'collect') {
    const ratio = avgCollected / level.goal.target;
    if (ratio < 0.5) suggestion = '大幅降目标或加步数';
    else if (ratio < 0.7) suggestion = '降目标或加步数';
    else if (ratio < 0.9) suggestion = '微调';
    else suggestion = '难度合适';
  } else if (level.goal.type === 'clear') {
    const ratio = avgCleared / level.goal.target;
    if (ratio < 0.5) suggestion = '大幅降目标或加步数';
    else if (ratio < 0.7) suggestion = '降目标或加步数';
    else if (ratio < 0.9) suggestion = '微调';
    else suggestion = '难度合适';
  }

  return {
    id: level.id,
    type: level.goal.type,
    target: level.goal.target,
    moves: level.moves,
    hasObstacles: !!level.obstacles,
    winRate: `${winRate}%`,
    avgScore,
    avgCollected,
    avgCleared,
    minScore,
    maxScore,
    suggestion,
  };
}

console.log('Level  Type    Target  Moves  Obst  WinRate  AvgDone  MinScore  MaxScore  Suggestion');
console.log('--------------------------------------------------------------------------------');

for (const level of LEVELS) {
  const result = testLevel(level, 100);
  const done = result.type === 'score' ? result.avgScore : result.type === 'collect' ? result.avgCollected : result.avgCleared;
  console.log(
    `${result.id.toString().padStart(2)}     ${result.type.padEnd(6)} ${result.target.toString().padStart(6)} ${result.moves.toString().padStart(5)} ${result.hasObstacles ? 'Yes' : 'No '}${'  '}${result.winRate.padStart(5)} ${done.toString().padStart(7)} ${result.minScore.toString().padStart(8)} ${result.maxScore.toString().padStart(8)}  ${result.suggestion}`
  );
}
