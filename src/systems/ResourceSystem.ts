import { INITIAL_COINS } from '../constants';

const MAX_LIVES = 5;
const LIFE_RECOVER_MS = 30 * 60 * 1000; // 30 minutes

export class ResourceSystem {
  private coins: number;
  private fragments: Record<string, number> = {};
  private lives: number;
  private lastLifeRecoverTime: number;

  constructor(saved?: { coins: number; fragments: Record<string, number>; lives?: number; lastLifeRecoverTime?: number }) {
    this.coins = saved?.coins ?? INITIAL_COINS;
    this.fragments = saved?.fragments ? { ...saved.fragments } : {};
    this.lives = saved?.lives ?? MAX_LIVES;
    this.lastLifeRecoverTime = saved?.lastLifeRecoverTime ?? Date.now();
    this.recoverLives();
  }

  private recoverLives(): void {
    if (this.lives >= MAX_LIVES) return;
    const now = Date.now();
    const elapsed = now - this.lastLifeRecoverTime;
    const recovered = Math.floor(elapsed / LIFE_RECOVER_MS);
    if (recovered > 0) {
      this.lives = Math.min(MAX_LIVES, this.lives + recovered);
      this.lastLifeRecoverTime = now - (elapsed % LIFE_RECOVER_MS);
    }
  }

  getLives(): number {
    this.recoverLives();
    return this.lives;
  }

  getMaxLives(): number {
    return MAX_LIVES;
  }

  useLife(): boolean {
    this.recoverLives();
    if (this.lives > 0) {
      this.lives--;
      if (this.lives === MAX_LIVES - 1) {
        this.lastLifeRecoverTime = Date.now();
      }
      return true;
    }
    return false;
  }

  getNextLifeTime(): number {
    if (this.lives >= MAX_LIVES) return 0;
    const now = Date.now();
    const elapsed = now - this.lastLifeRecoverTime;
    return Math.max(0, LIFE_RECOVER_MS - (elapsed % LIFE_RECOVER_MS));
  }

  getCoins(): number {
    return this.coins;
  }

  addCoins(amount: number): void {
    this.coins += amount;
  }

  spendCoins(amount: number): boolean {
    if (this.coins >= amount) {
      this.coins -= amount;
      return true;
    }
    return false;
  }

  getFragments(petId: string): number {
    return this.fragments[petId] || 0;
  }

  addFragments(petId: string, amount: number): void {
    this.fragments[petId] = (this.fragments[petId] || 0) + amount;
  }

  spendFragments(petId: string, amount: number): boolean {
    if (this.getFragments(petId) >= amount) {
      this.fragments[petId] -= amount;
      return true;
    }
    return false;
  }

  getSaveData(): { coins: number; fragments: Record<string, number>; lives: number; lastLifeRecoverTime: number } {
    return { coins: this.coins, fragments: { ...this.fragments }, lives: this.lives, lastLifeRecoverTime: this.lastLifeRecoverTime };
  }
}
