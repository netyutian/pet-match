# 消消乐多端响应式布局重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 对消消乐前端进行响应式布局重构，使棋盘、HUD、菜单、关卡选择和 3D 场景在手机、Pad、桌面浏览器上均能良好显示。

**Architecture:** 采用 CSS 自定义属性（变量）集中管理尺寸令牌，通过 media query 按断点切换变量值。JS 中移除硬编码 px，改为读取 CSS 类或动态计算。保持无框架的轻量风格，不引入新依赖。

**Tech Stack:** Vite, TypeScript, vanilla DOM, CSS custom properties, media queries, Vitest (jsdom)

## Global Constraints

- 无前端框架，所有 UI 通过原生 DOM 操作
- 不引入第三方响应式库或 CSS 框架
- 不改动画时长、游戏逻辑、交互方式
- 现有测试必须在每一步后保持通过
- 断点体系：compact (<=360px), mobile (361-768px), tablet (769-1024px), desktop (>=1025px), landscape-short (max-height:500px + landscape)

---

### Task 1: 重构 style.css 核心响应式层

**Files:**
- Modify: `style.css`

**Interfaces:**
- Produces: CSS 自定义属性 `:root` 及断点覆盖值，供后续所有组件使用

- [ ] **Step 1: 在 style.css 顶部定义 CSS 变量体系**

  在 `*` 选择器之后插入：

  ```css
  :root {
    --board-max-width: 360px;
    --board-gap: 2px;
    --board-padding: 6px;
    --cell-radius: 10px;
    --hud-max-width: 360px;
    --hud-padding: 8px;
    --hud-font-size: 13px;
    --font-base: 14px;
    --btn-padding: 10px 20px;
    --btn-font-size: 15px;
    --menu-grid-max-width: 280px;
    --level-svg-max-width: 340px;
    --avatar-ring-size: 64px;
    --modal-max-width: 300px;
  }

  @media (min-width: 361px) {
    :root {
      --board-max-width: 420px;
      --hud-max-width: 420px;
      --hud-font-size: 14px;
      --font-base: 16px;
      --btn-font-size: 16px;
      --menu-grid-max-width: 320px;
      --level-svg-max-width: 400px;
      --avatar-ring-size: 80px;
      --modal-max-width: 340px;
    }
  }

  @media (min-width: 769px) {
    :root {
      --board-max-width: 520px;
      --board-gap: 3px;
      --board-padding: 8px;
      --cell-radius: 14px;
      --hud-max-width: 520px;
      --hud-padding: 14px;
      --hud-font-size: 16px;
      --font-base: 17px;
      --btn-padding: 12px 28px;
      --btn-font-size: 17px;
      --menu-grid-max-width: 400px;
      --level-svg-max-width: 560px;
      --avatar-ring-size: 96px;
      --modal-max-width: 420px;
    }
  }

  @media (min-width: 1025px) {
    :root {
      --board-max-width: 600px;
      --board-gap: 4px;
      --hud-max-width: 600px;
      --hud-font-size: 18px;
      --font-base: 18px;
      --btn-padding: 14px 32px;
      --btn-font-size: 18px;
      --menu-grid-max-width: 480px;
      --level-svg-max-width: 680px;
      --avatar-ring-size: 110px;
      --modal-max-width: 480px;
    }
  }

  @media (max-height: 500px) and (orientation: landscape) {
    :root {
      --board-max-width: min(320px, 85vh);
      --hud-max-width: min(320px, 85vh);
      --hud-padding: 6px;
      --hud-font-size: 12px;
      --font-base: 13px;
      --btn-padding: 8px 16px;
      --btn-font-size: 13px;
    }
  }
  ```

- [ ] **Step 2: 清理重复 keyframes 并统一基础样式**

  删除文件中重复的 `@keyframes eliminate` 和 `@keyframes fallIn`（当前有两套），只保留一套。

  将 `button` 的 `padding: 12px 24px; font-size: 16px;` 改为：
  ```css
  button {
    padding: var(--btn-padding);
    font-size: var(--btn-font-size);
  }
  ```

  将 `h1` 的 `font-size: 28px;` 改为 `font-size: calc(var(--font-base) * 1.75);`

- [ ] **Step 3: 统一棋盘相关样式使用变量**

  修改 `.board-grid`：
  ```css
  .board-grid {
    background: #FFF5F0;
    padding: var(--board-padding);
    border-radius: 16px;
    max-width: var(--board-max-width);
    width: 100%;
    gap: var(--board-gap);
  }
  ```
  （移除原 `max-width: 400px` 的硬编码，改为 `var(--board-max-width)`）

  修改 `.board-cell`：
  ```css
  .board-cell {
    aspect-ratio: 1;
    border-radius: var(--cell-radius);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    user-select: none;
    border: 3px solid transparent;
    background-color: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  ```
  （添加 `border-radius: var(--cell-radius)`）

  修改 `.game-screen .board-grid`：
  ```css
  .game-screen .board-grid {
    background: rgba(255, 255, 255, 0.06);
    padding: var(--board-padding);
    border-radius: 18px;
    max-width: var(--board-max-width);
    width: 100%;
    gap: var(--board-gap);
    box-shadow:
      0 8px 28px rgba(0, 0, 0, 0.35),
      inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  }
  ```
  （移除 `max-width: 460px` 的硬编码，添加 `gap: var(--board-gap)`）

  修改 `.game-screen .board-cell`：
  ```css
  .game-screen .board-cell {
    border-radius: var(--cell-radius);
    border-width: 2px;
    background-color: rgba(255, 255, 255, 0.96);
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.25),
      inset 0 -2px 0 rgba(0, 0, 0, 0.08);
  }
  ```
  （将 `border-radius: 14px` 改为 `var(--cell-radius)`）

- [ ] **Step 4: 统一 HUD 和弹窗使用变量**

  修改 `.game-hud`：
  ```css
  .game-hud {
    display: flex;
    justify-content: space-around;
    width: 100%;
    max-width: var(--hud-max-width);
    padding: var(--hud-padding);
    background: white;
    border-radius: 16px;
    margin-bottom: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }
  ```

  修改 `.hud-item`：
  ```css
  .hud-item {
    font-size: var(--hud-font-size);
    font-weight: 600;
    color: #6B4F4F;
  }
  ```

  修改 `.victory-modal > div` 的 `max-width`：
  ```css
  .victory-modal > div {
    background: #FFF8F0;
    padding: 32px 24px;
    border-radius: 24px;
    text-align: center;
    max-width: var(--modal-max-width);
    width: 90%;
    animation: popIn 0.4s ease;
  }
  ```
  （将 `340px` 改为 `var(--modal-max-width)`）

  修改 `.modal > div`：
  ```css
  .modal > div {
    background: white;
    padding: 20px;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: var(--modal-max-width);
    width: 100%;
  }
  ```
  （将 `320px` 改为 `var(--modal-max-width)`）

- [ ] **Step 5: 统一菜单和关卡选择使用变量**

  修改 `.menu-title`：
  ```css
  .menu-title {
    font-size: calc(var(--font-base) * 2.25);
    color: #FFD700;
    text-shadow: 2px 2px 0 #FF8C00, -1px -1px 0 #FFF;
    margin-bottom: 24px;
    font-weight: 800;
    letter-spacing: 2px;
  }
  ```
  （将 `36px` 改为 `calc(var(--font-base) * 2.25)`）

  修改 `.menu-avatar-grid`：
  ```css
  .menu-avatar-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    max-width: var(--menu-grid-max-width);
    width: 100%;
    margin-bottom: 32px;
  }
  ```

  修改 `.menu-start-btn`：
  ```css
  .menu-start-btn {
    background: linear-gradient(180deg, #FFD700 0%, #FFA500 100%);
    color: #fff;
    font-size: calc(var(--btn-font-size) * 1.15);
    font-weight: 700;
    padding: var(--btn-padding);
    border-radius: 32px;
    border: 2px solid #FF8C00;
    box-shadow: 0 4px 12px rgba(255, 140, 0, 0.4);
    margin-bottom: 12px;
    text-shadow: 1px 1px 0 rgba(0,0,0,0.2);
  }
  ```
  （将 `font-size: 20px` 改为 `calc(var(--btn-font-size) * 1.15)`）

  修改 `.stair-svg, .stair-nodes`：
  ```css
  .stair-svg,
  .stair-nodes {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: var(--level-svg-max-width);
    height: 100%;
    pointer-events: none;
  }
  ```
  （将 `400px` 改为 `var(--level-svg-max-width)`）

  修改 `.avatar-ring`：
  ```css
  .avatar-ring {
    width: var(--avatar-ring-size);
    height: var(--avatar-ring-size);
    border-radius: 50%;
    border: 4px solid #FFD700;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
  }
  ```
  （将 `80px` 改为 `var(--avatar-ring-size)`）

  删除原有的 `@media (max-width: 768px)` 和 `@media (max-width: 375px)` 和 `@media (min-width: 769px)` 中关于 `.avatar-ring`、`.level-label`、`.star`、`.stair-svg` 的硬编码尺寸覆盖（因为现在由 CSS 变量统一管理，媒体查询已覆盖）。

  删除原有的 `@media (max-width: 768px)` 和 `@media (min-width: 769px)` 规则块中只涉及上述已被变量替代的属性。

  保留 `@media (min-width: 500px)` 的 `.app-container` / `.screen` 限制，因为它控制的是屏幕容器居中对齐，与变量体系无关。

- [ ] **Step 6: 修复 floating-text 居中偏移**

  修改 `.floating-text`：
  ```css
  .floating-text {
    position: absolute;
    pointer-events: none;
    font-size: 16px;
    font-weight: 700;
    color: #FF6B6B;
    z-index: 20;
    animation: floatUp 0.8s ease forwards;
    transform: translateX(-50%);
  }
  ```
  （添加 `transform: translateX(-50%)`，用于配合 JS 中移除 `-20px` 硬偏移）

- [ ] **Step 7: 运行现有测试确认不破坏基础样式**

  Run: `npm run test`
  Expected: 所有现有测试通过（当前测试主要覆盖游戏逻辑，不受 CSS 变量影响）

- [ ] **Step 8: Commit**

  ```bash
  git add style.css
  git commit -m "style: add responsive CSS variables and breakpoints

- Introduce CSS custom properties for board, HUD, menu, level-select sizes
- Add 4 breakpoints: compact, mobile, tablet, desktop, landscape-short
- Remove duplicate keyframes and consolidate responsive overrides
- Unify max-width, font-size, padding, gap through variables

Co-Authored-By: Claude <noreply@anthropic.com>"
  ```

---

### Task 2: 重构 BoardRenderer.ts 移除硬编码 px

**Files:**
- Modify: `src/ui/BoardRenderer.ts`

**Interfaces:**
- Consumes: CSS 变量已定义（`--board-max-width`, `--board-gap`, `--cell-radius`）
- Produces: `BoardRenderer` 不再依赖硬编码 px，滑动阈值动态计算

- [ ] **Step 1: 移除 grid 内联样式中的硬编码**

  在 `setupContainer()` 中，将：
  ```typescript
    this.gridEl.style.display = 'grid';
    this.gridEl.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 1fr)`;
    this.gridEl.style.gap = '2px';
    this.gridEl.style.maxWidth = '400px';
    this.gridEl.style.width = '100%';
    this.gridEl.style.aspectRatio = '1';
    this.gridEl.style.touchAction = 'none';
  ```
  改为：
  ```typescript
    this.gridEl.style.display = 'grid';
    this.gridEl.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 1fr)`;
    this.gridEl.style.width = '100%';
    this.gridEl.style.aspectRatio = '1';
    this.gridEl.style.touchAction = 'none';
  ```
  （移除 `gap` 和 `maxWidth` 的硬编码，由 CSS 的 `.board-grid` 和 `.game-screen .board-grid` 控制）

- [ ] **Step 2: 移除 cell 内联样式中的硬编码 borderRadius**

  在 `createCellElement()` 中，将：
  ```typescript
    cellEl.style.borderRadius = '12px';
    cellEl.style.display = 'flex';
    cellEl.style.alignItems = 'center';
    cellEl.style.justifyContent = 'center';
    cellEl.style.cursor = 'grab';
    cellEl.style.userSelect = 'none';
    cellEl.style.transition = 'transform 0.15s ease';
    cellEl.style.setProperty('-webkit-tap-highlight-color', 'transparent');
  ```
  改为：
  ```typescript
    cellEl.style.display = 'flex';
    cellEl.style.alignItems = 'center';
    cellEl.style.justifyContent = 'center';
    cellEl.style.cursor = 'grab';
    cellEl.style.userSelect = 'none';
    cellEl.style.transition = 'transform 0.15s ease';
    cellEl.style.setProperty('-webkit-tap-highlight-color', 'transparent');
  ```
  （移除 `borderRadius: '12px'`，由 CSS 的 `.board-cell` / `.game-screen .board-cell` 控制）

- [ ] **Step 3: 将滑动阈值 THRESHOLD 改为动态计算**

  在 `BoardRenderer` 中添加方法：
  ```typescript
  private getSwipeThreshold(): number {
    const cell = this.cells[0]?.[0];
    if (!cell) return 24;
    return cell.getBoundingClientRect().width * 0.3;
  }
  ```

  在 `resolveDirection()` 中，将：
  ```typescript
    const THRESHOLD = 24;
    if (Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) return null;
  ```
  改为：
  ```typescript
    const threshold = this.getSwipeThreshold();
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return null;
  ```

- [ ] **Step 4: 修复 showFloatingText 的硬编码 -20px 偏移**

  在 `showFloatingText()` 中，将：
  ```typescript
    floatEl.style.left = `${rect.left - gridRect.left + rect.width / 2 - 20}px`;
  ```
  改为：
  ```typescript
    floatEl.style.left = `${rect.left - gridRect.left + rect.width / 2}px`;
  ```
  （CSS 中已添加 `transform: translateX(-50%)`，实现居中，不再依赖硬编码的 20px 半宽估计）

- [ ] **Step 5: 运行测试**

  Run: `npm run test`
  Expected: 全部通过。BoardRenderer 是纯 UI 类，现有测试可能不直接覆盖，但需确保构建不报错。

- [ ] **Step 6: Commit**

  ```bash
  git add src/ui/BoardRenderer.ts
  git commit -m "refactor: remove hardcoded px from BoardRenderer

- Remove inline gap and maxWidth from gridEl, let CSS control
- Remove inline borderRadius from cellEl, let CSS control
- Make swipe threshold dynamic based on actual cell width
- Fix floating text offset using CSS translateX(-50%)

Co-Authored-By: Claude <noreply@anthropic.com>"
  ```

---

### Task 3: 重构 GameScreen.ts 弹窗适配 CSS 变量

**Files:**
- Modify: `src/ui/GameScreen.ts`

**Interfaces:**
- Consumes: CSS 变量 `--modal-max-width`

- [ ] **Step 1: 移除 showObstacleHint 弹窗的硬编码 max-width**

  在 `showObstacleHint()` 中，将 `card` 的 `style.cssText` 中的 `max-width: 320px` 移除：
  ```typescript
    card.style.cssText = `
      background: #fff; border-radius: 16px; padding: 24px;
      width: 100%; text-align: center;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    `;
  ```
  （原代码有 `max-width: 320px;`，现删除，由 CSS 的 `.modal > div` 或自定义类控制）

  同时给 `card` 添加 class 以便 CSS 控制：
  ```typescript
    card.className = 'modal-card';
  ```

  在 `style.css` 的 `.modal > div` 选择器已经覆盖，但这里卡片不是 `.modal` 的子元素。需要在 `style.css` 中添加：
  ```css
  .obstacle-hint-modal .modal-card {
    max-width: var(--modal-max-width);
  }
  ```
  （等等，这涉及 style.css 修改。由于 Task 1 已修改 style.css，这里需要在 Task 1 中预留或在本 Task 中补充。）

  更简单的方案：直接给 `card` 添加 `className = 'modal-card'`，然后在 `style.css` 中添加 `.modal-card { max-width: var(--modal-max-width); }`。
  这个 CSS 改动应该在 Task 1 中完成，但可以在 Task 3 中补充。

  为了计划的自洽，我改为：在 Task 1 的 Step 4 中，同时添加 `.modal-card` 类。让我重新检查...

  实际上，在 `showObstacleHint` 中，`overlay` 的 `className` 是 `obstacle-hint-modal`，`card` 没有 class。在 CSS 中已经有 `.modal > div` 控制 `max-width`，但 `obstacle-hint-modal` 不是 `.modal`。

  所以需要在 `style.css` 中添加：
  ```css
  .obstacle-hint-modal > div {
    max-width: var(--modal-max-width);
  }
  ```
  （这个改动放在 Task 1 的 Step 4 中补充。）

  在 `showObstacleHint` 中移除 `max-width: 320px` 即可。

- [ ] **Step 2: 移除 showVictoryModal 中可能的硬编码（如需要）**

  检查 `showVictoryModal`：`overlay.className = 'victory-modal'`，`card` 没有 class。CSS 中 `.victory-modal > div` 已使用 `var(--modal-max-width)`（在 Task 1 中已改），所以无需改动 JS。

- [ ] **Step 3: 运行测试**

  Run: `npm run test`
  Expected: 全部通过

- [ ] **Step 4: Commit**

  ```bash
  git add src/ui/GameScreen.ts style.css
  git commit -m "refactor: remove hardcoded modal max-width from GameScreen

- Obstacle hint card max-width now controlled by CSS variable
- Add .obstacle-hint-modal > div selector in style.css

Co-Authored-By: Claude <noreply@anthropic.com>"
  ```

---

### Task 4: 重构 Home3DScreen.ts 画布容器化

**Files:**
- Modify: `src/ui/Home3DScreen.ts`

**Interfaces:**
- Consumes: `this.container` 的 `clientWidth/clientHeight`

- [ ] **Step 1: 将画布尺寸从 window 改为容器**

  在 `init3D()` 中，将：
  ```typescript
    const w = window.innerWidth;
    const h = window.innerHeight;
  ```
  改为：
  ```typescript
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
  ```

  在 `onResize()` 中，将：
  ```typescript
    const w = window.innerWidth;
    const h = window.innerHeight;
  ```
  改为：
  ```typescript
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
  ```

- [ ] **Step 2: 确保容器尺寸在 resize 时正确更新**

  `onResize()` 本身已经绑定到 `window.addEventListener('resize', ...)`，当窗口变化时，父容器 `.screen` 的尺寸也会变化（如果 CSS 限制了 `max-width`）。`this.container.clientWidth` 会正确反映受限后的宽度。

  无需额外改动。

- [ ] **Step 3: 运行测试**

  Run: `npm run test`
  Expected: 全部通过。3D 场景是运行时渲染，现有测试不覆盖，但需确保构建不报错。

- [ ] **Step 4: Commit**

  ```bash
  git add src/ui/Home3DScreen.ts
  git commit -m "refactor: base 3D canvas size on container instead of window

- Use container.clientWidth/Height instead of window.innerWidth/Height
- Ensures canvas respects responsive container bounds

Co-Authored-By: Claude <noreply@anthropic.com>"
  ```

---

### Task 5: 清理旧媒体查询和验证视觉

**Files:**
- Modify: `style.css`

- [ ] **Step 1: 删除 style.css 中已被变量替代的旧媒体查询**

  删除以下旧规则（如果仍存在）：
  ```css
  @media (max-width: 768px) {
    .avatar-ring { width: 64px; height: 64px; border-width: 3px; }
    .level-label { font-size: 12px; padding: 3px 10px; }
    .star { font-size: 10px; }
    .stair-svg, .stair-nodes { max-width: 320px; }
  }

  @media (max-width: 375px) {
    .avatar-ring { width: 52px; height: 52px; }
    .level-label { font-size: 11px; padding: 2px 8px; }
    .flower:nth-child(n+9) { display: none; }
  }

  @media (min-width: 769px) {
    .stair-svg, .stair-nodes { max-width: 600px; }
    .avatar-ring { width: 96px; height: 96px; }
    .level-label { font-size: 16px; }
  }
  ```
  这些尺寸现在由 CSS 变量统一驱动，无需重复覆盖。

  保留 `@media (min-width: 500px)` 的 `.app-container` / `.screen` 限制，因为它控制屏幕居中，不是尺寸变量。

  保留 `@media (max-height: 600px)` 的 `.board-container` / `.game-hud` / `h1` 规则，但如果已被 `landscape-short` 变量覆盖，可以考虑删除。为了安全，保留原规则作为后备，但将其值改为使用变量：
  ```css
  @media (max-height: 600px) {
    .board-container { padding: 4px 0; }
    .game-hud { padding: var(--hud-padding); margin-bottom: 8px; }
    h1 { font-size: calc(var(--font-base) * 1.5); margin-bottom: 12px; }
  }
  ```

- [ ] **Step 2: 在 style.css 中添加 `.obstacle-hint-modal > div` 规则**

  在 CSS 中 `/* Modal */` 附近添加：
  ```css
  .obstacle-hint-modal > div {
    max-width: var(--modal-max-width);
  }
  ```

- [ ] **Step 3: 启动开发服务器并浏览器验证**

  Run: `npm run dev`
  在浏览器中打开，使用 DevTools 切换以下视口验证：
  1. iPhone SE (375x667) — 棋盘不溢出，按钮可点击
  2. iPhone 14 Pro (430x932) — 棋盘和 HUD 对齐
  3. iPad Mini 竖屏 (768x1024) — 棋盘明显大于手机
  4. iPad Pro 横屏 (1366x1024) — 棋盘大小舒适，不空旷
  5. 自定义 320x568 — 小屏手机，无溢出
  6. 自定义 800x400 — 横屏，HUD 不重叠，布局紧凑

  验证项：
  - 棋盘在所有断点下居中且大小合适
  - HUD 宽度与棋盘一致
  - 关卡选择 SVG 路径和节点对齐无错位
  - 3D 动物世界画布在 Pad 横屏上不超出容器
  - 弹窗（胜利 / 障碍物提示）在小屏上不溢出

- [ ] **Step 4: 运行测试**

  Run: `npm run test`
  Expected: 全部通过

- [ ] **Step 5: Commit**

  ```bash
  git add style.css
  git commit -m "style: remove obsolete media queries and add obstacle modal rule

- Delete duplicated avatar-ring/level-label/star/stair-svg media queries
- Replaced by CSS variable system in Task 1
- Add .obstacle-hint-modal > div max-width binding

Co-Authored-By: Claude <noreply@anthropic.com>"
  ```

---

## 自审清单

**1. Spec 覆盖：**
- CSS 变量体系定义了 5 个断点 — 覆盖（Task 1）
- 棋盘尺寸响应式 — 覆盖（Task 1 + Task 2）
- HUD 响应式 — 覆盖（Task 1）
- 菜单和关卡选择响应式 — 覆盖（Task 1）
- 3D 画布容器化 — 覆盖（Task 4）
- 横屏处理 — 覆盖（Task 1 的 landscape-short 断点）
- 移除 JS 硬编码 px — 覆盖（Task 2, 3, 4）
- 弹窗统一使用变量 — 覆盖（Task 1 + Task 3）

**2. Placeholder 扫描：**
- 无 "TBD", "TODO", "implement later"
- 无 "Add appropriate error handling" 等模糊描述
- 每个步骤都有具体代码和命令

**3. 类型一致性：**
- `getSwipeThreshold()` 返回 `number`，与 `resolveDirection` 中的 `threshold` 类型一致
- `clientWidth/clientHeight` 返回 `number`，与 `setSize` 参数类型一致
- 所有 CSS 变量名在 JS 未直接引用（仅在 CSS 中使用），不存在命名不一致风险

**4. 范围检查：**
- 本计划仅涉及布局响应式，不改动游戏逻辑、动画、交互方式，符合 spec 范围限定

---

## 执行交接

Plan complete and saved to `docs/superpowers/plans/2026-07-04-responsive-layout.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
