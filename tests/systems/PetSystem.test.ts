import { describe, it, expect, beforeEach } from 'vitest';
import { PetSystem } from '../../src/systems/PetSystem';

describe('PetSystem', () => {
  let system: PetSystem;

  beforeEach(() => {
    system = new PetSystem();
  });

  it('starts with rat unlocked and named 吱吱', () => {
    expect(system.hasPet('rat')).toBe(true);
    const rat = system.getPet('rat');
    expect(rat).toBeDefined();
    expect(rat!.name).toBe('吱吱');
    expect(rat!.intimacy).toBe(0);
    expect(rat!.currentClothes).toBe('');
  });

  it('returns all pets', () => {
    const pets = system.getAllPets();
    expect(pets).toHaveLength(1);
    expect(pets[0].id).toBe('rat');
  });

  it('returns undefined for unknown pet', () => {
    expect(system.getPet('ox')).toBeUndefined();
    expect(system.hasPet('ox')).toBe(false);
  });

  it('adds and gets fragments', () => {
    system.addFragments('ox', 5);
    expect(system.getFragments('ox')).toBe(5);
  });

  it('unlocks pet with enough fragments', () => {
    system.addFragments('ox', 12);
    expect(system.unlockPet('ox')).toBe(true);
    expect(system.hasPet('ox')).toBe(true);
    expect(system.getFragments('ox')).toBe(0);
  });

  it('refuses to unlock pet with insufficient fragments', () => {
    system.addFragments('ox', 5);
    expect(system.unlockPet('ox')).toBe(false);
    expect(system.hasPet('ox')).toBe(false);
    expect(system.getFragments('ox')).toBe(5);
  });

  it('renames pet', () => {
    system.renamePet('rat', '小花');
    expect(system.getPet('rat')!.name).toBe('小花');
  });

  it('feeds pet to increase intimacy', () => {
    expect(system.feed('rat')).toBe(true);
    expect(system.getPet('rat')!.intimacy).toBe(10);
  });

  it('caps intimacy at maxIntimacy', () => {
    for (let i = 0; i < 15; i++) {
      system.feed('rat');
    }
    expect(system.getPet('rat')!.intimacy).toBe(100);
  });

  it('returns intimacy level 1-5', () => {
    expect(system.getIntimacyLevel('rat')).toBe(1);
    system.getPet('rat')!.intimacy = 19;
    expect(system.getIntimacyLevel('rat')).toBe(1);
    system.getPet('rat')!.intimacy = 20;
    expect(system.getIntimacyLevel('rat')).toBe(2);
    system.getPet('rat')!.intimacy = 99;
    expect(system.getIntimacyLevel('rat')).toBe(5);
  });

  it('unlocks clothes', () => {
    system.unlockClothes('rat', '围巾');
    expect(system.getPet('rat')!.unlockedClothes).toContain('围巾');
  });

  it('equips clothes when unlocked', () => {
    system.unlockClothes('rat', '围巾');
    expect(system.equipClothes('rat', '围巾')).toBe(true);
    expect(system.getPet('rat')!.currentClothes).toBe('围巾');
  });

  it('refuses to equip locked clothes', () => {
    expect(system.equipClothes('rat', '围巾')).toBe(false);
    expect(system.getPet('rat')!.currentClothes).toBe('');
  });

  it('returns save data', () => {
    system.addFragments('ox', 3);
    system.unlockClothes('rat', '围巾');
    system.equipClothes('rat', '围巾');
    system.feed('rat');
    const save = system.getSaveData();
    expect(save.pets['rat'].name).toBe('吱吱');
    expect(save.pets['rat'].intimacy).toBe(10);
    expect(save.pets['rat'].currentClothes).toBe('围巾');
    expect(save.fragments['ox']).toBe(3);
    expect(save.unlockedClothes['rat']).toContain('围巾');
  });

  it('restores from saved data', () => {
    const saved = {
      pets: {
        rat: {
          id: 'rat',
          name: '花花',
          intimacy: 30,
          unlockedClothes: ['帽子'],
          currentClothes: '帽子',
        },
      },
      fragments: { ox: 8 },
      unlockedClothes: { rat: ['帽子', '围巾'] },
    };
    const restored = new PetSystem(saved);
    expect(restored.getPet('rat')!.name).toBe('花花');
    expect(restored.getPet('rat')!.intimacy).toBe(30);
    expect(restored.getFragments('ox')).toBe(8);
    expect(restored.equipClothes('rat', '围巾')).toBe(true);
    expect(restored.equipClothes('rat', '未知')).toBe(false);
  });
});
