import type { LevelConfig, GameStatus, ElementType } from '../types';

export class GameState {
  private score = 0;
  private movesLeft: number;
  private status: GameStatus = 'playing';
  private level: LevelConfig;
  private collectedElements: Record<string, number> = {};
  private clearedObstacles = 0;

  constructor(level: LevelConfig) {
    this.level = level;
    this.movesLeft = level.moves;
  }

  getScore(): number {
    return this.score;
  }

  getMovesLeft(): number {
    return this.movesLeft;
  }

  getStatus(): GameStatus {
    return this.status;
  }

  addScore(points: number): void {
    this.score += points;
    this.checkWin();
  }

  recordMatch(element: ElementType, count: number): void {
    const key = element;
    this.collectedElements[key] = (this.collectedElements[key] || 0) + count;
    this.checkWin();
  }

  recordObstacleCleared(): void {
    this.clearedObstacles++;
    this.checkWin();
  }

  useMove(): void {
    this.movesLeft--;
    if (this.movesLeft <= 0) {
      this.checkEnd();
    }
  }

  private checkWin(): void {
    if (this.status !== 'playing') return;

    const goal = this.level.goal;
    let won = false;

    if (goal.type === 'score') {
      won = this.score >= goal.target;
    } else if (goal.type === 'collect' && goal.element) {
      won = (this.collectedElements[goal.element] || 0) >= goal.target;
    } else if (goal.type === 'clear') {
      won = this.clearedObstacles >= goal.target;
    }

    if (won) {
      this.status = 'won';
    }
  }

  private checkEnd(): void {
    if (this.status === 'playing') {
      this.checkWin();
      if (this.status === 'playing') {
        this.status = 'lost';
      }
    }
  }

  getStars(): number {
    if (this.status !== 'won') return 0;
    const ratio = this.score / this.level.goal.target;
    if (ratio >= 2) return 3;
    if (ratio >= 1.3) return 2;
    return 1;
  }

  getCollectedCount(element: ElementType): number {
    return this.collectedElements[element] || 0;
  }
}
