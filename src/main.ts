import { ScreenManager } from './ui/ScreenManager';
import { LevelSelectScreen } from './ui/LevelSelectScreen';
import { GameScreen } from './ui/GameScreen';
import { Home3DScreen } from './ui/Home3DScreen';
import { SaveManager } from './systems/SaveManager';
import { ResourceSystem } from './systems/ResourceSystem';
import { HomeSystem } from './systems/HomeSystem';
import { PetSystem } from './systems/PetSystem';
import { getLevel } from './core/LevelConfig';
import type { SaveData, ElementType } from './types';
import { ROOMS, ELEMENTS, COLORS } from './constants';

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
      lives: this.saveData.lives,
      lastLifeRecoverTime: this.saveData.lastLifeRecoverTime,
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

    // Level select lives display
    const levelSelectEl = this.levelSelect.getElement();
    const levelLives = document.createElement('div');
    levelLives.className = 'lives-display level-lives-display';
    levelSelectEl.appendChild(levelLives);

    this.updateLivesDisplay();
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
      unlockedPets: ['rat'],
      pets: {
        rat: {
          id: 'rat',
          name: '吱吱',
          intimacy: 0,
          unlockedClothes: [],
          currentClothes: '',
        },
      },
      rooms,
      unlockedFurniture: [],
      lives: 5,
      lastLifeRecoverTime: Date.now(),
    };
  }

  private setupScreens(): void {
    const menu = document.createElement('div');
    menu.classList.add('screen', 'active', 'menu-screen');

    // Lives display
    const menuLives = document.createElement('div');
    menuLives.className = 'menu-lives-display';
    menu.appendChild(menuLives);

    // Title
    const title = document.createElement('h1');
    title.className = 'menu-title';
    title.textContent = '12生肖消消乐';
    menu.appendChild(title);

    // Avatar grid (4 columns x 4 rows, 16 avatars with repeats)
    const grid = document.createElement('div');
    grid.className = 'menu-avatar-grid';
    for (let i = 0; i < 16; i++) {
      const element = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
      const cell = document.createElement('div');
      cell.className = 'menu-avatar-cell';
      cell.style.backgroundColor = COLORS[element as ElementType];

      const img = document.createElement('img');
      img.src = `./assets/avatars/${element}.png`;
      img.alt = element;
      img.loading = 'lazy';
      img.decoding = 'async';
      cell.appendChild(img);
      grid.appendChild(cell);
    }
    menu.appendChild(grid);

    // Start button
    const startBtn = document.createElement('button');
    startBtn.className = 'menu-start-btn';
    startBtn.textContent = '开始游戏';
    startBtn.addEventListener('click', () => {
      this.screenMgr.show('levelSelect');
    });
    menu.appendChild(startBtn);

    // Home button (smaller, below start)
    const homeBtn = document.createElement('button');
    homeBtn.className = 'menu-home-btn';
    homeBtn.textContent = '动物世界';
    homeBtn.addEventListener('click', () => {
      this.screenMgr.show('home');
    });
    menu.appendChild(homeBtn);

    this.screenMgr.register('menu', menu);

    const homeScreen = new Home3DScreen(this.pets, () => {
      this.persistSave();
      this.screenMgr.show('menu');
    });
    this.screenMgr.register('home', homeScreen.getElement());
  }

  private startLevel(levelId: number): void {
    if (levelId <= 0) {
      this.screenMgr.show('menu');
      return;
    }

    if (this.resources.getLives() <= 0) {
      this.showNoLivesModal();
      return;
    }

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
          3: 'rat',
          5: 'ox',
          8: 'tiger',
        };
        const fragmentPet = fragmentMap[levelId];
        if (fragmentPet) {
          this.resources.addFragments(fragmentPet, 1);
          this.pets.addFragments(fragmentPet, 1);
        }

        const level = getLevel(levelId);
        if (level && level.goal.type === 'collect' && level.goal.element) {
          if (!this.pets.hasPet(level.goal.element)) {
            this.pets.addPet(level.goal.element);
          }
        }

        for (const room of ROOMS) {
          if (this.saveData.currentLevel >= room.unlockLevel) {
            this.home.unlockRoom(room.id, this.saveData.currentLevel);
          }
        }
      } else {
        this.resources.useLife();
      }

      this.persistSave();
      this.levelSelect.update(this.saveData.currentLevel, this.saveData.levelStars);
      this.updateLivesDisplay();

      if (result.won && result.next) {
        const nextLevel = levelId + 1;
        if (nextLevel <= 20) {
          this.startLevel(nextLevel);
          return;
        }
      }
      this.screenMgr.show('levelSelect');
    });

    this.screenMgr.register('game', gameScreen.getElement());
    this.screenMgr.show('game');
  }

  private showNoLivesModal(): void {
    const overlay = document.createElement('div');
    overlay.className = 'modal';
    overlay.style.zIndex = '300';

    const card = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = '生命值不足';
    title.style.margin = '0 0 12px';
    card.appendChild(title);

    const body = document.createElement('p');
    const nextMinutes = Math.ceil(this.resources.getNextLifeTime() / 60000);
    body.textContent = `生命值已耗尽，${nextMinutes} 分钟后恢复 1 点。`;
    body.style.color = '#666';
    body.style.margin = '0 0 16px';
    card.appendChild(body);

    const btn = document.createElement('button');
    btn.textContent = '知道了';
    btn.addEventListener('click', () => overlay.remove());
    card.appendChild(btn);

    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  private updateLivesDisplay(): void {
    const lives = this.resources.getLives();
    const maxLives = this.resources.getMaxLives();
    const text = '❤️'.repeat(lives) + '🖤'.repeat(maxLives - lives);

    const menuDisplay = document.querySelector('.menu-lives-display');
    if (menuDisplay) {
      menuDisplay.textContent = text;
    }

    const levelDisplay = document.querySelector('.level-lives-display');
    if (levelDisplay) {
      levelDisplay.textContent = text;
    }
  }

  private persistSave(): void {
    const resourceData = this.resources.getSaveData();
    const petData = this.pets.getSaveData();
    const homeData = this.home.getSaveData();

    this.saveData.coins = resourceData.coins;
    this.saveData.fragments = resourceData.fragments;
    this.saveData.lives = resourceData.lives;
    this.saveData.lastLifeRecoverTime = resourceData.lastLifeRecoverTime;
    this.saveData.pets = petData.pets;
    this.saveData.unlockedPets = Object.keys(petData.pets);
    this.saveData.rooms = homeData.rooms;
    this.saveData.unlockedFurniture = homeData.unlockedFurniture;

    this.saveMgr.save(this.saveData);
  }
}

new GameApp();
