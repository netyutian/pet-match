import { describe, it, expect, beforeEach } from 'vitest';
import { HomeSystem } from '../../src/systems/HomeSystem';

describe('HomeSystem', () => {
  let system: HomeSystem;

  beforeEach(() => {
    system = new HomeSystem();
  });

  it('starts with living room unlocked and bedroom locked', () => {
    expect(system.isRoomUnlocked('living')).toBe(true);
    expect(system.isRoomUnlocked('bedroom')).toBe(false);
  });

  it('unlocks room when currentLevel >= unlockLevel', () => {
    expect(system.unlockRoom('bedroom', 8)).toBe(true);
    expect(system.isRoomUnlocked('bedroom')).toBe(true);
  });

  it('refuses to unlock room when currentLevel < unlockLevel', () => {
    expect(system.unlockRoom('bedroom', 7)).toBe(false);
    expect(system.isRoomUnlocked('bedroom')).toBe(false);
  });

  it('returns all rooms', () => {
    const rooms = system.getRooms();
    expect(rooms).toHaveLength(2);
    expect(rooms.map(r => r.id)).toContain('living');
    expect(rooms.map(r => r.id)).toContain('bedroom');
  });

  it('returns a specific room', () => {
    const room = system.getRoom('living');
    expect(room).toBeDefined();
    expect(room!.id).toBe('living');
  });

  it('returns undefined for unknown room', () => {
    expect(system.getRoom('kitchen')).toBeUndefined();
  });

  it('places and retrieves furniture', () => {
    system.placeFurniture('living', 'sofa', 2, 3, 90);
    const furniture = system.getRoomFurniture('living');
    expect(furniture).toHaveLength(1);
    expect(furniture[0]).toEqual({ itemId: 'sofa', row: 2, col: 3, rotation: 90 });
  });

  it('removes furniture by position', () => {
    system.placeFurniture('living', 'sofa', 2, 3, 0);
    expect(system.removeFurniture('living', 2, 3)).toBe(true);
    expect(system.getRoomFurniture('living')).toHaveLength(0);
  });

  it('returns false when removing furniture at empty position', () => {
    expect(system.removeFurniture('living', 0, 0)).toBe(false);
  });

  it('sets wallpaper and floor', () => {
    system.setWallpaper('living', 'wallpaper_a');
    system.setFloor('living', 'floor_a');
    const room = system.getRoom('living')!;
    expect(room.wallpaper).toBe('wallpaper_a');
    expect(room.floor).toBe('floor_a');
  });

  it('unlocks and checks furniture', () => {
    expect(system.isFurnitureUnlocked('sofa')).toBe(false);
    system.unlockFurniture('sofa');
    expect(system.isFurnitureUnlocked('sofa')).toBe(true);
  });

  it('returns save data', () => {
    system.unlockRoom('bedroom', 8);
    system.placeFurniture('living', 'sofa', 1, 1, 0);
    system.unlockFurniture('sofa');
    const save = system.getSaveData();
    expect(save.rooms['bedroom'].unlocked).toBe(true);
    expect(save.rooms['living'].furniture).toHaveLength(1);
    expect(save.unlockedFurniture).toContain('sofa');
  });

  it('restores from saved data', () => {
    const saved = {
      rooms: {
        living: {
          id: 'living',
          name: '客厅',
          unlocked: true,
          furniture: [{ itemId: 'lamp', row: 0, col: 0, rotation: 0 }],
          wallpaper: 'wallpaper_b',
          floor: 'floor_b',
        },
        bedroom: {
          id: 'bedroom',
          name: '卧室',
          unlocked: true,
          furniture: [],
          wallpaper: 'default',
          floor: 'default',
        },
      },
      unlockedFurniture: ['lamp'],
    };
    const restored = new HomeSystem(saved);
    expect(restored.isRoomUnlocked('bedroom')).toBe(true);
    expect(restored.getRoomFurniture('living')).toHaveLength(1);
    expect(restored.isFurnitureUnlocked('lamp')).toBe(true);
  });
});
