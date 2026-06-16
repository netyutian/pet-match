import { LEVELS } from '../core/LevelConfig';
import { COLORS } from '../constants';

export class LevelSelectScreen {
  private container: HTMLElement;
  private currentLevel: number;
  private levelStars: Record<number, number>;
  private onSelect: (levelId: number) => void;
  private nodesContainer: HTMLElement;
  private svgPath!: SVGPathElement;

  constructor(
    currentLevel: number,
    levelStars: Record<number, number>,
    onSelect: (levelId: number) => void
  ) {
    this.currentLevel = currentLevel;
    this.levelStars = { ...levelStars };
    this.onSelect = onSelect;

    this.container = document.createElement('div');
    this.container.classList.add('screen', 'active', 'level-select-screen');

    this.container.appendChild(this.createSkyBackground());
    this.container.appendChild(this.createClouds());

    const svg = this.createStairSVG();
    this.container.appendChild(svg);

    this.nodesContainer = document.createElement('div');
    this.nodesContainer.classList.add('stair-nodes');
    this.container.appendChild(this.nodesContainer);

    this.container.appendChild(this.createGrassGround());
    this.container.appendChild(this.createFlowers());

    const backBtn = document.createElement('button');
    backBtn.classList.add('level-back-btn');
    backBtn.textContent = '返回';
    backBtn.addEventListener('click', () => this.onSelect(0));
    this.container.appendChild(backBtn);

    this.renderNodes();
    this.scheduleAutoScroll();
  }

  private createSkyBackground(): HTMLElement {
    const sky = document.createElement('div');
    sky.classList.add('sky-bg');
    return sky;
  }

  private createClouds(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.classList.add('clouds');

    const cloudConfigs = [
      { left: '10%', top: '8%', width: '80px', duration: '30s', delay: '0s' },
      { left: '60%', top: '15%', width: '100px', duration: '40s', delay: '-10s' },
      { left: '30%', top: '5%', width: '60px', duration: '25s', delay: '-5s' },
      { left: '75%', top: '22%', width: '90px', duration: '35s', delay: '-15s' },
      { left: '5%', top: '18%', width: '70px', duration: '28s', delay: '-8s' },
    ];

    for (const cfg of cloudConfigs) {
      const cloud = document.createElement('div');
      cloud.classList.add('cloud');
      cloud.style.left = cfg.left;
      cloud.style.top = cfg.top;
      cloud.style.width = cfg.width;
      cloud.style.animationDuration = cfg.duration;
      cloud.style.animationDelay = cfg.delay;
      wrapper.appendChild(cloud);
    }

    return wrapper;
  }

  private createStairSVG(): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('stair-svg');
    svg.setAttribute('viewBox', '0 0 400 1000');
    svg.setAttribute('preserveAspectRatio', 'xMidYMax meet');

    const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    shadow.setAttribute('d', 'M200,1000 C120,950 60,880 100,820 C140,760 260,760 300,700 C340,640 280,580 220,520 C160,460 80,400 120,340 C160,280 280,280 320,220 C360,160 300,100 200,0');
    shadow.setAttribute('stroke', 'rgba(0,0,0,0.08)');
    shadow.setAttribute('stroke-width', '24');
    shadow.setAttribute('stroke-linecap', 'round');
    shadow.setAttribute('fill', 'none');
    shadow.setAttribute('transform', 'translate(2, 4)');
    svg.appendChild(shadow);

    this.svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.svgPath.setAttribute('d', 'M200,1000 C120,950 60,880 100,820 C140,760 260,760 300,700 C340,640 280,580 220,520 C160,460 80,400 120,340 C160,280 280,280 320,220 C360,160 300,100 200,0');
    this.svgPath.setAttribute('stroke', '#F5F5F5');
    this.svgPath.setAttribute('stroke-width', '24');
    this.svgPath.setAttribute('stroke-linecap', 'round');
    this.svgPath.setAttribute('stroke-dasharray', '30 15');
    this.svgPath.setAttribute('fill', 'none');
    svg.appendChild(this.svgPath);

    return svg;
  }

  private createGrassGround(): HTMLElement {
    const grass = document.createElement('div');
    grass.classList.add('grass-ground', 'ground-layer');
    return grass;
  }

  private createFlowers(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.classList.add('flowers', 'ground-layer');

    const colors = ['#FF6B6B', '#FFD93D', '#FF9FF3', '#FFFFFF'];
    for (let i = 0; i < 14; i++) {
      const flower = document.createElement('div');
      flower.classList.add('flower');
      flower.style.left = `${5 + (i / 13) * 90}%`;
      flower.style.bottom = `${12 + Math.random() * 20}px`;
      flower.style.backgroundColor = colors[i % colors.length];
      flower.style.animationDelay = `${Math.random() * 2}s`;
      wrapper.appendChild(flower);
    }

    return wrapper;
  }

  private renderNodes(): void {
    this.nodesContainer.innerHTML = '';

    const totalLength = this.getTotalLength();
    const segmentLength = totalLength / (LEVELS.length - 1);

    for (let i = 0; i < LEVELS.length; i++) {
      const level = LEVELS[i];
      const point = this.getPointAtLength(i * segmentLength);
      const unlocked = level.id <= this.currentLevel;
      const stars = this.levelStars[level.id] ?? 0;
      const node = this.createNode(level, point, unlocked, stars, i);
      this.nodesContainer.appendChild(node);
    }
  }

  private getTotalLength(): number {
    if (typeof this.svgPath.getTotalLength === 'function') {
      return this.svgPath.getTotalLength();
    }
    return 1000;
  }

  private getPointAtLength(length: number): { x: number; y: number } {
    if (typeof this.svgPath.getPointAtLength === 'function') {
      return this.svgPath.getPointAtLength(length);
    }
    const totalLength = 1000;
    const ratio = length / totalLength;
    return {
      x: 200 + Math.sin(ratio * Math.PI * 3) * 120,
      y: 1000 - ratio * 1000,
    };
  }

  private createNode(
    level: (typeof LEVELS)[0],
    point: { x: number; y: number },
    unlocked: boolean,
    stars: number,
    index: number
  ): HTMLElement {
    const node = document.createElement('div');
    node.classList.add('level-node');
    if (!unlocked) {
      node.classList.add('locked');
    }
    if (level.id === this.currentLevel) {
      node.classList.add('current');
    }
    node.style.left = `${point.x}px`;
    node.style.top = `${point.y}px`;
    node.style.animationDelay = `${index * 80}ms`;

    const element = level.goal.element ?? 'rat';

    const avatarRing = document.createElement('div');
    avatarRing.classList.add('avatar-ring');
    avatarRing.style.backgroundColor = COLORS[element] ?? '#FFB6C1';

    const img = document.createElement('img');
    img.src = `./assets/avatars/${element}.png`;
    img.alt = element;
    avatarRing.appendChild(img);
    node.appendChild(avatarRing);

    if (stars > 0) {
      const starsWrapper = document.createElement('div');
      starsWrapper.classList.add('stars-wrapper');
      for (let s = 0; s < stars; s++) {
        const star = document.createElement('span');
        star.classList.add('star');
        star.textContent = '⭐';
        starsWrapper.appendChild(star);
      }
      node.appendChild(starsWrapper);
    }

    const label = document.createElement('div');
    label.classList.add('level-label');
    label.textContent = `第${level.id}关`;
    node.appendChild(label);

    if (unlocked) {
      node.addEventListener('click', () => this.onSelect(level.id));
    }

    return node;
  }

  private scheduleAutoScroll(): void {
    requestAnimationFrame(() => {
      const currentNode = this.nodesContainer.querySelector('.level-node.current') as HTMLElement;
      if (currentNode && this.container.scrollHeight > this.container.clientHeight) {
        const nodeTop = currentNode.offsetTop;
        const containerHeight = this.container.clientHeight;
        const targetScroll = nodeTop - containerHeight * 0.35;
        this.container.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
      }
    });
  }

  update(currentLevel: number, levelStars: Record<number, number>): void {
    this.currentLevel = currentLevel;
    this.levelStars = { ...levelStars };
    this.renderNodes();
    this.scheduleAutoScroll();
  }

  getElement(): HTMLElement {
    return this.container;
  }
}
