# 关卡选择页面重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将关卡选择页面从垂直列表升级为效果图所示的"天梯攀登"布局：蜿蜒阶梯、蓝天白云草地背景、生肖圆形头像、星级展示。

**Architecture:** 保持现有 `LevelSelectScreen` 的公共接口不变（`constructor` 和 `update` 的签名不变）。内部重写为分层 DOM 结构：CSS 渐变背景 + SVG 蜿蜒阶梯 + 绝对定位的关卡节点。所有样式用纯 CSS 实现，无新增图片资源，复用现有 `/assets/avatars/*.png`。

**Tech Stack:** Vite + TypeScript + Vitest (jsdom)。无框架，纯 DOM 操作。

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/ui/LevelSelectScreen.ts` | Modify | 重写 DOM 结构：背景层、SVG 阶梯、节点定位、动画、交互 |
| `style.css` | Modify | 新增约 200 行样式：背景、云、阶梯、节点、草地、花、动画、响应式 |
| `tests/ui/LevelSelectScreen.test.ts` | Create | 测试 DOM 结构、节点数量、解锁/锁定状态、星级显示、点击事件 |
| `src/main.ts` | No change | 接口不变，无需修改 |
| `src/core/LevelConfig.ts` | No change | 无需修改 |

---

### Task 1: 测试先行

**Files:**
- Create: `tests/ui/LevelSelectScreen.test.ts`

- [ ] **Step 1: 编写测试**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { LevelSelectScreen } from '../../src/ui/LevelSelectScreen';

describe('LevelSelectScreen', () => {
  it('renders all 20 level nodes', () => {
    const screen = new LevelSelectScreen(1, {}, vi.fn());
    const nodes = screen.getElement().querySelectorAll('.level-node');
    expect(nodes.length).toBe(20);
  });

  it('renders unlocked nodes without locked class', () => {
    const screen = new LevelSelectScreen(3, {}, vi.fn());
    const nodes = screen.getElement().querySelectorAll('.level-node');
    const node1 = nodes[0] as HTMLElement;
    const node3 = nodes[2] as HTMLElement;
    expect(node1.classList.contains('locked')).toBe(false);
    expect(node3.classList.contains('locked')).toBe(false);
  });

  it('renders locked nodes with locked class', () => {
    const screen = new LevelSelectScreen(2, {}, vi.fn());
    const nodes = screen.getElement().querySelectorAll('.level-node');
    const node3 = nodes[2] as HTMLElement;
    expect(node3.classList.contains('locked')).toBe(true);
  });

  it('renders correct avatar src for each level', () => {
    const screen = new LevelSelectScreen(1, {}, vi.fn());
    const nodes = screen.getElement().querySelectorAll('.level-node');
    const img1 = nodes[0].querySelector('img') as HTMLImageElement;
    const img2 = nodes[1].querySelector('img') as HTMLImageElement;
    expect(img1.src).toContain('/assets/avatars/rat.png');
    expect(img2.src).toContain('/assets/avatars/dog.png');
  });

  it('renders stars for completed levels', () => {
    const screen = new LevelSelectScreen(2, { 1: 3, 2: 1 }, vi.fn());
    const nodes = screen.getElement().querySelectorAll('.level-node');
    const stars1 = nodes[0].querySelectorAll('.star');
    expect(stars1.length).toBe(3);
    const stars2 = nodes[1].querySelectorAll('.star');
    expect(stars2.length).toBe(1);
  });

  it('hides stars for 0-star levels', () => {
    const screen = new LevelSelectScreen(1, {}, vi.fn());
    const nodes = screen.getElement().querySelectorAll('.level-node');
    const stars = nodes[0].querySelectorAll('.star');
    expect(stars.length).toBe(0);
  });

  it('calls onSelect when unlocked node is clicked', () => {
    const onSelect = vi.fn();
    const screen = new LevelSelectScreen(2, {}, onSelect);
    const nodes = screen.getElement().querySelectorAll('.level-node');
    const node1 = nodes[0] as HTMLElement;
    node1.click();
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('does not call onSelect when locked node is clicked', () => {
    const onSelect = vi.fn();
    const screen = new LevelSelectScreen(1, {}, onSelect);
    const nodes = screen.getElement().querySelectorAll('.level-node');
    const node2 = nodes[1] as HTMLElement;
    node2.click();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders back button', () => {
    const screen = new LevelSelectScreen(1, {}, vi.fn());
    const backBtn = screen.getElement().querySelector('.level-back-btn');
    expect(backBtn).not.toBeNull();
  });

  it('calls onSelect(0) when back button is clicked', () => {
    const onSelect = vi.fn();
    const screen = new LevelSelectScreen(1, {}, onSelect);
    const backBtn = screen.getElement().querySelector('.level-back-btn') as HTMLElement;
    backBtn.click();
    expect(onSelect).toHaveBeenCalledWith(0);
  });

  it('update() re-renders with new state', () => {
    const onSelect = vi.fn();
    const screen = new LevelSelectScreen(1, {}, onSelect);
    screen.update(2, { 1: 3 });
    const nodes = screen.getElement().querySelectorAll('.level-node');
    const node2 = nodes[1] as HTMLElement;
    expect(node2.classList.contains('locked')).toBe(false);
    const stars = nodes[0].querySelectorAll('.star');
    expect(stars.length).toBe(3);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npx vitest run tests/ui/LevelSelectScreen.test.ts`

Expected: FAIL — `LevelSelectScreen` 模块不存在或 `locked` 类未找到。

- [ ] **Step 3: 提交测试文件**

```bash
git add tests/ui/LevelSelectScreen.test.ts
git commit -m "test: add LevelSelectScreen tests for redesign"
```

---

### Task 2: LevelSelectScreen 实现

**Files:**
- Modify: `src/ui/LevelSelectScreen.ts`

- [ ] **Step 1: 重写 LevelSelectScreen 类**

```typescript
import { LEVELS } from '../core/LevelConfig';
import { COLORS } from '../constants';
import type { ElementType } from '../types';

export class LevelSelectScreen {
  private container: HTMLElement;
  private currentLevel: number;
  private levelStars: Record<number, number>;
  private onSelect: (levelId: number) => void;
  private nodesContainer: HTMLElement;
  private svgPath: SVGPathElement;

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
    grass.classList.add('grass-ground');
    return grass;
  }

  private createFlowers(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.classList.add('flowers');

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

    const element = (level.goal as { element: string }).element as ElementType;

    const avatarRing = document.createElement('div');
    avatarRing.classList.add('avatar-ring');
    avatarRing.style.backgroundColor = COLORS[element] ?? '#FFB6C1';

    const img = document.createElement('img');
    img.src = `/assets/avatars/${element}.png`;
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
```

- [ ] **Step 2: 运行测试，确认通过**

Run: `npx vitest run tests/ui/LevelSelectScreen.test.ts`

Expected: PASS — 10 tests pass.

- [ ] **Step 3: 提交实现**

```bash
git add src/ui/LevelSelectScreen.ts
git commit -m "feat: rewrite LevelSelectScreen with stair layout and zodiac avatars"
```

---

### Task 3: CSS 样式

**Files:**
- Modify: `style.css`

在 `style.css` 文件末尾追加以下内容（在现有 `/* Menu screen */` 样式之后）：

- [ ] **Step 1: 添加背景层、阶梯、节点样式**

```css
/* Level select screen */
.level-select-screen {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  padding: 0;
  background: none;
}

.sky-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(180deg, #4A90E2 0%, #87CEEB 35%, #E0F6FF 70%, #FFF8E7 100%);
  min-height: 100%;
}

/* Clouds */
.clouds {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.cloud {
  position: absolute;
  height: 30px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  opacity: 0.85;
  animation: cloudDrift linear infinite;
}

.cloud::before {
  content: '';
  position: absolute;
  left: -20px;
  top: -10px;
  width: 50px;
  height: 40px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 50%;
}

.cloud::after {
  content: '';
  position: absolute;
  right: -20px;
  top: -5px;
  width: 40px;
  height: 35px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 50%;
}

@keyframes cloudDrift {
  0% { transform: translateX(-120px); }
  100% { transform: translateX(calc(100vw + 120px)); }
}

/* Stair SVG */
.stair-svg {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 400px;
  height: 100%;
  z-index: 2;
  pointer-events: none;
}

/* Stair nodes */
.stair-nodes {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 400px;
  height: 100%;
  z-index: 3;
  pointer-events: none;
}

.level-node {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  pointer-events: auto;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  animation: nodePopIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  transition: transform 0.15s ease;
}

.level-node:active {
  transform: translate(-50%, -50%) scale(0.9);
}

.level-node.locked {
  cursor: not-allowed;
  filter: grayscale(100%) brightness(0.7);
}

.level-node.locked .avatar-ring {
  border-color: #CCCCCC;
}

.level-node.locked .level-label {
  background: #999999;
}

.level-node.current .avatar-ring {
  animation: breathe 2s ease infinite;
}

.level-node.current::before {
  content: '';
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  z-index: -1;
  animation: pulseRing 1.5s ease infinite;
}

@keyframes nodePopIn {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes pulseRing {
  0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
  100% { box-shadow: 0 0 0 16px rgba(255, 215, 0, 0); }
}

.avatar-ring {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 4px solid #FFD700;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.avatar-ring img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.stars-wrapper {
  display: flex;
  gap: 1px;
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
}

.star {
  font-size: 12px;
  line-height: 1;
}

.level-label {
  background: #4A90E2;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

/* Grass and flowers */
.grass-ground {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 18vh;
  min-height: 120px;
  z-index: 4;
  background: linear-gradient(180deg, #90EE90 0%, #32CD32 60%, #228B22 100%);
  border-radius: 50% 50% 0 0 / 20px 20px 0 0;
  pointer-events: none;
}

.flowers {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 18vh;
  min-height: 120px;
  z-index: 5;
  pointer-events: none;
  overflow: hidden;
}

.flower {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: sway 2s ease-in-out infinite;
}

.flower::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -10px;
  width: 2px;
  height: 12px;
  background: #228B22;
  transform: translateX(-50%);
  border-radius: 1px;
}

@keyframes sway {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  50% { transform: translateX(3px) rotate(5deg); }
}

/* Back button */
.level-back-btn {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  color: #4A4A4A;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .avatar-ring {
    width: 64px;
    height: 64px;
    border-width: 3px;
  }

  .level-label {
    font-size: 12px;
    padding: 3px 10px;
  }

  .star {
    font-size: 10px;
  }

  .stair-svg,
  .stair-nodes {
    max-width: 320px;
  }
}

@media (max-width: 375px) {
  .avatar-ring {
    width: 52px;
    height: 52px;
  }

  .level-label {
    font-size: 11px;
    padding: 2px 8px;
  }

  .flower:nth-child(n+9) {
    display: none;
  }
}

@media (min-width: 769px) {
  .stair-svg,
  .stair-nodes {
    max-width: 600px;
  }

  .avatar-ring {
    width: 96px;
    height: 96px;
  }

  .level-label {
    font-size: 16px;
  }
}
```

- [ ] **Step 2: 运行测试，确认通过**

Run: `npx vitest run tests/ui/LevelSelectScreen.test.ts`

Expected: PASS — 10 tests pass。

- [ ] **Step 3: 浏览器验证**

Run: `npm run dev`

打开浏览器访问 `http://localhost:5173`（或实际端口），点击"开始游戏"进入关卡选择页面，验证：
1. 20 个关卡节点沿阶梯排列
2. 已解锁关卡显示彩色头像，未解锁显示灰色
3. 星级正确显示
4. 当前最高解锁关卡有脉动光环
5. 点击已解锁关卡可进入游戏
6. 返回按钮可回到菜单
7. 背景有天空、云、草地、花朵

- [ ] **Step 4: 提交 CSS**

```bash
git add style.css
git commit -m "style: add level select stair layout, background, and animations"
```

---

### Task 4: 清理旧样式

**Files:**
- Modify: `style.css`

- [ ] **Step 1: 删除废弃的 level-select 旧样式**

从 `style.css` 中删除以下选择器（它们已被新样式替代）：

```css
/* 删除以下代码块 */
.level-map { ... }
.level-btn { ... }
.level-btn span { ... }
```

- [ ] **Step 2: 运行测试，确认通过**

Run: `npx vitest run`

Expected: PASS — 所有测试通过。

- [ ] **Step 3: 提交**

```bash
git add style.css
git commit -m "style: remove obsolete level-select styles"
```

---

## Self-Review Checklist

**1. Spec coverage:**

| Spec 需求 | 对应 Task |
|-----------|-----------|
| 天空渐变背景 | Task 3 CSS `.sky-bg` |
| 浮动云朵 | Task 2 `createClouds()` + Task 3 `.clouds` 动画 |
| SVG 蜿蜒阶梯 | Task 2 `createStairSVG()` + Task 3 `.stair-svg` |
| 节点沿阶梯定位 | Task 2 `renderNodes()` + `getPointAtLength()` |
| 已解锁彩色头像 | Task 2 `createNode()` + Task 3 `.avatar-ring` |
| 未解锁灰色头像 | Task 2 `locked` 类 + Task 3 `.level-node.locked` |
| 星级显示 | Task 2 `stars-wrapper` + Task 3 `.star` |
| 关卡标签"第X关" | Task 2 `level-label` + Task 3 `.level-label` |
| 进入动画 | Task 3 `nodePopIn` 动画 + Task 2 `animationDelay` |
| 头像呼吸 | Task 3 `breathe` 动画 + Task 2 `current` 类 |
| 最新关卡高亮 | Task 3 `pulseRing` 动画 + Task 2 `current` 类 |
| 自动滚动 | Task 2 `scheduleAutoScroll()` |
| 草地花朵 | Task 2 `createGrassGround()` + `createFlowers()` + Task 3 CSS |
| 响应式适配 | Task 3 `@media` 断点 |
| 返回按钮 | Task 2 `level-back-btn` + Task 3 CSS |

**2. Placeholder scan:** 无 TBD、TODO、"implement later"、"add appropriate" 等占位符。所有步骤包含完整代码。

**3. Type consistency:**
- `LevelSelectScreen` 构造函数签名与旧版完全一致：`constructor(currentLevel, levelStars, onSelect)`
- `update(currentLevel, levelStars)` 签名与旧版完全一致
- `getElement()` 返回类型与旧版完全一致
- 无类型不匹配。

**4. 测试覆盖：** 10 个测试覆盖节点渲染、解锁状态、头像路径、星级、点击事件、返回按钮、update 重新渲染。

---

**Plan complete and saved to `docs/superpowers/plans/2026-06-12-level-select-redesign.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** — 我为每个 Task 派一个子代理，完成后我检查再推进下一个

**2. Inline Execution** — 我在当前会话中直接执行，逐个完成任务

**Which approach?**