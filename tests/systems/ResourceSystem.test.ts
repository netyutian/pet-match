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
    system.addFragments('rat', 3);
    expect(system.getFragments('rat')).toBe(3);
  });

  it('spends fragments', () => {
    system.addFragments('ox', 5);
    expect(system.spendFragments('ox', 3)).toBe(true);
    expect(system.getFragments('ox')).toBe(2);
  });
});
