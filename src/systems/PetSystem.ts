import { PET_DATA, PET_COST_FRAGMENTS } from '../constants';
import type { PetInstance } from '../types';

interface PetSaveData {
  pets: Record<string, PetInstance>;
  fragments: Record<string, number>;
  unlockedClothes: Record<string, string[]>;
}

export class PetSystem {
  private pets: Record<string, PetInstance> = {};
  private fragments: Record<string, number> = {};
  private unlockedClothes: Record<string, string[]> = {};

  constructor(saved?: PetSaveData) {
    if (saved) {
      this.pets = saved.pets ? { ...saved.pets } : {};
      this.fragments = saved.fragments ? { ...saved.fragments } : {};
      this.unlockedClothes = saved.unlockedClothes
        ? Object.fromEntries(
            Object.entries(saved.unlockedClothes).map(([k, v]) => [k, [...v]])
          )
        : {};
    }

    if (!this.pets['rat']) {
      this.pets['rat'] = {
        id: 'rat',
        name: '吱吱',
        intimacy: 0,
        unlockedClothes: [],
        currentClothes: '',
      };
    }
  }

  hasPet(id: string): boolean {
    return id in this.pets;
  }

  getPet(id: string): PetInstance | undefined {
    return this.pets[id];
  }

  getAllPets(): PetInstance[] {
    return Object.values(this.pets);
  }

  addFragments(petId: string, amount: number): void {
    this.fragments[petId] = (this.fragments[petId] || 0) + amount;
  }

  getFragments(petId: string): number {
    return this.fragments[petId] || 0;
  }

  unlockPet(id: string): boolean {
    if (this.hasPet(id)) return true;
    if (this.getFragments(id) >= PET_COST_FRAGMENTS) {
      this.fragments[id] -= PET_COST_FRAGMENTS;
      this.pets[id] = {
        id,
        name: PET_DATA[id]?.species || id,
        intimacy: 0,
        unlockedClothes: [],
        currentClothes: '',
      };
      return true;
    }
    return false;
  }

  renamePet(id: string, name: string): void {
    const pet = this.pets[id];
    if (pet) {
      pet.name = name;
    }
  }

  feed(id: string): boolean {
    const pet = this.pets[id];
    if (!pet) return false;
    const max = PET_DATA[id]?.maxIntimacy ?? 100;
    pet.intimacy = Math.min(pet.intimacy + 10, max);
    return true;
  }

  getIntimacyLevel(id: string): number {
    const pet = this.pets[id];
    if (!pet) return 1;
    return Math.min(5, Math.floor(pet.intimacy / 20) + 1);
  }

  unlockClothes(id: string, clothes: string): void {
    if (!this.unlockedClothes[id]) {
      this.unlockedClothes[id] = [];
    }
    if (!this.unlockedClothes[id].includes(clothes)) {
      this.unlockedClothes[id].push(clothes);
    }
    const pet = this.pets[id];
    if (pet && !pet.unlockedClothes.includes(clothes)) {
      pet.unlockedClothes.push(clothes);
    }
  }

  equipClothes(id: string, clothes: string): boolean {
    const pet = this.pets[id];
    if (!pet) return false;
    const unlocked = this.unlockedClothes[id] || [];
    if (!unlocked.includes(clothes)) return false;
    pet.currentClothes = clothes;
    return true;
  }

  getSaveData(): PetSaveData {
    return {
      pets: { ...this.pets },
      fragments: { ...this.fragments },
      unlockedClothes: Object.fromEntries(
        Object.entries(this.unlockedClothes).map(([k, v]) => [k, [...v]])
      ),
    };
  }
}
