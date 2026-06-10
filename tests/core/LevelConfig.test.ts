import { describe, it, expect } from 'vitest';
import { LEVELS, getLevel } from '../../src/core/LevelConfig';

describe('LevelConfig', () => {
  it('has 20 levels', () => {
    expect(LEVELS.length).toBe(20);
  });

  it('retrieves level by id', () => {
    const level = getLevel(1);
    expect(level).toBeDefined();
    expect(level!.id).toBe(1);
  });

  it('returns undefined for invalid id', () => {
    expect(getLevel(99)).toBeUndefined();
  });
});
