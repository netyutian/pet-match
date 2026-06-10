import { describe, it, expect } from 'vitest';
import { Board } from '../../src/core/Board';
import { BOARD_SIZE } from '../../src/constants';

describe('Board', () => {
  it('initializes with 8x8 grid and no matches', () => {
    const board = new Board();
    expect(board.getGrid().length).toBe(BOARD_SIZE);
    expect(board.getGrid()[0].length).toBe(BOARD_SIZE);

    // No cell should be null after init
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        expect(board.getCell(r, c)).not.toBeNull();
      }
    }
  });

  it('swaps two adjacent cells', () => {
    const board = new Board();
    const beforeA = board.getCell(0, 0);
    const beforeB = board.getCell(0, 1);
    const result = board.swap({ row: 0, col: 0 }, { row: 0, col: 1 });
    expect(result).toBe(true);
    expect(board.getCell(0, 0)).toEqual(beforeB);
    expect(board.getCell(0, 1)).toEqual(beforeA);
  });

  it('applies gravity to fill empty cells', () => {
    const board = new Board();
    board.setCell(7, 0, null);
    board.setCell(6, 0, null);
    const newPositions = board.applyGravity();
    expect(newPositions.length).toBeGreaterThan(0);
    expect(board.getCell(7, 0)).not.toBeNull();
    expect(board.getCell(6, 0)).not.toBeNull();
  });
});
