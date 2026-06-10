import type { Cell, Position } from '../types';
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
