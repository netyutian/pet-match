import type { Board } from '../core/Board';
import type { Position, Cell, SpecialType } from '../types';
import { BOARD_SIZE, BORDER_COLORS } from '../constants';

export class BoardRenderer {
  private container: HTMLElement;
  private board: Board | null = null;
  private swapHandler: ((from: Position, to: Position) => void) | null = null;
  private specialTapHandler: ((pos: Position) => void) | null = null;
  private gridEl: HTMLElement | null = null;
  private cells: HTMLElement[][] = [];

  // Drag state
  private dragStartPos: Position | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private hintedCell: HTMLElement | null = null;

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
    this.gridEl.style.width = '100%';
    this.gridEl.style.aspectRatio = '1';
    this.gridEl.style.touchAction = 'none'; // prevent browser scroll
    this.container.appendChild(this.gridEl);
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
    cellEl.style.display = 'flex';
    cellEl.style.alignItems = 'center';
    cellEl.style.justifyContent = 'center';
    cellEl.style.cursor = 'grab';
    cellEl.style.userSelect = 'none';
    cellEl.style.transition = 'transform 0.15s ease';
    cellEl.style.setProperty('-webkit-tap-highlight-color', 'transparent');

    return cellEl;
  }

  private bindGlobalEvents(): void {
    // Start drag on grid (captures events from cells via bubbling)
    const startHandler = (e: MouseEvent | TouchEvent): void => {
      const cell = this.getCellFromEvent(e);
      if (!cell) return;

      const pos = this.getCellPosition(cell);
      if (!pos) return;

      const point = this.getEventPoint(e);
      this.dragStartPos = pos;
      this.dragStartX = point.x;
      this.dragStartY = point.y;

      // Slight visual feedback on pressed cell
      cell.style.transform = 'scale(0.92)';
    };

    this.gridEl!.addEventListener('mousedown', startHandler);
    this.gridEl!.addEventListener('touchstart', startHandler, { passive: false });

    // Move - detect swipe direction and show hint
    const moveHandler = (e: MouseEvent | TouchEvent): void => {
      if (!this.dragStartPos) return;
      e.preventDefault(); // prevent page scroll on mobile

      const point = this.getEventPoint(e);
      const dx = point.x - this.dragStartX;
      const dy = point.y - this.dragStartY;

      const direction = this.resolveDirection(dx, dy);
      if (!direction) {
        this.clearDragHint();
        return;
      }

      const targetPos: Position = {
        row: this.dragStartPos.row + direction.dr,
        col: this.dragStartPos.col + direction.dc,
      };

      if (!this.isInBounds(targetPos)) {
        this.clearDragHint();
        return;
      }

      const targetCell = this.cells[targetPos.row]?.[targetPos.col];
      if (targetCell) {
        this.showHint(targetCell);
      }
    };

    this.gridEl!.addEventListener('mousemove', moveHandler);
    this.gridEl!.addEventListener('touchmove', moveHandler, { passive: false });

    // End drag - perform swap if direction is clear
    const endHandler = (e: MouseEvent | TouchEvent): void => {
      if (!this.dragStartPos) return;

      const point = this.getEventPoint(e);
      const dx = point.x - this.dragStartX;
      const dy = point.y - this.dragStartY;

      // Reset pressed cell visual
      const fromCell = this.cells[this.dragStartPos.row]?.[this.dragStartPos.col];
      if (fromCell) {
        fromCell.style.transform = '';
      }
      this.clearDragHint();

      const direction = this.resolveDirection(dx, dy);
      if (direction) {
        const targetPos: Position = {
          row: this.dragStartPos.row + direction.dr,
          col: this.dragStartPos.col + direction.dc,
        };
        if (this.isInBounds(targetPos)) {
          this.swapHandler?.(this.dragStartPos, targetPos);
        }
      } else {
        // No drag direction → it's a tap. If the tapped cell is a special, fire it.
        const cell = this.board?.getCell(
          this.dragStartPos.row,
          this.dragStartPos.col
        );
        if (cell && cell.special !== 'none' && !cell.obstacle) {
          this.specialTapHandler?.(this.dragStartPos);
        }
      }

      this.dragStartPos = null;
    };

    document.addEventListener('mouseup', endHandler);
    document.addEventListener('touchend', endHandler);
    document.addEventListener('touchcancel', endHandler);
  }

  private getEventPoint(e: MouseEvent | TouchEvent): { x: number; y: number } {
    if ('changedTouches' in e) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  private getCellFromEvent(e: MouseEvent | TouchEvent): HTMLElement | null {
    if ('changedTouches' in e) {
      const touch = e.changedTouches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      return el instanceof HTMLElement ? el.closest('.board-cell') as HTMLElement : null;
    }
    const target = (e.target as HTMLElement).closest('.board-cell');
    return target instanceof HTMLElement ? target : null;
  }

  private getCellPosition(cellEl: HTMLElement): Position | null {
    const row = parseInt(cellEl.dataset.row ?? '', 10);
    const col = parseInt(cellEl.dataset.col ?? '', 10);
    if (Number.isNaN(row) || Number.isNaN(col)) return null;
    return { row, col };
  }

  private getSwipeThreshold(): number {
    const cell = this.cells[0]?.[0];
    if (!cell) return 24;
    return cell.getBoundingClientRect().width * 0.3;
  }

  private resolveDirection(dx: number, dy: number): { dr: number; dc: number } | null {
    const threshold = this.getSwipeThreshold();
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return null;

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? { dr: 0, dc: 1 } : { dr: 0, dc: -1 };
    } else {
      return dy > 0 ? { dr: 1, dc: 0 } : { dr: -1, dc: 0 };
    }
  }

  private isInBounds(pos: Position): boolean {
    return pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE;
  }

  private showHint(cellEl: HTMLElement): void {
    if (this.hintedCell === cellEl) return;
    this.clearDragHint();
    this.hintedCell = cellEl;
    cellEl.style.transform = 'scale(1.05)';
    cellEl.style.boxShadow = '0 0 0 3px rgba(255,143,163,0.6)';
  }

  private clearDragHint(): void {
    if (this.hintedCell) {
      this.hintedCell.style.transform = '';
      this.hintedCell.style.boxShadow = 'none';
      this.hintedCell = null;
    }
  }

  // Animation helpers
  markEliminating(positions: Position[]): void {
    for (const pos of positions) {
      const el = this.cells[pos.row]?.[pos.col];
      if (el) {
        el.classList.add('eliminating');
      }
    }
  }

  markFalling(positions: Position[]): void {
    for (const pos of positions) {
      const el = this.cells[pos.row]?.[pos.col];
      if (el) {
        el.classList.add('falling');
      }
    }
  }

  clearAnimations(): void {
    for (const row of this.cells) {
      for (const el of row) {
        el.classList.remove('eliminating', 'falling', 'hint', 'bomb-spawn', 'bomb-detonate');
      }
    }
  }

  // Hint for idle players
  markHint(positions: Position[]): void {
    for (const pos of positions) {
      const el = this.cells[pos.row]?.[pos.col];
      if (el) {
        el.classList.add('hint');
      }
    }
  }

  clearHint(): void {
    for (const row of this.cells) {
      for (const el of row) {
        el.classList.remove('hint');
      }
    }
  }

  markTarget(positions: Position[]): void {
    for (const pos of positions) {
      const el = this.cells[pos.row]?.[pos.col];
      if (el) {
        el.classList.add('target');
      }
    }
  }

  clearTarget(): void {
    for (const row of this.cells) {
      for (const el of row) {
        el.classList.remove('target');
      }
    }
  }

  showFloatingText(pos: Position, text: string): void {
    const cellEl = this.cells[pos.row]?.[pos.col];
    if (!cellEl) return;

    const floatEl = document.createElement('div');
    floatEl.className = 'floating-text';
    floatEl.innerHTML = text;

    const rect = cellEl.getBoundingClientRect();
    const gridRect = this.gridEl!.getBoundingClientRect();
    floatEl.style.left = `${rect.left - gridRect.left + rect.width / 2}px`;
    floatEl.style.top = `${rect.top - gridRect.top}px`;

    this.gridEl!.appendChild(floatEl);
    setTimeout(() => floatEl.remove(), 800);
  }

  setSwapHandler(handler: (from: Position, to: Position) => void): void {
    this.swapHandler = handler;
  }

  setSpecialTapHandler(handler: (pos: Position) => void): void {
    this.specialTapHandler = handler;
  }

  markBombSpawn(positions: Position[]): void {
    for (const pos of positions) {
      const el = this.cells[pos.row]?.[pos.col];
      if (el) {
        el.classList.remove('bomb-spawn');
        // Force reflow so the animation can replay
        void el.offsetWidth;
        el.classList.add('bomb-spawn');
      }
    }
  }

  markBombDetonate(pos: Position): void {
    const el = this.cells[pos.row]?.[pos.col];
    if (el) {
      el.classList.add('bomb-detonate');
    }
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
    cellEl.classList.remove('special-bomb');
    if (!cell) {
      cellEl.style.backgroundImage = 'none';
      cellEl.textContent = '';
      cellEl.style.backgroundColor = 'transparent';
      cellEl.style.borderColor = 'transparent';
      cellEl.style.boxShadow = 'none';
      return;
    }

    if (cell.obstacle) {
      cellEl.style.backgroundImage = 'none';
      cellEl.style.backgroundColor = 'transparent';
      cellEl.style.borderColor = 'transparent';
      cellEl.style.boxShadow = 'none';
      cellEl.style.display = 'flex';
      cellEl.style.alignItems = 'center';
      cellEl.style.justifyContent = 'center';
      if (cell.obstacle === 'wood') {
        cellEl.style.backgroundColor = '#8B4513';
        cellEl.style.borderRadius = '8px';
        cellEl.style.border = '2px solid #A0522D';
        cellEl.textContent = '🪵';
        cellEl.style.fontSize = '28px';
      } else if (cell.obstacle === 'ice') {
        cellEl.style.backgroundColor = 'rgba(173, 216, 230, 0.6)';
        cellEl.style.border = '2px solid #87CEEB';
        cellEl.style.borderRadius = '12px';
        cellEl.textContent = '🧊';
        cellEl.style.fontSize = '28px';
      }
      return;
    }

    cellEl.style.backgroundImage = `url('./assets/avatars/${cell.element}.png')`;
    cellEl.style.backgroundSize = '112%';
    cellEl.style.backgroundRepeat = 'no-repeat';
    cellEl.style.backgroundPosition = 'center';
    cellEl.style.backgroundColor = '#fff';
    cellEl.textContent = '';
    cellEl.style.borderColor = this.getBorderColorForSpecial(cell.special) ?? BORDER_COLORS[cell.element];

    if (cell.special === 'bomb') {
      cellEl.classList.add('special-bomb');
    }
  }

  private getBorderColorForSpecial(special: SpecialType): string | null {
    switch (special) {
      case 'line_h':
      case 'line_v':
        return '#4444FF';
      case 'bomb':
        return '#FF4444';
      default:
        return null;
    }
  }
}
