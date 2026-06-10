import { describe, it, expect, beforeEach } from 'vitest';
import { PetSystem } from '../../src/systems/PetSystem';

describe('PetSystem', () => {
  let system: PetSystem;

  beforeEach(() => {
    system = new PetSystem();
  });

  it('starts with cat unlocked and named 咪咪', () => {
    expect(system.hasPet('cat')).toBe(true);
    const cat = system.getPet('cat');
    expect(cat).toBeDefined();
    expect(cat!.name).toBe('咪咪');
    expect(cat!.intimacy).toBe(0);
    expect(cat!.currentClothes).toBe('');
  });

  it('returns all pets', () => {
    const pets = system.getAllPets();
    expect(pets).toHaveLength(1);
    expect(pets[0].id).toBe('cat');
  });

  it('returns undefined for unknown pet', () => {
    expect(system.getPet('dog')).toBeUndefined();
    expect(system.hasPet('dog')).toBe(false);
  });

  it('adds and gets fragments', () => {
    system.addFragments('dog', 5);
    expect(system.getFragments('dog')).toBe(5);
  });

  it('unlocks pet with enough fragments', () => {
    system.addFragments('dog', 12);
    expect(system.unlockPet('dog')).toBe(true);
    expect(system.hasPet('dog')).toBe(true);
    expect(system.getFragments('dog')).toBe(0);
  });

  it('refuses to unlock pet with insufficient fragments', () => {
    system.addFragments('dog', 5);
    expect(system.unlockPet('dog')).toBe(false);
    expect(system.hasPet('dog')).toBe(false);
    expect(system.getFragments('dog')).toBe(5);
  });

  it('renames pet', () => {
    system.renamePet('cat', '小花');
    expect(system.getPet('cat')!.name).toBe('小花');
  });

  it('feeds pet to increase intimacy', () => {
    expect(system.feed('cat')).toBe(true);
    expect(system.getPet('cat')!.intimacy).toBe(10);
  });

  it('caps intimacy at maxIntimacy', () => {
    for (let i = 0; i < 15; i++) {
      system.feed('cat');
    }
    expect(system.getPet('cat')!.intimacy).toBe(100);
  });

  it('returns intimacy level 1-5', () => {
    expect(system.getIntimacyLevel('cat')).toBe(1);
    system.getPet('cat')!.intimacy = 19;
    expect(system.getIntimacyLevel('cat')).toBe(1);
    system.getPet('cat')!.intimacy = 20;
    expect(system.getIntimacyLevel('cat')).toBe(2);
    system.getPet('cat')!.intimacy = 99;
    expect(system.getIntimacyLevel('cat')).toBe(5);
  });

  it('unlocks clothes', () => {
    system.unlockClothes('cat', '围巾');
    expect(system.getPet('cat')!.unlockedClothes).toContain('围巾');
  });

  it('equips clothes when unlocked', () => {
    system.unlockClothes('cat', '围巾');
    expect(system.equipClothes('cat', '围巾')).toBe(true);
    expect(system.getPet('cat')!.currentClothes).toBe('围巾');
  });

  it('refuses to equip locked clothes', () => {
    expect(system.equipClothes('cat', '围巾')).toBe(false);
    expect(system.getPet('cat')!.currentClothes).toBe('');
  });

  it('returns save data', () => {
    system.addFragments('dog', 3);
    system.unlockClothes('cat', '围巾');
    system.equipClothes('cat', '围巾');
    system.feed('cat');
    const save = system.getSaveData();
    expect(save.pets['cat'].name).toBe('咪咪');
    expect(save.pets['cat'].intimacy).toBe(10);
    expect(save.pets['cat'].currentClothes).toBe('围巾');
    expect(save.fragments['dog']).toBe(3);
    expect(save.unlockedClothes['cat']).toContain('围巾');
  });

  it('restores from saved data', () => {
    const saved = {
      pets: {
        cat: {
          id: 'cat',
          name: '花花',
          intimacy: 30,
          unlockedClothes: ['帽子'],
          currentClothes: '帽子',
        },
      },
      fragments: { dog: 8 },
      unlockedClothes: { cat: ['帽子', '围巾'] },
    };
    const restored = new PetSystem(saved);
    expect(restored.getPet('cat')!.name).toBe('花花');
    expect(restored.getPet('cat')!.intimacy).toBe(30);
    expect(restored.getFragments('dog')).toBe(8);
    expect(restored.equipClothes('cat', '围巾')).toBe(true);
    expect(restored.equipClothes('cat', '未知')).toBe(false);
  });
});
