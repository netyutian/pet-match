import { ROOMS } from '../constants';
import type { RoomData, PlacedFurniture } from '../types';

export class HomeSystem {
  private rooms: Record<string, RoomData>;
  private unlockedFurniture: Set<string>;

  constructor(saved?: { rooms: Record<string, RoomData>; unlockedFurniture: string[] }) {
    if (saved) {
      this.rooms = {};
      for (const [id, room] of Object.entries(saved.rooms)) {
        this.rooms[id] = {
          ...room,
          furniture: room.furniture.map(f => ({ ...f })),
        };
      }
      this.unlockedFurniture = new Set(saved.unlockedFurniture);
    } else {
      this.rooms = {};
      for (const roomDef of ROOMS) {
        this.rooms[roomDef.id] = {
          id: roomDef.id,
          name: roomDef.name,
          unlocked: roomDef.unlockLevel === 1,
          furniture: [],
          wallpaper: 'default',
          floor: 'default',
        };
      }
      this.unlockedFurniture = new Set();
    }
  }

  isRoomUnlocked(roomId: string): boolean {
    return this.rooms[roomId]?.unlocked ?? false;
  }

  unlockRoom(roomId: string, currentLevel: number): boolean {
    const roomDef = ROOMS.find(r => r.id === roomId);
    if (!roomDef) return false;
    if (this.rooms[roomId]?.unlocked) return true;
    if (currentLevel >= roomDef.unlockLevel) {
      this.rooms[roomId].unlocked = true;
      return true;
    }
    return false;
  }

  getRooms(): RoomData[] {
    return Object.values(this.rooms).map(r => ({
      ...r,
      furniture: r.furniture.map(f => ({ ...f })),
    }));
  }

  getRoom(roomId: string): RoomData | undefined {
    const room = this.rooms[roomId];
    if (!room) return undefined;
    return {
      ...room,
      furniture: room.furniture.map(f => ({ ...f })),
    };
  }

  getRoomFurniture(roomId: string): PlacedFurniture[] {
    return this.rooms[roomId]?.furniture.map(f => ({ ...f })) ?? [];
  }

  placeFurniture(roomId: string, itemId: string, row: number, col: number, rotation: number): void {
    const room = this.rooms[roomId];
    if (!room) return;
    room.furniture.push({ itemId, row, col, rotation });
  }

  removeFurniture(roomId: string, row: number, col: number): boolean {
    const room = this.rooms[roomId];
    if (!room) return false;
    const index = room.furniture.findIndex(f => f.row === row && f.col === col);
    if (index === -1) return false;
    room.furniture.splice(index, 1);
    return true;
  }

  setWallpaper(roomId: string, wallpaper: string): void {
    const room = this.rooms[roomId];
    if (room) {
      room.wallpaper = wallpaper;
    }
  }

  setFloor(roomId: string, floor: string): void {
    const room = this.rooms[roomId];
    if (room) {
      room.floor = floor;
    }
  }

  unlockFurniture(itemId: string): void {
    this.unlockedFurniture.add(itemId);
  }

  isFurnitureUnlocked(itemId: string): boolean {
    return this.unlockedFurniture.has(itemId);
  }

  getSaveData(): { rooms: Record<string, RoomData>; unlockedFurniture: string[] } {
    return {
      rooms: this.getRooms().reduce((acc, room) => {
        acc[room.id] = room;
        return acc;
      }, {} as Record<string, RoomData>),
      unlockedFurniture: Array.from(this.unlockedFurniture),
    };
  }
}
