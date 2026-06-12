import { Board } from '../core/Board';
import { MatchEngine } from '../core/MatchEngine';
import { GameState } from '../core/GameState';
import { getLevel } from '../core/LevelConfig';
import { BoardRenderer } from './BoardRenderer';
import { SoundManager } from '../systems/SoundManager';
import { ELEMENT_EMOJI } from '../constants';
import type { Position, LevelConfig } from '../types';

export class GameScreen {
  private container: HTMLElement;
  private board: Board;
  private gameState: GameState;
  private renderer: BoardRenderer;
  private sound: SoundManager;
  private level: LevelConfig;
  private onComplete: (result: { won: boolean; stars: number; levelId: number }) => void;

  private scoreEl!: HTMLElement;
  private movesEl!: HTMLElement;
  private goalEl!: HTMLElement;
  private isAnimating = false;
  private hintTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    levelId: number,
    onComplete: (result: { won: boolean; stars: number; levelId: number }) => void
  ) {
    this.onComplete = onComplete;

    const level = getLevel(levelId);
    if (!level) {
      throw new Error(`Level ${levelId} not found`);
    }
    this.level = level;

    this.container = document.createElement('div');
    this.container.classList.add('screen', 'active');

    this.board = new Board();
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

    const backBtn = document.createElement('button');
    backBtn.id = 'back-btn';
    backBtn.textContent = '返回';
    backBtn.addEventListener('click', () => {
      this.onComplete({ won: false, stars: 0, levelId: this.level.id });
    });
    this.container.appendChild(backBtn);

    this.updateHUD();
    this.startHintTimer();
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
    this.scoreEl.textContent = this.formatGoal();
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
      const emoji = ELEMENT_EMOJI[goal.element];
      return `${emoji} ${collected}/${goal.target}`;
    }
    if (goal.type === 'clear') {
      return `清除${goal.target}个障碍`;
    }
    return '';
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
    const easterEgg = await this.processMatches();

    // Deadlock shuffle: if no valid moves, reshuffle automatically
    if (!easterEgg && this.gameState.getStatus() === 'playing') {
      const hint = MatchEngine.findHint(this.board.getGrid());
      if (!hint) {
        await this.performShuffle();
      }
    }

    this.updateHUD();
    this.isAnimating = false;

    if (easterEgg) {
      await this.delay(500);
      this.showEasterEggModal();
      return;
    }

    if (this.gameState.getStatus() !== 'playing') {
      await this.delay(400);
      this.showVictoryOrDefeat();
    }
  }

  private async processMatches(): Promise<boolean> {
    let totalScore = 0;
    const goalElement = this.level.goal.element;
    let targetClearedInChain = 0;
    let bigClearTriggered = false;

    while (MatchEngine.hasMatch(this.board.getGrid())) {
      const matches = MatchEngine.findMatches(this.board.getGrid());
      const specials = MatchEngine.findSpecials(this.board.getGrid());
      const allPositions = matches.flatMap(m => m.positions);

      // Easter egg: 5-match or special triggers instant win
      if (matches.some(m => m.positions.length >= 5) || specials.length > 0) {
        this.renderer.markEliminating(allPositions);
        await this.delay(350);
        this.gameState.forceWin();
        this.showEasterEggModal();
        return true;
      }

      // 1. Show elimination animation
      this.sound.playMatch();
      this.renderer.markEliminating(allPositions);
      await this.delay(350);

      // 2. Actually eliminate
      for (const pos of allPositions) {
        const cell = this.board.getCell(pos.row, pos.col);
        if (cell?.obstacle) {
          this.gameState.recordObstacleCleared();
        }
        if (cell && goalElement && cell.element === goalElement) {
          targetClearedInChain++;
        }
        this.board.setCell(pos.row, pos.col, null);
      }

      // 3. Score and floating text
      for (const match of matches) {
        totalScore += match.positions.length * 10;
        this.gameState.recordMatch(match.element, match.positions.length);
        if (goalElement && match.element === goalElement && match.positions.length > 0) {
          const emoji = ELEMENT_EMOJI[goalElement];
          const centerPos = match.positions[Math.floor(match.positions.length / 2)];
          this.renderer.showFloatingText(centerPos, `${emoji} +${match.positions.length}`);
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
    return false;
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

  private showEasterEggModal(): void {
    const overlay = document.createElement('div');
    overlay.className = 'victory-modal';

    const card = document.createElement('div');

    const title = document.createElement('h2');
    title.textContent = '彩蛋触发！';
    title.style.color = '#FF6B6B';
    title.style.margin = '0 0 8px';
    card.appendChild(title);

    const sub = document.createElement('div');
    sub.textContent = '直接通关！';
    sub.style.color = '#888';
    sub.style.marginBottom = '16px';
    card.appendChild(sub);

    const nextBtn = document.createElement('button');
    nextBtn.textContent = '下一关';
    nextBtn.addEventListener('click', () => {
      this.onComplete({ won: true, stars: 3, levelId: this.level.id });
    });
    card.appendChild(nextBtn);

    overlay.appendChild(card);
    this.container.appendChild(overlay);
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

    const nextBtn = document.createElement('button');
    nextBtn.textContent = '下一关';
    nextBtn.addEventListener('click', () => {
      this.onComplete({ won: true, stars, levelId: this.level.id });
    });
    card.appendChild(nextBtn);

    overlay.appendChild(card);
    this.container.appendChild(overlay);
  }

  private highlightTargets(): void {
    const goal = this.level.goal;
    if (goal.type !== 'collect' || !goal.element) return;
    const targets: Position[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = this.board.getCell(r, c);
        if (cell?.element === goal.element) {
          targets.push({ row: r, col: c });
        }
      }
    }
    this.renderer.markTarget(targets);
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
