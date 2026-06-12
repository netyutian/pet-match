import { describe, it, expect, beforeEach } from 'vitest';
import { GameScreen } from '../../src/ui/GameScreen';

describe('GameScreen big clear', () => {
  let screen: GameScreen;

  beforeEach(() => {
    document.body.innerHTML = '';
    screen = new GameScreen(1, () => {});
  });

  it('constructs successfully', () => {
    expect(screen.getElement()).toBeInstanceOf(HTMLElement);
  });
});
