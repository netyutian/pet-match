import { describe, it, expect } from 'vitest';
import { MatchEngine } from '../../src/core/MatchEngine';
import type { Cell } from '../../src/types';

function makeCell(element: string): Cell {
  return { element: element as any, special: 'none' };
}

describe('MatchEngine', () => {
  it('finds horizontal match of 3', () => {
    const grid: (Cell | null)[][] = [
      [makeCell('cat'), makeCell('cat'), makeCell('cat'), makeCell('dog')],
      [makeCell('dog'), makeCell('bear'), makeCell('bird'), makeCell('hamster')],
    ];
    const matches = MatchEngine.findMatches(grid);
    expect(matches.length).toBe(1);
    expect(matches[0].positions).toHaveLength(3);
  });

  it('finds vertical match of 3', () => {
    const grid: (Cell | null)[][] = [
      [makeCell('cat'), makeCell('dog')],
      [makeCell('cat'), makeCell('bear')],
      [makeCell('cat'), makeCell('bird')],
    ];
    const matches = MatchEngine.findMatches(grid);
    expect(matches.length).toBe(1);
    expect(matches[0].positions).toHaveLength(3);
  });

  it('returns empty when no matches', () => {
    const grid: (Cell | null)[][] = [
      [makeCell('cat'), makeCell('dog')],
      [makeCell('bear'), makeCell('bird')],
    ];
    const matches = MatchEngine.findMatches(grid);
    expect(matches.length).toBe(0);
  });

  it('detects horizontal 4-match and returns special info', () => {
    const grid: (Cell | null)[][] = [
      [makeCell('cat'), makeCell('cat'), makeCell('cat'), makeCell('cat')],
    ];
    const specials = MatchEngine.findSpecials(grid);
    expect(specials.length).toBe(1);
    expect(specials[0].type).toBe('line_v');
  });

  it('findHint returns null when no valid swap', () => {
    const grid: (Cell | null)[][] = [
      [makeCell('cat'), makeCell('dog'), makeCell('bear')],
      [makeCell('bird'), makeCell('hamster'), makeCell('cat')],
      [makeCell('dog'), makeCell('bear'), makeCell('bird')],
    ];
    const hint = MatchEngine.findHint(grid);
    expect(hint).toBeNull();
  });
});
