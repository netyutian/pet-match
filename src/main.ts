import { ScreenManager } from './ui/ScreenManager';
import { LevelSelectScreen } from './ui/LevelSelectScreen';
import { GameScreen } from './ui/GameScreen';
import { HomeScreen } from './ui/HomeScreen';
import { SaveManager } from './systems/SaveManager';
import { ResourceSystem } from './systems/ResourceSystem';
import { HomeSystem } from './systems/HomeSystem';
import { PetSystem } from './systems/PetSystem';
import type { SaveData } from './types';
import { ROOMS } from './constants';

class GameApp {
  private screenMgr: ScreenManager;
  private saveMgr = new SaveManager();
  private resources: ResourceSystem;
  private home: HomeSystem;
  private pets: PetSystem;
  private saveData: SaveData;
  private levelSelect: LevelSelectScreen;

  constructor() {
    const loaded = this.saveMgr.load();
    this.saveData = loaded ?? this.createNewSave();

    this.resources = new ResourceSystem({
      coins: this.saveData.coins,
      fragments: this.saveData.fragments,
    });

    this.pets = new PetSystem({
      pets: this.saveData.pets,
      fragments: this.saveData.fragments,
      unlockedClothes: {},
    });

    this.home = new HomeSystem({
      rooms: this.saveData.rooms,
      unlockedFurniture: this.saveData.unlockedFurniture,
    });

    this.screenMgr = new ScreenManager('app');
    this.setupScreens();

    this.levelSelect = new LevelSelectScreen(
      this.saveData.currentLevel,
      this.saveData.levelStars,
      (levelId: number) => this.startLevel(levelId)
    );
    this.screenMgr.register('levelSelect', this.levelSelect.getElement());

    this.screenMgr.show('menu');
  }

  private createNewSave(): SaveData {
    const rooms: SaveData['rooms'] = {};
    for (const room of ROOMS) {
      rooms[room.id] = {
        id: room.id,
        name: room.name,
        unlocked: room.unlockLevel === 1,
        furniture: [],
        wallpaper: 'default',
        floor: 'default',
      };
    }

    return {
      currentLevel: 1,
      levelStars: {},
      coins: 200,
      fragments: {},
      unlockedPets: ['cat'],
      pets: {
        cat: {
          id: 'cat',
          name: '咪咪',
          intimacy: 0,
          unlockedClothes: [],
          currentClothes: '',
        },
      },
      rooms,
      unlockedFurniture: [],
    };
  }

  private setupScreens(): void {
    const menu = document.createElement('div');
    menu.classList.add('screen', 'active');

    const title = document.createElement('h1');
    title.textContent = 'Pet Match';
    menu.appendChild(title);

    const startBtn = document.createElement('button');
    startBtn.textContent = '开始游戏';
    startBtn.addEventListener('click', () => {
      this.screenMgr.show('levelSelect');
    });
    menu.appendChild(startBtn);

    const homeBtn = document.createElement('button');
    homeBtn.textContent = '我的家园';
    homeBtn.addEventListener('click', () => {
      this.screenMgr.show('home');
    });
    menu.appendChild(homeBtn);

    this.screenMgr.register('menu', menu);

    const homeScreen = new HomeScreen(this.home, this.pets, this.resources);
    this.screenMgr.register('home', homeScreen.getElement());

    const backBtn = document.createElement('button');
    backBtn.textContent = '返回';
    backBtn.style.marginTop = '12px';
    backBtn.addEventListener('click', () => {
      this.persistSave();
      this.screenMgr.show('menu');
    });
    homeScreen.getElement().appendChild(backBtn);
  }

  private startLevel(levelId: number): void {
    const gameScreen = new GameScreen(levelId, (result) => {
      if (result.won) {
        const prevStars = this.saveData.levelStars[levelId] ?? 0;
        if (result.stars > prevStars) {
          this.saveData.levelStars[levelId] = result.stars;
        }

        if (levelId === this.saveData.currentLevel) {
          this.saveData.currentLevel += 1;
        }

        const coinsReward = 50 + result.stars * 20;
        this.resources.addCoins(coinsReward);

        const fragmentMap: Record<number, string> = {
          3: 'cat',
          5: 'dog',
          8: 'rabbit',
        };
        const fragmentPet = fragmentMap[levelId];
        if (fragmentPet) {
          this.resources.addFragments(fragmentPet, 1);
          this.pets.addFragments(fragmentPet, 1);
        }

        for (const room of ROOMS) {
          if (this.saveData.currentLevel >= room.unlockLevel) {
            this.home.unlockRoom(room.id, this.saveData.currentLevel);
          }
        }
      }

      this.persistSave();
      this.levelSelect.update(this.saveData.currentLevel, this.saveData.levelStars);
      this.screenMgr.show('levelSelect');
    });

    this.screenMgr.register('game', gameScreen.getElement());
    this.screenMgr.show('game');
  }

  private persistSave(): void {
    const resourceData = this.resources.getSaveData();
    const petData = this.pets.getSaveData();
    const homeData = this.home.getSaveData();

    this.saveData.coins = resourceData.coins;
    this.saveData.fragments = resourceData.fragments;
    this.saveData.pets = petData.pets;
    this.saveData.unlockedPets = Object.keys(petData.pets);
    this.saveData.rooms = homeData.rooms;
    this.saveData.unlockedFurniture = homeData.unlockedFurniture;

    this.saveMgr.save(this.saveData);
  }
}

new GameApp();
