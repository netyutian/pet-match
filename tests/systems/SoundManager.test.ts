import { describe, it, expect } from 'vitest';
import { SoundManager } from '../../src/systems/SoundManager';

describe('SoundManager', () => {
  it('has playBigClear method', () => {
    const sound = new SoundManager();
    expect(typeof sound.playBigClear).toBe('function');
  });
});
