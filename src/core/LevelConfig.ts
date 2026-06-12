import type { LevelConfig } from '../types';

export const LEVELS: LevelConfig[] = [
  // 新手关：收集目标动物，步数宽裕
  { id: 1, type: 'collect', goal: { type: 'collect', target: 10, element: 'cat' }, moves: 25 },
  { id: 2, type: 'collect', goal: { type: 'collect', target: 12, element: 'dog' }, moves: 25 },
  { id: 3, type: 'collect', goal: { type: 'collect', target: 14, element: 'rabbit' }, moves: 24 },
  { id: 4, type: 'collect', goal: { type: 'collect', target: 14, element: 'bear' }, moves: 25 },
  { id: 5, type: 'collect', goal: { type: 'collect', target: 15, element: 'bird' }, moves: 24 },
  { id: 6, type: 'collect', goal: { type: 'collect', target: 15, element: 'hamster' }, moves: 25 },
  { id: 7, type: 'collect', goal: { type: 'collect', target: 18, element: 'cat' }, moves: 24 },
  { id: 8, type: 'collect', goal: { type: 'collect', target: 18, element: 'dog' }, moves: 25 },
  { id: 9, type: 'collect', goal: { type: 'collect', target: 20, element: 'rabbit' }, moves: 24 },
  { id: 10, type: 'collect', goal: { type: 'collect', target: 20, element: 'bear' }, moves: 23 },
  // 木箱障碍引入
  { id: 11, type: 'collect', goal: { type: 'collect', target: 20, element: 'bird' }, moves: 25, obstacles: [{ type: 'wood', positions: [{ row: 3, col: 3 }, { row: 3, col: 4 }, { row: 4, col: 3 }, { row: 4, col: 4 }, { row: 5, col: 5 }] }] },
  { id: 12, type: 'collect', goal: { type: 'collect', target: 22, element: 'hamster' }, moves: 24, obstacles: [{ type: 'wood', positions: [{ row: 2, col: 2 }, { row: 6, col: 6 }] }] },
  { id: 13, type: 'collect', goal: { type: 'collect', target: 22, element: 'cat' }, moves: 25, obstacles: [{ type: 'wood', positions: [{ row: 0, col: 0 }, { row: 7, col: 7 }] }] },
  { id: 14, type: 'collect', goal: { type: 'collect', target: 25, element: 'dog' }, moves: 24 },
  { id: 15, type: 'collect', goal: { type: 'collect', target: 25, element: 'rabbit' }, moves: 26, obstacles: [{ type: 'wood', positions: [{ row: 3, col: 2 }, { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 3, col: 5 }, { row: 4, col: 2 }, { row: 4, col: 3 }, { row: 4, col: 4 }, { row: 4, col: 5 }] }] },
  { id: 16, type: 'collect', goal: { type: 'collect', target: 25, element: 'bear' }, moves: 25 },
  { id: 17, type: 'collect', goal: { type: 'collect', target: 28, element: 'bird' }, moves: 24 },
  { id: 18, type: 'collect', goal: { type: 'collect', target: 28, element: 'hamster' }, moves: 25, obstacles: [{ type: 'wood', positions: [{ row: 1, col: 1 }, { row: 1, col: 6 }, { row: 6, col: 1 }, { row: 6, col: 6 }, { row: 3, col: 3 }, { row: 4, col: 4 }] }] },
  { id: 19, type: 'collect', goal: { type: 'collect', target: 30, element: 'cat' }, moves: 23 },
  { id: 20, type: 'collect', goal: { type: 'collect', target: 30, element: 'dog' }, moves: 25 },
];

export function getLevel(id: number): LevelConfig | undefined {
  return LEVELS.find(l => l.id === id);
}
