import { Board } from '../src/core/Board';
import { MatchEngine } from '../src/core/MatchEngine';

const LEVEL9_OBSTACLES = [
  { type: 'ice' as const, positions: [{ row: 3, col: 3 }, { row: 3, col: 4 }, { row: 4, col: 3 }, { row: 4, col: 4 }] }
];

function simulateLevel9(): number {
  const board = new Board();
  board.setPreferredElement(undefined);
  board.setObstacles(LEVEL9_OBSTACLES);
  let totalScore = 0;
  const moves = 14;

  for (let move = 0; move < moves; move++) {
    let hint = MatchEngine.findHint(board.getGrid());
    if (!hint) {
      board.shuffle();
      hint = MatchEngine.findHint(board.getGrid());
      if (!hint) break;
    }

    board.swap(hint[0], hint[1]);
    let chainScore = 0;

    while (MatchEngine.hasMatch(board.getGrid())) {
      const matches = MatchEngine.findMatches(board.getGrid());
      const allPositions = matches.flatMap(m => m.positions);

      // Eliminate with obstacle logic
      for (const pos of allPositions) {
        const cell = board.getCell(pos.row, pos.col);
        if (cell?.obstacle) {
          const destroyed = board.hitObstacle(pos.row, pos.col);
          if (!destroyed) {
            continue; // Ice first hit: keep obstacle
          }
        }
        board.setCell(pos.row, pos.col, null);
      }

      for (const match of matches) {
        chainScore += match.positions.length * 10;
      }

      board.applyGravity();
    }

    totalScore += chainScore;
  }

  return totalScore;
}

const trials = 100;
let wins = 0;
let total = 0;
let min = Infinity;
let max = -Infinity;

for (let i = 0; i < trials; i++) {
  const score = simulateLevel9();
  total += score;
  if (score < min) min = score;
  if (score > max) max = score;
  if (score >= 1200) wins++;
}

console.log(`Level 9: 14 moves, target 1200, 4 ice obstacles`);
console.log(`Trials: ${trials}`);
console.log(`Average: ${Math.round(total / trials)}`);
console.log(`Min: ${min}`);
console.log(`Max: ${max}`);
console.log(`Wins: ${wins} (${(wins / trials * 100).toFixed(1)}%)`);

const buckets: Record<number, number> = {};
for (let i = 0; i < trials; i++) {
  const score = simulateLevel9();
  const bucket = Math.floor(score / 100) * 100;
  buckets[bucket] = (buckets[bucket] || 0) + 1;
}
console.log('\nDistribution:');
Object.entries(buckets).sort((a, b) => Number(a[0]) - Number(b[0])).forEach(([bucket, count]) => {
  console.log(`  ${bucket}-${Number(bucket) + 99}: ${count}`);
});
