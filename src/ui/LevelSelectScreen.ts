import { LEVELS } from '../core/LevelConfig';

export class LevelSelectScreen {
  private container: HTMLElement;
  private currentLevel: number;
  private levelStars: Record<number, number>;
  private onSelect: (levelId: number) => void;

  private levelMap: HTMLElement;

  constructor(
    currentLevel: number,
    levelStars: Record<number, number>,
    onSelect: (levelId: number) => void
  ) {
    this.currentLevel = currentLevel;
    this.levelStars = { ...levelStars };
    this.onSelect = onSelect;

    this.container = document.createElement('div');
    this.container.classList.add('screen', 'active');

    const title = document.createElement('h1');
    title.textContent = '选择关卡';
    this.container.appendChild(title);

    this.levelMap = document.createElement('div');
    this.levelMap.classList.add('level-map');
    this.container.appendChild(this.levelMap);

    this.renderButtons();

    const backBtn = document.createElement('button');
    backBtn.textContent = '返回';
    backBtn.style.marginTop = '16px';
    backBtn.style.background = '#D3D3D3';
    backBtn.style.color = '#4A4A4A';
    backBtn.addEventListener('click', () => {
      this.onSelect(0);
    });
    this.container.appendChild(backBtn);
  }

  private renderButtons(): void {
    this.levelMap.innerHTML = '';

    for (const level of LEVELS) {
      const btn = document.createElement('button');
      btn.classList.add('level-btn');
      btn.textContent = String(level.id);

      const stars = this.levelStars[level.id] ?? 0;
      if (stars > 0) {
        const starSpan = document.createElement('span');
        starSpan.textContent = '⭐'.repeat(stars);
        btn.appendChild(starSpan);
      }

      const unlocked = level.id <= this.currentLevel;
      if (unlocked) {
        btn.addEventListener('click', () => {
          this.onSelect(level.id);
        });
      } else {
        btn.disabled = true;
        btn.style.opacity = '0.4';
        btn.style.cursor = 'not-allowed';
      }

      this.levelMap.appendChild(btn);
    }
  }

  update(currentLevel: number, levelStars: Record<number, number>): void {
    this.currentLevel = currentLevel;
    this.levelStars = { ...levelStars };
    this.renderButtons();
  }

  getElement(): HTMLElement {
    return this.container;
  }
}
