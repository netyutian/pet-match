import { describe, it, expect, vi } from 'vitest';
import { LevelSelectScreen } from '../../src/ui/LevelSelectScreen';

describe('LevelSelectScreen', () => {
  it('renders all 20 level nodes', () => {
    const screen = new LevelSelectScreen(1, {}, vi.fn());
    const nodes = screen.getElement().querySelectorAll('.level-node');
    expect(nodes.length).toBe(20);
  });

  it('renders unlocked nodes without locked class', () => {
    const screen = new LevelSelectScreen(3, {}, vi.fn());
    const nodes = screen.getElement().querySelectorAll('.level-node');
    const node1 = nodes[0] as HTMLElement;
    const node3 = nodes[2] as HTMLElement;
    expect(node1.classList.contains('locked')).toBe(false);
    expect(node3.classList.contains('locked')).toBe(false);
  });

  it('renders locked nodes with locked class', () => {
    const screen = new LevelSelectScreen(2, {}, vi.fn());
    const nodes = screen.getElement().querySelectorAll('.level-node');
    const node3 = nodes[2] as HTMLElement;
    expect(node3.classList.contains('locked')).toBe(true);
  });

  it('renders correct avatar src for each level', () => {
    const screen = new LevelSelectScreen(1, {}, vi.fn());
    const nodes = screen.getElement().querySelectorAll('.level-node');
    const img1 = nodes[0].querySelector('img') as HTMLImageElement;
    const img2 = nodes[1].querySelector('img') as HTMLImageElement;
    expect(img1.src).toContain('/assets/avatars/rat.png');
    expect(img2.src).toContain('/assets/avatars/dog.png');
  });

  it('renders stars for completed levels', () => {
    const screen = new LevelSelectScreen(2, { 1: 3, 2: 1 }, vi.fn());
    const nodes = screen.getElement().querySelectorAll('.level-node');
    const stars1 = nodes[0].querySelectorAll('.star');
    expect(stars1.length).toBe(3);
    const stars2 = nodes[1].querySelectorAll('.star');
    expect(stars2.length).toBe(1);
  });

  it('hides stars for 0-star levels', () => {
    const screen = new LevelSelectScreen(1, {}, vi.fn());
    const nodes = screen.getElement().querySelectorAll('.level-node');
    const stars = nodes[0].querySelectorAll('.star');
    expect(stars.length).toBe(0);
  });

  it('calls onSelect when unlocked node is clicked', () => {
    const onSelect = vi.fn();
    const screen = new LevelSelectScreen(2, {}, onSelect);
    const nodes = screen.getElement().querySelectorAll('.level-node');
    const node1 = nodes[0] as HTMLElement;
    node1.click();
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('does not call onSelect when locked node is clicked', () => {
    const onSelect = vi.fn();
    const screen = new LevelSelectScreen(1, {}, onSelect);
    const nodes = screen.getElement().querySelectorAll('.level-node');
    const node2 = nodes[1] as HTMLElement;
    node2.click();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders back button', () => {
    const screen = new LevelSelectScreen(1, {}, vi.fn());
    const backBtn = screen.getElement().querySelector('.level-back-btn');
    expect(backBtn).not.toBeNull();
  });

  it('calls onSelect(0) when back button is clicked', () => {
    const onSelect = vi.fn();
    const screen = new LevelSelectScreen(1, {}, onSelect);
    const backBtn = screen.getElement().querySelector('.level-back-btn') as HTMLElement;
    backBtn.click();
    expect(onSelect).toHaveBeenCalledWith(0);
  });

  it('update() re-renders with new state', () => {
    const onSelect = vi.fn();
    const screen = new LevelSelectScreen(1, {}, onSelect);
    screen.update(2, { 1: 3 });
    const nodes = screen.getElement().querySelectorAll('.level-node');
    const node2 = nodes[1] as HTMLElement;
    expect(node2.classList.contains('locked')).toBe(false);
    const stars = nodes[0].querySelectorAll('.star');
    expect(stars.length).toBe(3);
  });
});
