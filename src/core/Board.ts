import type { Cell, Position, ObstacleType } from '../types';
import { BOARD_SIZE, ELEMENTS } from '../constants';

export class Board {
  private grid: (Cell | null)[][];
  private preferredElement: string | undefined;
  private preferredChance = 0.5;
  private activeElements: string[];
  private obstacles: Map<string, { type: ObstacleType; hits: number }> = new Map();

  constructor() {
    this.activeElements = this.pickActiveElements();
    this.grid = this.createGrid();
  }

  setPreferredElement(element: string | undefined, chance?: number): void {
    this.preferredElement = element;
    this.preferredChance = chance ?? 0.5;
    this.activeElements = this.pickActiveElements();
    this.grid = this.createGrid();
  }

  setObstacles(obstacles?: { type: ObstacleType; positions: Position[] }[]): void {
    this.obstacles.clear();
    if (!obstacles) return;
    for (const obs of obstacles) {
      for (const pos of obs.positions) {
        this.obstacles.set(`${pos.row},${pos.col}`, { type: obs.type, hits: 0 });
      }
    }
    this.grid = this.createGrid();
  }

  hitObstacle(row: number, col: number): boolean {
    const key = `${row},${col}`;
    const obs = this.obstacles.get(key);
    if (!obs) return false;
    if (obs.type === 'ice') {
      obs.hits++;
      if (obs.hits >= 2) {
        this.obstacles.delete(key);
        return true;
      }
      return false;
    }
    this.obstacles.delete(key);
    return true;
  }

  getObstacle(row: number, col: number): ObstacleType | undefined {
    return this.obstacles.get(`${row},${col}`)?.type;
  }

  private pickActiveElements(): string[] {
    const pool = [...ELEMENTS];
    const selected: string[] = [];
    if (this.preferredElement) {
      const idx = pool.indexOf(this.preferredElement as any);
      if (idx > -1) {
        selected.push(pool.splice(idx, 1)[0]);
      }
    }
    while (selected.length < 8 && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      selected.push(pool.splice(idx, 1)[0]);
    }
    return selected;
  }

  private pickElement(): string {
    if (this.preferredElement && Math.random() < this.preferredChance) {
      return this.preferredElement;
    }
    return this.activeElements[Math.floor(Math.random() * this.activeElements.length)];
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
    const obstacle = this.obstacles.get(`${row},${col}`);
    if (obstacle) {
      return { element: 'rat' as any, special: 'none', obstacle: obstacle.type };
    }
    const available = [...ELEMENTS];
    let attempts = 0;
    while (attempts < 100) {
      const element = this.pickElement();
      const cell: Cell = { element: element as any, special: 'none' };
      if (!this.createsMatch(grid, row, col, cell)) {
        return cell;
      }
      const idx = available.indexOf(element as any);
      if (idx > -1) available.splice(idx, 1);
      attempts++;
    }
    return { element: available[0] ?? ELEMENTS[0], special: 'none' };
  }

  private createsMatch(grid: (Cell | null)[][], row: number, col: number, cell: Cell): boolean {
    if (col >= 2) {
      const left1 = grid[row][col - 1];
      const left2 = grid[row][col - 2];
      if (left1 && left2 && left1.element === cell.element && left2.element === cell.element) {
        return true;
      }
    }
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
        const cell = this.grid[r][c];
        if (cell !== null) {
          if (cell.obstacle) {
            continue;
          }
          if (writeRow !== r) {
            this.grid[writeRow][c] = cell;
            this.grid[r][c] = null;
          }
          writeRow--;
        }
      }
      for (let r = writeRow; r >= 0; r--) {
        if (this.obstacles.has(`${r},${c}`)) {
          this.grid[r][c] = { element: 'rat' as any, special: 'none', obstacle: this.obstacles.get(`${r},${c}`)!.type };
          continue;
        }
        this.grid[r][c] = {
          element: this.pickElement() as any,
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

  shuffle(): void {
    this.grid = this.createGrid();
  }
}
