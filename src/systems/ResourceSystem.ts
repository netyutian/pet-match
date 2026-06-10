import { INITIAL_COINS } from '../constants';

export class ResourceSystem {
  private coins: number;
  private fragments: Record<string, number> = {};

  constructor(saved?: { coins: number; fragments: Record<string, number> }) {
    this.coins = saved?.coins ?? INITIAL_COINS;
    this.fragments = saved?.fragments ? { ...saved.fragments } : {};
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

  getSaveData(): { coins: number; fragments: Record<string, number> } {
    return { coins: this.coins, fragments: { ...this.fragments } };
  }
}
