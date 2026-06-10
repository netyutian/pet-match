import { Board } from '../core/Board';
import { MatchEngine } from '../core/MatchEngine';
import { GameState } from '../core/GameState';
import { getLevel } from '../core/LevelConfig';
import { BoardRenderer } from './BoardRenderer';
import type { Position, LevelConfig } from '../types';

export class GameScreen {
  private container: HTMLElement;
  private levelId: number;
  private onComplete: (result: { won: boolean; stars: number; levelId: number }) => void;
  private board: Board;
  private gameState: GameState;
  private renderer: BoardRenderer;
  private level: LevelConfig;

  private scoreEl!: HTMLElement;
  private movesEl!: HTMLElement;
  private goalEl!: HTMLElement;

  constructor(
    levelId: number,
    onComplete: (result: { won: boolean; stars: number; levelId: number }) => void
  ) {
    this.levelId = levelId;
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

    const hud = this.createHUD();
    this.container.appendChild(hud);

    const boardArea = document.createElement('div');
    boardArea.classList.add('board-area');
    this.container.appendChild(boardArea);

    this.renderer = new BoardRenderer(boardArea);
    this.renderer.setBoard(this.board);
    this.renderer.setSwapHandler(this.handleSwap.bind(this));

    const backBtn = document.createElement('button');
    backBtn.id = 'back-btn';
    backBtn.textContent = '返回';
    backBtn.addEventListener('click', () => {
      this.onComplete({ won: false, stars: 0, levelId: this.levelId });
    });
    this.container.appendChild(backBtn);

    this.updateHUD();
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
    this.scoreEl.textContent = `分数: ${this.gameState.getScore()}`;
    this.movesEl.textContent = `步数: ${this.gameState.getMovesLeft()}`;
    this.goalEl.textContent = this.formatGoal();
  }

  private formatGoal(): string {
    const goal = this.level.goal;
    if (goal.type === 'score') {
      return `${goal.target}分`;
    }
    if (goal.type === 'collect' && goal.element) {
      const collected = this.gameState.getCollectedCount(goal.element);
      return `收集${collected}/${goal.target}个${goal.element}`;
    }
    if (goal.type === 'clear') {
      return `清除${goal.target}个障碍`;
    }
    return '';
  }

  private handleSwap(from: Position, to: Position): void {
    if (this.gameState.getStatus() !== 'playing') {
      return;
    }

    const dr = Math.abs(from.row - to.row);
    const dc = Math.abs(from.col - to.col);
    if (dr + dc !== 1) {
      return;
    }

    this.board.swap(from, to);

    if (!MatchEngine.hasMatch(this.board.getGrid())) {
      this.board.swap(from, to);
      this.renderer.updateFromBoard();
      return;
    }

    this.gameState.useMove();
    this.processMatches();
    this.updateHUD();

    if (this.gameState.getStatus() !== 'playing') {
      setTimeout(() => {
        this.onComplete({
          won: this.gameState.getStatus() === 'won',
          stars: this.gameState.getStars(),
          levelId: this.levelId,
        });
      }, 500);
    }
  }

  private processMatches(): void {
    let totalScore = 0;

    while (MatchEngine.hasMatch(this.board.getGrid())) {
      const matches = MatchEngine.findMatches(this.board.getGrid());

      for (const match of matches) {
        totalScore += match.positions.length * 10;
        this.gameState.recordMatch(match.element, match.positions.length);

        for (const pos of match.positions) {
          const cell = this.board.getCell(pos.row, pos.col);
          if (cell?.obstacle) {
            this.gameState.recordObstacleCleared();
          }
          this.board.setCell(pos.row, pos.col, null);
        }
      }

      this.board.applyGravity();
    }

    this.gameState.addScore(totalScore);
    this.renderer.updateFromBoard();
  }

  getElement(): HTMLElement {
    return this.container;
  }
}
