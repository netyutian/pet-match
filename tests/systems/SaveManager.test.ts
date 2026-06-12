import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager } from '../../src/systems/SaveManager';
import type { SaveData } from '../../src/types';

const SAVE_KEY = 'pet_match_save';

const sampleSaveData: SaveData = {
  currentLevel: 5,
  levelStars: { 1: 3, 2: 2, 3: 1 },
  coins: 500,
  fragments: { rat: 10, ox: 5 },
  unlockedPets: ['pet1', 'pet2'],
  pets: {
    pet1: {
      id: 'pet1',
      name: 'Momo',
      intimacy: 80,
      unlockedClothes: ['default', 'hat'],
      currentClothes: 'hat',
    },
  },
  rooms: {
    room1: {
      id: 'room1',
      name: 'Living Room',
      unlocked: true,
      furniture: [],
      wallpaper: 'default',
      floor: 'default',
    },
  },
  unlockedFurniture: ['chair', 'table'],
};

describe('SaveManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no save exists', () => {
    const manager = new SaveManager();
    expect(manager.load()).toBeNull();
  });

  it('saves and loads data correctly', () => {
    const manager = new SaveManager();
    manager.save(sampleSaveData);
    expect(manager.load()).toEqual(sampleSaveData);
  });

  it('clears save data', () => {
    const manager = new SaveManager();
    manager.save(sampleSaveData);
    manager.clear();
    expect(manager.load()).toBeNull();
  });

  it('exports and imports save code roundtrip', () => {
    const manager = new SaveManager();
    const code = manager.exportCode(sampleSaveData);
    expect(manager.importCode(code)).toEqual(sampleSaveData);
  });

  it('returns null for invalid import code', () => {
    const manager = new SaveManager();
    expect(manager.importCode('not-valid-base64!!!')).toBeNull();
  });

  it('returns null for malformed JSON in import code', () => {
    const manager = new SaveManager();
    const badCode = btoa(encodeURIComponent('not json'));
    expect(manager.importCode(badCode)).toBeNull();
  });

  it('returns null when localStorage contains invalid JSON', () => {
    localStorage.setItem(SAVE_KEY, 'not json');
    const manager = new SaveManager();
    expect(manager.load()).toBeNull();
  });
});
