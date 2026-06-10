import type { LevelConfig } from '../types';

export const LEVELS: LevelConfig[] = [
  // Intro: score only
  { id: 1, type: 'score', goal: { type: 'score', target: 500 }, moves: 25 },
  { id: 2, type: 'score', goal: { type: 'score', target: 700 }, moves: 25 },
  { id: 3, type: 'score', goal: { type: 'score', target: 900 }, moves: 24 },
  // Intro: collect
  { id: 4, type: 'collect', goal: { type: 'collect', target: 15, element: 'cat' }, moves: 25 },
  { id: 5, type: 'collect', goal: { type: 'collect', target: 15, element: 'dog' }, moves: 24 },
  { id: 6, type: 'collect', goal: { type: 'collect', target: 20, element: 'rabbit' }, moves: 25 },
  // Mix
  { id: 7, type: 'score', goal: { type: 'score', target: 1200 }, moves: 24 },
  { id: 8, type: 'collect', goal: { type: 'collect', target: 20, element: 'bear' }, moves: 25 },
  { id: 9, type: 'score', goal: { type: 'score', target: 1400 }, moves: 24 },
  // Review before obstacles
  { id: 10, type: 'score', goal: { type: 'score', target: 1500 }, moves: 23 },
  // Wood obstacles introduced
  {
    id: 11, type: 'clear',
    goal: { type: 'clear', target: 5 },
    moves: 25,
    obstacles: [
      { type: 'wood', positions: [{ row: 3, col: 3 }, { row: 3, col: 4 }, { row: 4, col: 3 }, { row: 4, col: 4 }, { row: 5, col: 5 }] },
    ],
  },
  { id: 12, type: 'score', goal: { type: 'score', target: 1600 }, moves: 24, obstacles: [{ type: 'wood', positions: [{ row: 2, col: 2 }, { row: 6, col: 6 }] }] },
  { id: 13, type: 'collect', goal: { type: 'collect', target: 20, element: 'bird' }, moves: 25, obstacles: [{ type: 'wood', positions: [{ row: 0, col: 0 }, { row: 7, col: 7 }] }] },
  { id: 14, type: 'score', goal: { type: 'score', target: 1800 }, moves: 24 },
  { id: 15, type: 'clear', goal: { type: 'clear', target: 8 }, moves: 26, obstacles: [{ type: 'wood', positions: [{ row: 3, col: 2 }, { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 3, col: 5 }, { row: 4, col: 2 }, { row: 4, col: 3 }, { row: 4, col: 4 }, { row: 4, col: 5 }] }] },
  { id: 16, type: 'collect', goal: { type: 'collect', target: 25, element: 'hamster' }, moves: 25 },
  { id: 17, type: 'score', goal: { type: 'score', target: 2000 }, moves: 24 },
  { id: 18, type: 'clear', goal: { type: 'clear', target: 6 }, moves: 25, obstacles: [{ type: 'wood', positions: [{ row: 1, col: 1 }, { row: 1, col: 6 }, { row: 6, col: 1 }, { row: 6, col: 6 }, { row: 3, col: 3 }, { row: 4, col: 4 }] }] },
  { id: 19, type: 'score', goal: { type: 'score', target: 2200 }, moves: 23 },
  { id: 20, type: 'collect', goal: { type: 'collect', target: 30, element: 'cat' }, moves: 25 },
];

export function getLevel(id: number): LevelConfig | undefined {
  return LEVELS.find(l => l.id === id);
}
