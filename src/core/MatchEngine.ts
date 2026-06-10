import type { Cell, Position, Match } from '../types';
import { BOARD_SIZE } from '../constants';

export class MatchEngine {
  static findMatches(grid: (Cell | null)[][]): Match[] {
    const matches: Match[] = [];
    const matched = new Set<string>();

    // Horizontal
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE - 2; c++) {
        const cell = grid[r]?.[c];
        if (!cell) continue;

        let count = 1;
        while (c + count < BOARD_SIZE && grid[r]?.[c + count]?.element === cell.element) {
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
        const cell = grid[r]?.[c];
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
