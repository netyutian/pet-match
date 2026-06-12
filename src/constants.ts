import type { ElementType, PetData, FurnitureItem } from './types';

export const BOARD_SIZE = 8;

export const ELEMENTS: ElementType[] = ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'];

export const COLORS: Record<ElementType, string> = {
  rat: '#FFB6C1',
  ox: '#87CEEB',
  tiger: '#FFA07A',
  rabbit: '#98FB98',
  dragon: '#DEB887',
  snake: '#F0E68C',
  horse: '#DDA0DD',
  goat: '#B0E0E6',
  monkey: '#FFD700',
  rooster: '#FF6347',
  dog: '#90EE90',
  pig: '#FFC0CB',
};

export const ELEMENT_EMOJI: Record<ElementType, string> = {
  rat: '🐭',
  ox: '🐮',
  tiger: '🐯',
  rabbit: '🐰',
  dragon: '🐲',
  snake: '🐍',
  horse: '🐴',
  goat: '🐐',
  monkey: '🐵',
  rooster: '🐔',
  dog: '🐶',
  pig: '🐷',
};

export const INITIAL_COINS = 200;

export const PET_COST_FRAGMENTS = 12;

export const PET_DATA: Record<string, PetData> = {
  cat: { id: 'cat', species: '橘猫', favoriteFood: '鱼干', maxIntimacy: 100 },
  dog: { id: 'dog', species: '柴犬', favoriteFood: '骨头', maxIntimacy: 100 },
  rabbit: { id: 'rabbit', species: '白兔', favoriteFood: '胡萝卜', maxIntimacy: 100 },
};

export const PET_CLOTHES: Record<string, string[]> = {
  cat: ['围巾', '帽子'],
  dog: ['项圈', '披风'],
  rabbit: ['蝴蝶结', '花环'],
};

export const FURNITURE_DATA: FurnitureItem[] = [
  { id: 'sofa', name: '小沙发', price: 50, roomType: 'living', category: '座椅' },
  { id: 'lamp', name: '蘑菇灯', price: 30, roomType: 'living', category: '灯具' },
  { id: 'table', name: '圆木桌', price: 40, roomType: 'living', category: '桌子' },
  { id: 'bed', name: '软床', price: 60, roomType: 'bedroom', category: '床' },
  { id: 'nightstand', name: '床头柜', price: 35, roomType: 'bedroom', category: '柜子' },
];

export const ROOMS = [
  { id: 'living', name: '客厅', unlockLevel: 1 },
  { id: 'bedroom', name: '卧室', unlockLevel: 8 },
];
