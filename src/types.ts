export type ElementType = 'cat' | 'dog' | 'rabbit' | 'bear' | 'bird' | 'hamster';

export type SpecialType = 'none' | 'line_h' | 'line_v' | 'bomb';

export type ObstacleType = 'wood' | 'ice';

export interface Cell {
  element: ElementType;
  special: SpecialType;
  obstacle?: ObstacleType;
}

export interface Position {
  row: number;
  col: number;
}

export interface Match {
  positions: Position[];
  element: ElementType;
}

export type LevelType = 'score' | 'collect' | 'clear';

export interface LevelGoal {
  type: LevelType;
  target: number;
  element?: ElementType;
}

export interface LevelConfig {
  id: number;
  type: LevelType;
  goal: LevelGoal;
  moves: number;
  obstacles?: { type: ObstacleType; positions: Position[] }[];
}

export type GameStatus = 'playing' | 'won' | 'lost';

export interface PetData {
  id: string;
  species: string;
  favoriteFood: string;
  maxIntimacy: number;
}

export interface PetInstance {
  id: string;
  name: string;
  intimacy: number;
  unlockedClothes: string[];
  currentClothes: string;
}

export interface FurnitureItem {
  id: string;
  name: string;
  price: number;
  roomType: string;
  category: string;
}

export interface PlacedFurniture {
  itemId: string;
  row: number;
  col: number;
  rotation: number;
}

export interface RoomData {
  id: string;
  name: string;
  unlocked: boolean;
  furniture: PlacedFurniture[];
  wallpaper: string;
  floor: string;
}

export interface SaveData {
  currentLevel: number;
  levelStars: Record<number, number>;
  coins: number;
  fragments: Record<string, number>;
  unlockedPets: string[];
  pets: Record<string, PetInstance>;
  rooms: Record<string, RoomData>;
  unlockedFurniture: string[];
}
