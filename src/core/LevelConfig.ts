import type { LevelConfig } from '../types';

export const LEVELS: LevelConfig[] = [
  // 1-5: 入门收集关
  { id: 1, type: 'collect', goal: { type: 'collect', target: 15, element: 'rat' }, moves: 10 },
  { id: 2, type: 'collect', goal: { type: 'collect', target: 18, element: 'dog' }, moves: 10 },
  { id: 3, type: 'collect', goal: { type: 'collect', target: 20, element: 'rabbit' }, moves: 10, obstacles: [{ type: 'wood', positions: [{ row: 3, col: 3 }, { row: 3, col: 4 }, { row: 4, col: 3 }, { row: 4, col: 4 }] }] },
  { id: 4, type: 'collect', goal: { type: 'collect', target: 22, element: 'ox' }, moves: 10 },
  { id: 5, type: 'collect', goal: { type: 'collect', target: 25, element: 'rooster' }, moves: 10, obstacles: [{ type: 'wood', positions: [{ row: 2, col: 2 }, { row: 2, col: 5 }, { row: 5, col: 2 }, { row: 5, col: 5 }] }] },
  // 6-10: 分数关 + 密集障碍
  { id: 6, type: 'score', goal: { type: 'score', target: 800 }, moves: 25 },
  { id: 7, type: 'collect', goal: { type: 'collect', target: 25, element: 'pig' }, moves: 14, obstacles: [{ type: 'wood', positions: [{ row: 1, col: 1 }, { row: 1, col: 6 }, { row: 6, col: 1 }, { row: 6, col: 6 }, { row: 3, col: 3 }, { row: 4, col: 4 }] }] },
  { id: 8, type: 'collect', goal: { type: 'collect', target: 28, element: 'rat' }, moves: 14, obstacles: [{ type: 'wood', positions: [{ row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 }, { row: 2, col: 5 }, { row: 5, col: 2 }, { row: 5, col: 3 }, { row: 5, col: 4 }, { row: 5, col: 5 }] }] },
  { id: 9, type: 'score', goal: { type: 'score', target: 800 }, moves: 25, obstacles: [{ type: 'ice', positions: [{ row: 3, col: 3 }, { row: 3, col: 4 }, { row: 4, col: 3 }, { row: 4, col: 4 }] }] },
  { id: 10, type: 'collect', goal: { type: 'collect', target: 30, element: 'ox' }, moves: 14, obstacles: [{ type: 'wood', positions: [{ row: 1, col: 1 }, { row: 1, col: 6 }, { row: 6, col: 1 }, { row: 6, col: 6 }, { row: 3, col: 3 }, { row: 4, col: 4 }] }] },
  // 11-15: 清除障碍 + 高难收集
  { id: 11, type: 'clear', goal: { type: 'clear', target: 6 }, moves: 25, obstacles: [{ type: 'wood', positions: [{ row: 2, col: 2 }, { row: 2, col: 5 }, { row: 5, col: 2 }, { row: 5, col: 5 }, { row: 3, col: 3 }, { row: 4, col: 4 }] }] },
  { id: 12, type: 'collect', goal: { type: 'collect', target: 32, element: 'rooster' }, moves: 15, obstacles: [{ type: 'wood', positions: [{ row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 5 }, { row: 1, col: 6 }, { row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 5 }, { row: 6, col: 6 }] }] },
  { id: 13, type: 'clear', goal: { type: 'clear', target: 4 }, moves: 22, obstacles: [{ type: 'ice', positions: [{ row: 0, col: 0 }, { row: 0, col: 7 }, { row: 7, col: 0 }, { row: 7, col: 7 }, { row: 3, col: 3 }, { row: 4, col: 4 }] }] },
  { id: 14, type: 'collect', goal: { type: 'collect', target: 35, element: 'dog' }, moves: 18, obstacles: [{ type: 'wood', positions: [{ row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 }, { row: 2, col: 5 }, { row: 3, col: 2 }, { row: 3, col: 5 }, { row: 4, col: 2 }, { row: 4, col: 5 }, { row: 5, col: 2 }, { row: 5, col: 3 }, { row: 5, col: 4 }, { row: 5, col: 5 }] }] },
  { id: 15, type: 'score', goal: { type: 'score', target: 900 }, moves: 25, obstacles: [{ type: 'ice', positions: [{ row: 1, col: 1 }, { row: 1, col: 6 }, { row: 6, col: 1 }, { row: 6, col: 6 }, { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 4, col: 3 }, { row: 4, col: 4 }] }] },
  // 16-20: 极限难度
  { id: 16, type: 'collect', goal: { type: 'collect', target: 38, element: 'tiger' }, moves: 23, obstacles: [{ type: 'wood', positions: [{ row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 5 }, { row: 1, col: 6 }, { row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 5 }, { row: 6, col: 6 }] }, { type: 'ice', positions: [{ row: 3, col: 3 }, { row: 3, col: 4 }, { row: 4, col: 3 }, { row: 4, col: 4 }] }] },
  { id: 17, type: 'clear', goal: { type: 'clear', target: 5 }, moves: 22, obstacles: [{ type: 'ice', positions: [{ row: 0, col: 0 }, { row: 0, col: 7 }, { row: 7, col: 0 }, { row: 7, col: 7 }, { row: 2, col: 2 }, { row: 2, col: 5 }, { row: 5, col: 2 }, { row: 5, col: 5 }] }] },
  { id: 18, type: 'score', goal: { type: 'score', target: 900 }, moves: 25, obstacles: [{ type: 'wood', positions: [{ row: 1, col: 1 }, { row: 1, col: 6 }, { row: 6, col: 1 }, { row: 6, col: 6 }, { row: 3, col: 3 }, { row: 4, col: 4 }] }] },
  { id: 19, type: 'collect', goal: { type: 'collect', target: 40, element: 'dragon' }, moves: 26, obstacles: [{ type: 'ice', positions: [{ row: 2, col: 2 }, { row: 2, col: 5 }, { row: 5, col: 2 }, { row: 5, col: 5 }, { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 4, col: 3 }, { row: 4, col: 4 }] }] },
  { id: 20, type: 'clear', goal: { type: 'clear', target: 6 }, moves: 25, obstacles: [{ type: 'wood', positions: [{ row: 1, col: 1 }, { row: 1, col: 6 }, { row: 6, col: 1 }, { row: 6, col: 6 }] }, { type: 'ice', positions: [{ row: 2, col: 2 }, { row: 2, col: 5 }, { row: 5, col: 2 }, { row: 5, col: 5 }, { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 4, col: 3 }, { row: 4, col: 4 }] }] },
];

export function getLevel(id: number): LevelConfig | undefined {
  return LEVELS.find(l => l.id === id);
}
