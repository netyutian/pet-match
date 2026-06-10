import type { Board } from '../core/Board';
import type { Position, Cell, SpecialType } from '../types';
import { BOARD_SIZE, COLORS, ELEMENT_EMOJI } from '../constants';

export class BoardRenderer {
  private container: HTMLElement;
  private board: Board | null = null;
  private swapHandler: ((from: Position, to: Position) => void) | null = null;
  private gridEl: HTMLElement | null = null;
  private cells: HTMLElement[][] = [];
  private dragStart: Position | null = null;
  private activeCell: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.setupContainer();
    this.bindGlobalEvents();
  }

  private setupContainer(): void {
    this.container.classList.add('board-container');
    this.container.innerHTML = '';

    this.gridEl = document.createElement('div');
    this.gridEl.classList.add('board-grid');
    this.gridEl.style.display = 'grid';
    this.gridEl.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 1fr)`;
    this.gridEl.style.gap = '4px';
    this.gridEl.style.maxWidth = '400px';
    this.gridEl.style.width = '100%';
    this.gridEl.style.aspectRatio = '1';
    this.container.appendChild(this.gridEl);
  }

  private bindGlobalEvents(): void {
    const endHandler = (e: MouseEvent | TouchEvent): void => {
      if (!this.dragStart || !this.activeCell) return;

      const target = this.getEventTarget(e);
      if (!target) {
        this.clearDrag();
        return;
      }

      const to = this.getCellPosition(target);
      if (!to) {
        this.clearDrag();
        return;
      }

      if (this.isAdjacent(this.dragStart, to) && !this.isSamePosition(this.dragStart, to)) {
        this.swapHandler?.(this.dragStart, to);
      }

      this.clearDrag();
    };

    document.addEventListener('mouseup', endHandler);
    document.addEventListener('touchend', endHandler);
  }

  private getEventTarget(e: MouseEvent | TouchEvent): HTMLElement | null {
    if ('changedTouches' in e) {
      const touch = e.changedTouches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      return el instanceof HTMLElement ? el.closest('.board-cell') as HTMLElement : null;
    }
    return (e.target as HTMLElement).closest('.board-cell') as HTMLElement;
  }

  private getCellPosition(cellEl: HTMLElement): Position | null {
    const row = parseInt(cellEl.dataset.row ?? '', 10);
    const col = parseInt(cellEl.dataset.col ?? '', 10);
    if (Number.isNaN(row) || Number.isNaN(col)) return null;
    return { row, col };
  }

  private isAdjacent(a: Position, b: Position): boolean {
    const dr = Math.abs(a.row - b.row);
    const dc = Math.abs(a.col - b.col);
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
  }

  private isSamePosition(a: Position, b: Position): boolean {
    return a.row === b.row && a.col === b.col;
  }

  private clearDrag(): void {
    if (this.activeCell) {
      this.activeCell.style.transform = '';
      this.activeCell = null;
    }
    this.dragStart = null;
  }

  setBoard(board: Board): void {
    this.board = board;
    this.cells = [];
    this.gridEl!.innerHTML = '';

    for (let r = 0; r < BOARD_SIZE; r++) {
      const rowCells: HTMLElement[] = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cellEl = this.createCellElement(r, c);
        rowCells.push(cellEl);
        this.gridEl!.appendChild(cellEl);
      }
      this.cells.push(rowCells);
    }

    this.updateFromBoard();
  }

  private createCellElement(row: number, col: number): HTMLElement {
    const cellEl = document.createElement('div');
    cellEl.classList.add('board-cell');
    cellEl.dataset.row = String(row);
    cellEl.dataset.col = String(col);
    cellEl.style.borderRadius = '8px';
    cellEl.style.fontSize = '24px';
    cellEl.style.display = 'flex';
    cellEl.style.alignItems = 'center';
    cellEl.style.justifyContent = 'center';
    cellEl.style.cursor = 'pointer';
    cellEl.style.userSelect = 'none';
    cellEl.style.transition = 'transform 0.1s ease';

    const startHandler = (e: MouseEvent | TouchEvent): void => {
      e.preventDefault();
      this.dragStart = { row, col };
      this.activeCell = cellEl;
      cellEl.style.transform = 'scale(0.9)';
    };

    cellEl.addEventListener('mousedown', startHandler);
    cellEl.addEventListener('touchstart', startHandler, { passive: false });

    return cellEl;
  }

  setSwapHandler(handler: (from: Position, to: Position) => void): void {
    this.swapHandler = handler;
  }

  updateFromBoard(): void {
    if (!this.board) return;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = this.board.getCell(r, c);
        const cellEl = this.cells[r]?.[c];
        if (!cellEl) continue;
        this.renderCell(cellEl, cell);
      }
    }
  }

  private renderCell(cellEl: HTMLElement, cell: Cell | null): void {
    if (!cell) {
      cellEl.style.backgroundColor = 'transparent';
      cellEl.textContent = '';
      cellEl.style.border = 'none';
      return;
    }

    cellEl.style.backgroundColor = COLORS[cell.element];
    cellEl.textContent = ELEMENT_EMOJI[cell.element];
    cellEl.style.border = this.getBorderForSpecial(cell.special);
  }

  private getBorderForSpecial(special: SpecialType): string {
    switch (special) {
      case 'line_h':
      case 'line_v':
        return '3px solid #4444FF';
      case 'bomb':
        return '3px solid #FF4444';
      default:
        return '3px solid transparent';
    }
  }
}
