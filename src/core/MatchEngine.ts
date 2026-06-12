import type { Cell, Position, Match } from '../types';
import { BOARD_SIZE } from '../constants';

export interface SpecialSpawn {
  position: Position;
  type: 'line_h' | 'line_v' | 'bomb';
  element: string;
}

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

  static findHint(grid: (Cell | null)[][]): [Position, Position] | null {
    const directions = [
      { dr: 0, dc: 1 },
      { dr: 1, dc: 0 },
    ];

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (!grid[r]?.[c]) continue;
        const pos1: Position = { row: r, col: c };
        for (const d of directions) {
          const nr = r + d.dr;
          const nc = c + d.dc;
          if (nr >= BOARD_SIZE || nc >= BOARD_SIZE) continue;
          if (!grid[nr]?.[nc]) continue;

          const pos2: Position = { row: nr, col: nc };
          // Virtual swap and test
          const temp = grid[r][c];
          grid[r][c] = grid[nr][nc];
          grid[nr][nc] = temp;

          const hasMatch = this.hasMatch(grid);

          // Swap back
          grid[nr][nc] = grid[r][c];
          grid[r][c] = temp;

          if (hasMatch) {
            return [pos1, pos2];
          }
        }
      }
    }

    return null;
  }

  static findSpecials(grid: (Cell | null)[][]): SpecialSpawn[] {
    const specials: SpecialSpawn[] = [];

    // Horizontal specials
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE - 3; c++) {
        const cell = grid[r]?.[c];
        if (!cell) continue;

        let count = 1;
        while (c + count < BOARD_SIZE && grid[r]?.[c + count]?.element === cell.element) {
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
        const cell = grid[r]?.[c];
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
