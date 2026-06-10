import type { SaveData } from '../types';

const SAVE_KEY = 'pet_match_save';

export class SaveManager {
  load(): SaveData | null {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as SaveData;
    } catch {
      return null;
    }
  }

  save(data: SaveData): void {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  clear(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  exportCode(data: SaveData): string {
    return btoa(encodeURIComponent(JSON.stringify(data)));
  }

  importCode(code: string): SaveData | null {
    try {
      const json = decodeURIComponent(atob(code));
      return JSON.parse(json) as SaveData;
    } catch {
      return null;
    }
  }
}
