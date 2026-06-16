import { Board } from '../src/core/Board';
import { MatchEngine } from '../src/core/MatchEngine';

function simulateLevel6(): number {
  const board = new Board();
  board.setPreferredElement(undefined); // 8 random elements
  let totalScore = 0;
  const moves = 15;

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

      for (const pos of allPositions) {
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
  const score = simulateLevel6();
  total += score;
  if (score < min) min = score;
  if (score > max) max = score;
  if (score >= 800) wins++;
}

console.log(`Trials: ${trials}`);
console.log(`Target: 800`);
console.log(`Average: ${Math.round(total / trials)}`);
console.log(`Min: ${min}`);
console.log(`Max: ${max}`);
console.log(`Wins: ${wins} (${(wins / trials * 100).toFixed(1)}%)`);

// Distribution
const buckets: Record<number, number> = {};
for (let i = 0; i < trials; i++) {
  const score = simulateLevel6();
  const bucket = Math.floor(score / 100) * 100;
  buckets[bucket] = (buckets[bucket] || 0) + 1;
}
console.log('\nDistribution:');
Object.entries(buckets).sort((a, b) => Number(a[0]) - Number(b[0])).forEach(([bucket, count]) => {
  console.log(`  ${bucket}-${Number(bucket) + 99}: ${count}`);
});
