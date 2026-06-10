import { describe, it, expect, beforeEach } from 'vitest';
import { ResourceSystem } from '../../src/systems/ResourceSystem';

describe('ResourceSystem', () => {
  let system: ResourceSystem;

  beforeEach(() => {
    system = new ResourceSystem();
  });

  it('starts with initial coins', () => {
    expect(system.getCoins()).toBe(200);
  });

  it('adds coins', () => {
    system.addCoins(50);
    expect(system.getCoins()).toBe(250);
  });

  it('spends coins if sufficient', () => {
    expect(system.spendCoins(50)).toBe(true);
    expect(system.getCoins()).toBe(150);
  });

  it('refuses to spend if insufficient', () => {
    expect(system.spendCoins(999)).toBe(false);
    expect(system.getCoins()).toBe(200);
  });

  it('tracks fragments', () => {
    system.addFragments('cat', 3);
    expect(system.getFragments('cat')).toBe(3);
  });

  it('spends fragments', () => {
    system.addFragments('dog', 5);
    expect(system.spendFragments('dog', 3)).toBe(true);
    expect(system.getFragments('dog')).toBe(2);
  });
});
