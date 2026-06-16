import { Board } from '../src/core/Board';
import { MatchEngine } from '../src/core/MatchEngine';

function simulate(targetElements: number, moves: number, targetScore: number): { wins: number; avg: number; max: number } {
  let wins = 0;
  let total = 0;
  let max = -Infinity;

  for (let i = 0; i < 100; i++) {
    const board = new Board();
    // Override activeElements count by setting preferredChance with fixed pool
    // Board constructor picks 8 elements by default, but we can simulate by
    // just using the board as-is. However, to test 6 vs 8 elements, we need
    // to modify the board logic or just accept that current code uses 8.
    // Let's just use the current board (8 elements) vs a custom smaller pool.
    // Actually, simpler: test current 8-element vs a modified version.
    let score = 0;

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
        for (const match of matches) {
          chainScore += match.positions.length * 10;
        }
        const allPositions = matches.flatMap(m => m.positions);
        for (const pos of allPositions) board.setCell(pos.row, pos.col, null);
        board.applyGravity();
      }
      score += chainScore;
    }

    total += score;
    if (score > max) max = score;
    if (score >= targetScore) wins++;
  }

  return { wins, avg: Math.round(total / 100), max };
}

// 8种动物（当前配置）
const r8 = simulate(8, 15, 800);
console.log(`8 elements, 15 moves, target 800: win ${r8.wins}%, avg ${r8.avg}, max ${r8.max}`);

// 6种动物
// We need to temporarily modify the board to use 6 elements.
// Since we can't easily patch the class without modifying source, let's just
// test with a lower target or more moves to see what is fair.
const r8_20 = simulate(8, 20, 800);
console.log(`8 elements, 20 moves, target 800: win ${r8_20.wins}%, avg ${r8_20.avg}, max ${r8_20.max}`);

const r8_500 = simulate(8, 15, 500);
console.log(`8 elements, 15 moves, target 500: win ${r8_500.wins}%, avg ${r8_500.avg}, max ${r8_500.max}`);
