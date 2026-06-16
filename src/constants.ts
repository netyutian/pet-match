import type { ElementType, PetData, FurnitureItem } from './types';

export const BOARD_SIZE = 8;

export const ELEMENTS: ElementType[] = ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'];

export const BORDER_COLORS: Record<ElementType, string> = {
  rat: '#8BC34A',
  ox: '#42A5F5',
  tiger: '#FFA726',
  rabbit: '#F06292',
  dragon: '#FFCA28',
  snake: '#AB47BC',
  horse: '#26C6DA',
  goat: '#FFCA28',
  monkey: '#8BC34A',
  rooster: '#EF5350',
  dog: '#42A5F5',
  pig: '#F06292',
};

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

export const ELEMENT_NAMES: Record<ElementType, string> = {
  rat: '鼠',
  ox: '牛',
  tiger: '虎',
  rabbit: '兔',
  dragon: '龙',
  snake: '蛇',
  horse: '马',
  goat: '羊',
  monkey: '猴',
  rooster: '鸡',
  dog: '狗',
  pig: '猪',
};

export const INITIAL_COINS = 200;

export const PET_COST_FRAGMENTS = 12;

export const PET_DATA: Record<string, PetData> = {
  rat: { id: 'rat', species: '小鼠', favoriteFood: '奶酪', maxIntimacy: 100 },
  ox: { id: 'ox', species: '小牛', favoriteFood: '青草', maxIntimacy: 100 },
  tiger: { id: 'tiger', species: '小老虎', favoriteFood: '肉干', maxIntimacy: 100 },
  rabbit: { id: 'rabbit', species: '小兔', favoriteFood: '胡萝卜', maxIntimacy: 100 },
  dragon: { id: 'dragon', species: '小龙', favoriteFood: '龙珠糖', maxIntimacy: 100 },
  snake: { id: 'snake', species: '小蛇', favoriteFood: '鸡蛋', maxIntimacy: 100 },
  horse: { id: 'horse', species: '小马', favoriteFood: '苹果', maxIntimacy: 100 },
  goat: { id: 'goat', species: '小羊', favoriteFood: '青菜', maxIntimacy: 100 },
  monkey: { id: 'monkey', species: '小猴', favoriteFood: '香蕉', maxIntimacy: 100 },
  rooster: { id: 'rooster', species: '小鸡', favoriteFood: '米粒', maxIntimacy: 100 },
  dog: { id: 'dog', species: '小狗', favoriteFood: '骨头', maxIntimacy: 100 },
  pig: { id: 'pig', species: '小猪', favoriteFood: '红薯', maxIntimacy: 100 },
};

export const PET_CLOTHES: Record<string, string[]> = {
  rat: ['小帽子', '围巾'],
  ox: ['牛角环', '披风'],
  tiger: ['虎纹衣', '铃铛'],
  rabbit: ['蝴蝶结', '花环'],
  dragon: ['龙角', '鳞甲'],
  snake: ['蛇纹带', '小草帽'],
  horse: ['马鞍', '马蹄铁'],
  goat: ['羊角饰', '毛绒衣'],
  monkey: ['紧箍', '香蕉背包'],
  rooster: ['鸡冠饰', '羽毛衣'],
  dog: ['项圈', '披风'],
  pig: ['猪鼻子', '围裙'],
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
