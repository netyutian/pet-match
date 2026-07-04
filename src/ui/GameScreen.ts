import { Board } from '../core/Board';
import { MatchEngine } from '../core/MatchEngine';
import { GameState } from '../core/GameState';
import { getLevel } from '../core/LevelConfig';
import { BoardRenderer } from './BoardRenderer';
import { SoundManager } from '../systems/SoundManager';
import { BOARD_SIZE } from '../constants';
import type { Position, LevelConfig } from '../types';

export class GameScreen {
  private container: HTMLElement;
  private board: Board;
  private gameState: GameState;
  private renderer: BoardRenderer;
  private sound: SoundManager;
  private level: LevelConfig;
  private onComplete: (result: { won: boolean; stars: number; levelId: number; next?: boolean }) => void;

  private scoreEl!: HTMLElement;
  private movesEl!: HTMLElement;
  private goalEl!: HTMLElement;
  private isAnimating = false;
  private hintTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    levelId: number,
    onComplete: (result: { won: boolean; stars: number; levelId: number; next?: boolean }) => void
  ) {
    this.onComplete = onComplete;

    const level = getLevel(levelId);
    if (!level) {
      throw new Error(`Level ${levelId} not found`);
    }
    this.level = level;

    this.container = document.createElement('div');
    this.container.classList.add('screen', 'active', 'game-screen');

    this.board = new Board();
    const preferredChance = Math.max(0.2, 0.5 - (levelId - 1) * 0.02);
    this.board.setPreferredElement(level.goal.element, preferredChance);
    if (level.obstacles) {
      this.board.setObstacles(level.obstacles);
    }
    this.gameState = new GameState(level);
    this.sound = new SoundManager();

    const hud = this.createHUD();
    this.container.appendChild(hud);

    const boardArea = document.createElement('div');
    boardArea.classList.add('board-area');
    this.container.appendChild(boardArea);

    this.renderer = new BoardRenderer(boardArea);
    this.renderer.setBoard(this.board);
    this.renderer.setSwapHandler((from, to) => this.handleSwap(from, to));
    this.renderer.setSpecialTapHandler((pos) => this.handleSpecialTap(pos));

    const backBtn = document.createElement('button');
    backBtn.id = 'back-btn';
    backBtn.textContent = '返回';
    backBtn.addEventListener('click', () => {
      this.onComplete({ won: false, stars: 0, levelId: this.level.id });
    });
    this.container.appendChild(backBtn);

    this.updateHUD();
    this.startHintTimer();

    if (level.obstacles && level.obstacles.length > 0) {
      this.showObstacleHint();
    }
  }

  getElement(): HTMLElement {
    return this.container;
  }

  private createHUD(): HTMLElement {
    const hud = document.createElement('div');
    hud.classList.add('game-hud');

    this.scoreEl = document.createElement('div');
    this.scoreEl.classList.add('hud-item');
    hud.appendChild(this.scoreEl);

    this.movesEl = document.createElement('div');
    this.movesEl.classList.add('hud-item');
    hud.appendChild(this.movesEl);

    this.goalEl = document.createElement('div');
    this.goalEl.classList.add('hud-item');
    hud.appendChild(this.goalEl);

    return hud;
  }

  private updateHUD(): void {
    const goal = this.level.goal;
    if (goal.type === 'collect' && goal.element) {
      const collected = this.gameState.getCollectedCount(goal.element);
      this.scoreEl.innerHTML = `<img src="./assets/avatars/${goal.element}.png" style="width:20px;height:20px;vertical-align:middle;margin-right:4px;border-radius:4px;"> ${collected}/${goal.target}`;
    } else if (goal.type === 'score') {
      this.scoreEl.textContent = `目标: ${goal.target}分`;
    } else if (goal.type === 'clear') {
      this.scoreEl.textContent = `${this.getObstacleLabel()}: ${this.gameState.getClearedObstacles()}/${goal.target}`;
    } else {
      this.scoreEl.textContent = this.formatGoal();
    }
    this.movesEl.textContent = `步数: ${this.gameState.getMovesLeft()}`;
    this.goalEl.textContent = `分数: ${this.gameState.getScore()}`;
  }

  private formatGoal(): string {
    const goal = this.level.goal;
    if (goal.type === 'score') {
      return `${goal.target}分`;
    }
    if (goal.type === 'collect' && goal.element) {
      const collected = this.gameState.getCollectedCount(goal.element);
      return `${collected}/${goal.target}`;
    }
    if (goal.type === 'clear') {
      return `${this.getObstacleLabel()}${goal.target}个`;
    }
    return '';
  }

  private getObstacleLabel(): string {
    if (!this.level.obstacles || this.level.obstacles.length === 0) {
      return '清除';
    }
    const types = new Set(this.level.obstacles.map((o) => o.type));
    if (types.size > 1) {
      return '清除障碍';
    }
    const type = this.level.obstacles[0].type;
    return type === 'wood' ? '清除木箱' : '清除冰块';
  }

  private async handleSwap(from: Position, to: Position): Promise<void> {
    if (this.isAnimating || this.gameState.getStatus() !== 'playing') {
      return;
    }

    this.resetHintTimer();

    const dr = Math.abs(from.row - to.row);
    const dc = Math.abs(from.col - to.col);
    if (dr + dc !== 1) {
      return;
    }

    this.board.swap(from, to);
    this.renderer.updateFromBoard();

    if (!MatchEngine.hasMatch(this.board.getGrid())) {
      // Invalid swap: animate back
      await this.delay(200);
      this.sound.playSwapBack();
      this.board.swap(from, to);
      this.renderer.updateFromBoard();
      return;
    }

    this.isAnimating = true;
    this.gameState.useMove();
    await this.processMatches();

    // Deadlock shuffle: if no valid moves, reshuffle automatically
    if (this.gameState.getStatus() === 'playing') {
      const hint = MatchEngine.findHint(this.board.getGrid());
      if (!hint) {
        await this.performShuffle();
      }
    }

    this.updateHUD();
    this.isAnimating = false;

    if (this.gameState.getStatus() !== 'playing') {
      await this.delay(400);
      this.showVictoryOrDefeat();
    }
  }

  private async processMatches(): Promise<void> {
    let totalScore = 0;
    const goalElement = this.level.goal.element;
    let targetClearedInChain = 0;
    let bigClearTriggered = false;

    while (MatchEngine.hasMatch(this.board.getGrid())) {
      const matches = MatchEngine.findMatches(this.board.getGrid());
      // Only 5+ matches spawn the egg/bomb. 4-matches stay as normal eliminations.
      // Obstacle cells must never be turned into bombs — they should be destroyed normally.
      const bombSpawns = MatchEngine.findSpecials(this.board.getGrid()).filter(
        (s) => {
          if (s.type !== 'bomb') return false;
          const cell = this.board.getCell(s.position.row, s.position.col);
          return !cell?.obstacle;
        }
      );
      const bombKeys = new Set(
        bombSpawns.map((s) => `${s.position.row},${s.position.col}`)
      );

      const allPositions = matches.flatMap((m) => m.positions);
      // Cells that will actually be eliminated this round (bomb-spawn cells are kept).
      const eliminatePositions = allPositions.filter(
        (p) => !bombKeys.has(`${p.row},${p.col}`)
      );

      // 1. Show elimination animation
      this.sound.playMatch();
      this.renderer.markEliminating(eliminatePositions);
      await this.delay(350);

      // 2. Actually eliminate
      for (const pos of eliminatePositions) {
        const cell = this.board.getCell(pos.row, pos.col);
        if (cell?.obstacle) {
          const destroyed = this.board.hitObstacle(pos.row, pos.col);
          if (destroyed) {
            this.gameState.recordObstacleCleared();
          }
          if (!destroyed) {
            continue;
          }
        }
        if (cell && goalElement && cell.element === goalElement) {
          targetClearedInChain++;
        }
        this.board.setCell(pos.row, pos.col, null);
      }

      // 2.3 Hit any obstacle that shares a row or column with a match
      // (this matches the in-game hint: "match in the obstacle's row/column")
      const affectedRows = new Set<number>();
      const affectedCols = new Set<number>();
      for (const pos of allPositions) {
        affectedRows.add(pos.row);
        affectedCols.add(pos.col);
      }
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (affectedRows.has(r) || affectedCols.has(c)) {
            const cell = this.board.getCell(r, c);
            if (cell?.obstacle) {
              const destroyed = this.board.hitObstacle(r, c);
              if (destroyed) {
                this.gameState.recordObstacleCleared();
              }
            }
          }
        }
      }

      // 2.5 Convert protected 5-match cells into eggs (bombs)
      for (const sp of bombSpawns) {
        const cell = this.board.getCell(sp.position.row, sp.position.col);
        if (cell) {
          cell.special = 'bomb';
        }
      }
      if (bombSpawns.length > 0) {
        this.sound.playBigClear();
        for (const sp of bombSpawns) {
          this.renderer.showFloatingText(sp.position, '✨ 彩蛋！');
        }
        this.renderer.updateFromBoard();
        this.renderer.markBombSpawn(bombSpawns.map((s) => s.position));
        await this.delay(500);
      }

      // 3. Score and floating text
      for (const match of matches) {
        totalScore += match.positions.length * 10;
        this.gameState.recordMatch(match.element, match.positions.length);
        if (goalElement && match.element === goalElement && match.positions.length > 0) {
          const centerPos = match.positions[Math.floor(match.positions.length / 2)];
          this.renderer.showFloatingText(
            centerPos,
            `<img src="./assets/avatars/${goalElement}.png" style="width:16px;height:16px;vertical-align:middle;margin-right:2px;border-radius:3px;"> +${match.positions.length}`
          );
        }
      }

      // Big clear bonus
      if (!bigClearTriggered && goalElement && targetClearedInChain >= 8) {
        bigClearTriggered = true;
        this.gameState.addScore(50);
        this.sound.playBigClear();
        const centerPos = { row: 3, col: 3 };
        this.renderer.showFloatingText(centerPos, `大消除！+50`);
      }

      // 4. Gravity and render
      const newPositions = this.board.applyGravity();
      this.renderer.updateFromBoard();

      // 5. Falling animation for new cells
      this.renderer.markFalling(newPositions);
      await this.delay(400);

      this.renderer.clearAnimations();
    }

    this.gameState.addScore(totalScore);
    this.renderer.updateFromBoard();
  }

  private async handleSpecialTap(pos: Position): Promise<void> {
    if (this.isAnimating || this.gameState.getStatus() !== 'playing') return;
    const cell = this.board.getCell(pos.row, pos.col);
    if (!cell || cell.special !== 'bomb') return;

    this.isAnimating = true;
    this.resetHintTimer();

    const targetElement = cell.element;
    const goalElement = this.level.goal.element;

    // Find every same-element cell on the board (including the bomb itself).
    const positions: Position[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cc = this.board.getCell(r, c);
        if (cc && !cc.obstacle && cc.element === targetElement) {
          positions.push({ row: r, col: c });
        }
      }
    }

    // Detonation flash from the bomb cell
    this.sound.playBigClear();
    this.renderer.markBombDetonate(pos);
    await this.delay(220);

    this.renderer.markEliminating(positions);
    await this.delay(420);

    let cleared = 0;
    for (const p of positions) {
      const c = this.board.getCell(p.row, p.col);
      if (c && goalElement && c.element === goalElement) {
        this.gameState.recordMatch(c.element, 1);
        cleared++;
      }
      this.board.setCell(p.row, p.col, null);
    }

    const bonus = positions.length * 20;
    this.gameState.addScore(bonus);
    this.renderer.showFloatingText(pos, `💥 +${bonus}`);
    if (cleared > 0 && goalElement) {
      this.renderer.showFloatingText(
        { row: Math.max(0, pos.row - 1), col: pos.col },
        `<img src="./assets/avatars/${goalElement}.png" style="width:16px;height:16px;vertical-align:middle;border-radius:3px;"> +${cleared}`
      );
    }

    const newPositions = this.board.applyGravity();
    this.renderer.updateFromBoard();
    this.renderer.markFalling(newPositions);
    await this.delay(400);
    this.renderer.clearAnimations();

    // Cascade any matches the falling triggered.
    await this.processMatches();

    if (this.gameState.getStatus() === 'playing') {
      const hint = MatchEngine.findHint(this.board.getGrid());
      if (!hint) {
        await this.performShuffle();
      }
    }

    this.updateHUD();
    this.isAnimating = false;

    if (this.gameState.getStatus() !== 'playing') {
      await this.delay(400);
      this.showVictoryOrDefeat();
    }
  }

  private showVictoryOrDefeat(): void {
    const won = this.gameState.getStatus() === 'won';
    const stars = this.gameState.getStars();

    if (won) {
      this.sound.playWin();
      this.showVictoryModal(stars);
    } else {
      this.onComplete({ won: false, stars: 0, levelId: this.level.id });
    }
  }

  private showVictoryModal(stars: number): void {
    const overlay = document.createElement('div');
    overlay.className = 'victory-modal';

    const card = document.createElement('div');

    const title = document.createElement('h2');
    title.textContent = '恭喜通关！';
    title.style.color = '#6B4F4F';
    title.style.margin = '0 0 8px';
    card.appendChild(title);

    const starDisplay = document.createElement('div');
    starDisplay.className = 'victory-stars';
    starDisplay.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    card.appendChild(starDisplay);

    const scoreInfo = document.createElement('div');
    scoreInfo.textContent = `得分: ${this.gameState.getScore()}`;
    scoreInfo.style.color = '#888';
    scoreInfo.style.marginBottom = '16px';
    card.appendChild(scoreInfo);

    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '12px';
    btnRow.style.justifyContent = 'center';

    const nextBtn = document.createElement('button');
    nextBtn.textContent = '下一关';
    nextBtn.addEventListener('click', () => {
      this.onComplete({ won: true, stars, levelId: this.level.id, next: true });
    });
    btnRow.appendChild(nextBtn);

    const backBtn = document.createElement('button');
    backBtn.textContent = '返回';
    backBtn.style.background = '#D3D3D3';
    backBtn.style.color = '#4A4A4A';
    backBtn.addEventListener('click', () => {
      this.onComplete({ won: true, stars, levelId: this.level.id });
    });
    btnRow.appendChild(backBtn);

    card.appendChild(btnRow);
    overlay.appendChild(card);
    this.container.appendChild(overlay);
  }

  private showObstacleHint(): void {
    const overlay = document.createElement('div');
    overlay.className = 'obstacle-hint-modal';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); display: flex; align-items: center;
      justify-content: center; z-index: 200; padding: 16px;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      background: #fff; border-radius: 16px; padding: 24px;
      width: 100%; text-align: center;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    `;

    const title = document.createElement('h3');
    title.textContent = '本关有障碍物';
    title.style.cssText = 'margin: 0 0 12px; color: #6B4F4F; font-size: 18px;';
    card.appendChild(title);

    const hasIce = this.level.obstacles!.some(o => o.type === 'ice');
    const hasWood = this.level.obstacles!.some(o => o.type === 'wood');

    const body = document.createElement('div');
    body.style.cssText = 'color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 16px;';

    let html = '';
    if (hasWood) {
      html += '<div style="margin-bottom:8px;"><span style="font-size:24px;">🪵</span> <b>木箱</b>：匹配一次即可消除</div>';
    }
    if (hasIce) {
      html += '<div style="margin-bottom:8px;"><span style="font-size:24px;">🧊</span> <b>冰块</b>：需要匹配两次才能消除</div>';
    }
    html += '<div style="margin-top:8px; font-size:12px; color:#999;">在障碍物所在行/列做匹配，即可击中并消除它</div>';
    body.innerHTML = html;
    card.appendChild(body);

    const btn = document.createElement('button');
    btn.textContent = '知道了';
    btn.style.cssText = `
      background: #FF8FA3; color: white; border: none;
      padding: 10px 28px; border-radius: 20px; font-size: 14px;
      cursor: pointer; font-weight: bold;
    `;
    btn.addEventListener('click', () => overlay.remove());
    card.appendChild(btn);

    overlay.appendChild(card);
    this.container.appendChild(overlay);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private startHintTimer(): void {
    this.hintTimer = setTimeout(() => this.showHint(), 4000);
  }

  private resetHintTimer(): void {
    if (this.hintTimer) {
      clearTimeout(this.hintTimer);
      this.hintTimer = null;
    }
    this.renderer.clearHint();
    this.startHintTimer();
  }

  private showHint(): void {
    if (this.gameState.getStatus() !== 'playing') return;
    const goalElement = this.level.goal.element;
    const hint = MatchEngine.findHint(this.board.getGrid(), goalElement);
    if (hint) {
      this.renderer.markHint([hint[0], hint[1]]);
    }
  }

  private async performShuffle(): Promise<void> {
    // Show shuffle message
    const overlay = document.createElement('div');
    overlay.className = 'shuffle-overlay';
    overlay.textContent = '无可用移动，重新洗牌...';
    overlay.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      font-size: 16px;
      z-index: 100;
      pointer-events: none;
    `;
    this.container.querySelector('.board-area')?.appendChild(overlay);

    await this.delay(1000);

    // Shuffle until solvable (max 10 attempts)
    let attempts = 0;
    do {
      this.board.shuffle();
      attempts++;
    } while (!MatchEngine.findHint(this.board.getGrid()) && attempts < 10);

    this.renderer.updateFromBoard();

    overlay.remove();
  }
}
