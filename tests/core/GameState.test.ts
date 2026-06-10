import { describe, it, expect } from 'vitest';
import { GameState } from '../../src/core/GameState';
import type { LevelConfig } from '../../src/types';

describe('GameState', () => {
  const sampleLevel: LevelConfig = {
    id: 1,
    type: 'score',
    goal: { type: 'score', target: 1000 },
    moves: 20,
  };

  it('initializes with correct moves and zero score', () => {
    const state = new GameState(sampleLevel);
    expect(state.getScore()).toBe(0);
    expect(state.getMovesLeft()).toBe(20);
    expect(state.getStatus()).toBe('playing');
  });

  it('detects win when score goal reached', () => {
    const state = new GameState(sampleLevel);
    state.addScore(1000);
    expect(state.getStatus()).toBe('won');
  });

  it('detects loss when moves run out without goal', () => {
    const state = new GameState(sampleLevel);
    for (let i = 0; i < 20; i++) {
      state.useMove();
    }
    expect(state.getStatus()).toBe('lost');
  });

  it('awards 3 stars for high score', () => {
    const state = new GameState(sampleLevel);
    state.addScore(2500);
    expect(state.getStars()).toBe(3);
  });
});
