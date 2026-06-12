# 12生肖头像替换实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将消消乐游戏中的6种emoji动物替换为12生肖主题图片头像，扩展棋盘元素至12种，同时在宠物系统和家园系统中使用图片头像。

**架构：** 图片资源通过 Vite `public` 目录 serve，棋盘用 CSS `background-image` 渲染，宠物卡片用 `<img>` 标签渲染。常量表 (`constants.ts`) 集中定义12种元素和宠物数据，类型定义 (`types.ts`) 同步更新。

**Tech Stack:** Vite + TypeScript + Vitest + jsdom

---

## 文件结构

| 文件 | 操作 | 说明 |
|------|------|------|
| `public/assets/avatars/` | 创建 | 12张生肖图片资源 |
| `src/types.ts` | 修改 | ElementType 从6种扩展为12种 |
| `src/constants.ts` | 修改 | ELEMENTS、PET_DATA、PET_CLOTHES、新增 ELEMENT_NAMES |
| `src/ui/BoardRenderer.ts` | 修改 | 用 background-image 替换 emoji+背景色 |
| `src/ui/GameScreen.ts` | 修改 | 替换 HUD 和浮动文字中的 emoji 为图片 |
| `src/core/LevelConfig.ts` | 修改 | 20关目标元素重新分配为12生肖 |
| `src/main.ts` | 修改 | 初始存档、菜单图标、关卡碎片奖励映射 |
| `src/ui/HomeScreen.ts` | 修改 | 宠物卡片和房间视图添加头像图片 |
| `tests/core/MatchEngine.test.ts` | 修改 | 元素引用更新 |
| `tests/systems/PetSystem.test.ts` | 修改 | 宠物ID更新 |
| `tests/systems/SaveManager.test.ts` | 修改 | 碎片键名更新 |
| `tests/systems/ResourceSystem.test.ts` | 修改 | 碎片键名更新 |
| `style.css` | 修改 | 棋盘格子图片样式、宠物头像样式 |

---

### Task 1: 复制图片资源到 public/assets/avatars/

**Files:**
- Create: `public/assets/avatars/rat.png`, `ox.png`, `tiger.png`, `rabbit.png`, `dragon.png`, `snake.png`, `horse.png`, `goat.png`, `monkey.png`, `rooster.png`, `dog.png`, `pig.png`

- [ ] **Step 1: 创建目录并复制图片**

```bash
mkdir -p /Users/fangna/crane-pet/game/public/assets/avatars
```

复制规则：
- `头像/老鼠.png` -> `public/assets/avatars/rat.png`
- `头像/小牛.png` -> `public/assets/avatars/ox.png`
- `头像/老虎.png` -> `public/assets/avatars/tiger.png`
- `头像/小兔.png` -> `public/assets/avatars/rabbit.png`
- `头像/小龙.png` -> `public/assets/avatars/dragon.png`
- `头像/小蛇.png` -> `public/assets/avatars/snake.png`
- `头像/小马.png` -> `public/assets/avatars/horse.png`
- `头像/小羊.png` -> `public/assets/avatars/goat.png`
- `头像/小猴.png` -> `public/assets/avatars/monkey.png`
- `头像/小鸡.png` -> `public/assets/avatars/rooster.png`
- `头像/小狗.png` -> `public/assets/avatars/dog.png`
- `头像/小猪.png` -> `public/assets/avatars/pig.png`

（`小牛1.png` 为重复，忽略）

```bash
cp "/Users/fangna/crane-pet/game/头像/老鼠.png" /Users/fangna/crane-pet/game/public/assets/avatars/rat.png
cp "/Users/fangna/crane-pet/game/头像/小牛.png" /Users/fangna/crane-pet/game/public/assets/avatars/ox.png
cp "/Users/fangna/crane-pet/game/头像/老虎.png" /Users/fangna/crane-pet/game/public/assets/avatars/tiger.png
cp "/Users/fangna/crane-pet/game/头像/小兔.png" /Users/fangna/crane-pet/game/public/assets/avatars/rabbit.png
cp "/Users/fangna/crane-pet/game/头像/小龙.png" /Users/fangna/crane-pet/game/public/assets/avatars/dragon.png
cp "/Users/fangna/crane-pet/game/头像/小蛇.png" /Users/fangna/crane-pet/game/public/assets/avatars/snake.png
cp "/Users/fangna/crane-pet/game/头像/小马.png" /Users/fangna/crane-pet/game/public/assets/avatars/horse.png
cp "/Users/fangna/crane-pet/game/头像/小羊.png" /Users/fangna/crane-pet/game/public/assets/avatars/goat.png
cp "/Users/fangna/crane-pet/game/头像/小猴.png" /Users/fangna/crane-pet/game/public/assets/avatars/monkey.png
cp "/Users/fangna/crane-pet/game/头像/小鸡.png" /Users/fangna/crane-pet/game/public/assets/avatars/rooster.png
cp "/Users/fangna/crane-pet/game/头像/小狗.png" /Users/fangna/crane-pet/game/public/assets/avatars/dog.png
cp "/Users/fangna/crane-pet/game/头像/小猪.png" /Users/fangna/crane-pet/game/public/assets/avatars/pig.png
```

- [ ] **Step 2: 验证文件存在**

```bash
ls -la /Users/fangna/crane-pet/game/public/assets/avatars/
```

Expected: 12个 .png 文件，无 `小牛1.png`

- [ ] **Step 3: Commit**

```bash
git add public/assets/avatars/
git commit -m "assets: add 12 zodiac avatar images" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: 更新类型定义 ElementType

**Files:**
- Modify: `src/types.ts:1`

- [ ] **Step 1: 修改 ElementType 为12种生肖**

```typescript
export type ElementType = 'rat' | 'ox' | 'tiger' | 'rabbit' | 'dragon' | 'snake' | 'horse' | 'goat' | 'monkey' | 'rooster' | 'dog' | 'pig';
```

完整文件内容（仅替换第一行，其余不变）：

```typescript
export type ElementType = 'rat' | 'ox' | 'tiger' | 'rabbit' | 'dragon' | 'snake' | 'horse' | 'goat' | 'monkey' | 'rooster' | 'dog' | 'pig';

export type SpecialType = 'none' | 'line_h' | 'line_v' | 'bomb';
// ... 其余内容保持不变
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "types: expand ElementType to 12 zodiac animals" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: 重构常量表 constants.ts

**Files:**
- Modify: `src/constants.ts`

- [ ] **Step 1: 替换 ELEMENTS 数组**

将：
```typescript
export const ELEMENTS: ElementType[] = ['cat', 'dog', 'rabbit', 'bear', 'bird', 'hamster'];
```

改为：
```typescript
export const ELEMENTS: ElementType[] = ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'];
```

- [ ] **Step 2: 删除 COLORS 和 ELEMENT_EMOJI，新增 ELEMENT_NAMES**

删除以下代码：
```typescript
export const COLORS: Record<ElementType, string> = {
  cat: '#FFB6C1',
  dog: '#87CEEB',
  rabbit: '#98FB98',
  bear: '#DEB887',
  bird: '#F0E68C',
  hamster: '#DDA0DD',
};

export const ELEMENT_EMOJI: Record<ElementType, string> = {
  cat: '🐱',
  dog: '🐶',
  rabbit: '🐰',
  bear: '🐻',
  bird: '🐦',
  hamster: '🐹',
};
```

新增：
```typescript
export const ELEMENT_NAMES: Record<ElementType, string> = {
  rat: '鼠',
  ox: '牛',
  tiger: '虎',
  rabbit: '兔',
  dragon: '龙',
  snake: '蛇',
  horse: '马',
  goat: '羊',
  monkey: '猴',
  rooster: '鸡',
  dog: '狗',
  pig: '猪',
};
```

- [ ] **Step 3: 扩展 PET_DATA 为12种宠物**

将：
```typescript
export const PET_DATA: Record<string, PetData> = {
  cat: { id: 'cat', species: '橘猫', favoriteFood: '鱼干', maxIntimacy: 100 },
  dog: { id: 'dog', species: '柴犬', favoriteFood: '骨头', maxIntimacy: 100 },
  rabbit: { id: 'rabbit', species: '白兔', favoriteFood: '胡萝卜', maxIntimacy: 100 },
};
```

改为：
```typescript
export const PET_DATA: Record<string, PetData> = {
  rat: { id: 'rat', species: '小鼠', favoriteFood: '奶酪', maxIntimacy: 100 },
  ox: { id: 'ox', species: '小牛', favoriteFood: '青草', maxIntimacy: 100 },
  tiger: { id: 'tiger', species: '小老虎', favoriteFood: '肉干', maxIntimacy: 100 },
  rabbit: { id: 'rabbit', species: '小兔', favoriteFood: '胡萝卜', maxIntimacy: 100 },
  dragon: { id: 'dragon', species: '小龙', favoriteFood: '龙珠糖', maxIntimacy: 100 },
  snake: { id: 'snake', species: '小蛇', favoriteFood: '鸡蛋', maxIntimacy: 100 },
  horse: { id: 'horse', species: '小马', favoriteFood: '苹果', maxIntimacy: 100 },
  goat: { id: 'goat', species: '小羊', favoriteFood: '青菜', maxIntimacy: 100 },
  monkey: { id: 'monkey', species: '小猴', favoriteFood: '香蕉', maxIntimacy: 100 },
  rooster: { id: 'rooster', species: '小鸡', favoriteFood: '米粒', maxIntimacy: 100 },
  dog: { id: 'dog', species: '小狗', favoriteFood: '骨头', maxIntimacy: 100 },
  pig: { id: 'pig', species: '小猪', favoriteFood: '红薯', maxIntimacy: 100 },
};
```

- [ ] **Step 4: 扩展 PET_CLOTHES 为12种宠物**

将：
```typescript
export const PET_CLOTHES: Record<string, string[]> = {
  cat: ['围巾', '帽子'],
  dog: ['项圈', '披风'],
  rabbit: ['蝴蝶结', '花环'],
};
```

改为：
```typescript
export const PET_CLOTHES: Record<string, string[]> = {
  rat: ['小帽子', '围巾'],
  ox: ['牛角环', '披风'],
  tiger: ['虎纹衣', '铃铛'],
  rabbit: ['蝴蝶结', '花环'],
  dragon: ['龙角', '鳞甲'],
  snake: ['蛇纹带', '小草帽'],
  horse: ['马鞍', '马蹄铁'],
  goat: ['羊角饰', '毛绒衣'],
  monkey: ['紧箍', '香蕉背包'],
  rooster: ['鸡冠饰', '羽毛衣'],
  dog: ['项圈', '披风'],
  pig: ['猪鼻子', '围裙'],
};
```

- [ ] **Step 5: 运行类型检查**

```bash
cd /Users/fangna/crane-pet/game && npx tsc --noEmit
```

Expected: 无错误（仅 constants.ts 改动，无依赖问题）

- [ ] **Step 6: Commit**

```bash
git add src/constants.ts
git commit -m "constants: expand to 12 zodiac elements and pets" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: 改造棋盘渲染 BoardRenderer.ts

**Files:**
- Modify: `src/ui/BoardRenderer.ts`

- [ ] **Step 1: 删除 COLORS 和 ELEMENT_EMOJI 导入**

将导入语句：
```typescript
import { BOARD_SIZE, COLORS, ELEMENT_EMOJI } from '../constants';
```

改为：
```typescript
import { BOARD_SIZE } from '../constants';
```

- [ ] **Step 2: 修改 renderCell 方法**

将 `renderCell` 方法：
```typescript
private renderCell(cellEl: HTMLElement, cell: Cell | null): void {
  if (!cell) {
    cellEl.style.backgroundColor = 'transparent';
    cellEl.textContent = '';
    cellEl.style.border = '3px solid transparent';
    return;
  }

  cellEl.style.backgroundColor = COLORS[cell.element];
  cellEl.textContent = ELEMENT_EMOJI[cell.element];
  cellEl.style.border = this.getBorderForSpecial(cell.special);
}
```

改为：
```typescript
private renderCell(cellEl: HTMLElement, cell: Cell | null): void {
  if (!cell) {
    cellEl.style.backgroundImage = 'none';
    cellEl.textContent = '';
    cellEl.style.border = '3px solid transparent';
    return;
  }

  cellEl.style.backgroundImage = `url('/assets/avatars/${cell.element}.png')`;
  cellEl.style.backgroundSize = 'contain';
  cellEl.style.backgroundRepeat = 'no-repeat';
  cellEl.style.backgroundPosition = 'center';
  cellEl.textContent = '';
  cellEl.style.border = this.getBorderForSpecial(cell.special);
}
```

- [ ] **Step 3: 更新 CSS 样式（style.css）**

在 `style.css` 的 `.board-cell` 规则中添加 `background-color: transparent;`：

将：
```css
.board-cell {
  aspect-ratio: 1;
  border-radius: 8px;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none;
  border: 3px solid transparent;
}
```

改为：
```css
.board-cell {
  aspect-ratio: 1;
  border-radius: 8px;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none;
  border: 3px solid transparent;
  background-color: transparent;
}
```

- [ ] **Step 4: 运行类型检查**

```bash
cd /Users/fangna/crane-pet/game && npx tsc --noEmit
```

Expected: 无错误

- [ ] **Step 5: Commit**

```bash
git add src/ui/BoardRenderer.ts style.css
git commit -m "ui: render board cells with zodiac avatar images" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: 更新关卡配置 LevelConfig.ts

**Files:**
- Modify: `src/core/LevelConfig.ts`

- [ ] **Step 1: 替换全部20关目标元素**

将 `src/core/LevelConfig.ts` 全部内容替换为：

```typescript
import type { LevelConfig } from '../types';

export const LEVELS: LevelConfig[] = [
  // 前12关：每关收集一种生肖
  { id: 1, type: 'collect', goal: { type: 'collect', target: 10, element: 'rat' }, moves: 25 },
  { id: 2, type: 'collect', goal: { type: 'collect', target: 12, element: 'ox' }, moves: 25 },
  { id: 3, type: 'collect', goal: { type: 'collect', target: 14, element: 'tiger' }, moves: 24 },
  { id: 4, type: 'collect', goal: { type: 'collect', target: 14, element: 'rabbit' }, moves: 25 },
  { id: 5, type: 'collect', goal: { type: 'collect', target: 15, element: 'dragon' }, moves: 24 },
  { id: 6, type: 'collect', goal: { type: 'collect', target: 15, element: 'snake' }, moves: 25 },
  { id: 7, type: 'collect', goal: { type: 'collect', target: 18, element: 'horse' }, moves: 24 },
  { id: 8, type: 'collect', goal: { type: 'collect', target: 18, element: 'goat' }, moves: 25 },
  { id: 9, type: 'collect', goal: { type: 'collect', target: 20, element: 'monkey' }, moves: 24 },
  { id: 10, type: 'collect', goal: { type: 'collect', target: 20, element: 'rooster' }, moves: 23 },
  { id: 11, type: 'collect', goal: { type: 'collect', target: 20, element: 'dog' }, moves: 25, obstacles: [{ type: 'wood', positions: [{ row: 3, col: 3 }, { row: 3, col: 4 }, { row: 4, col: 3 }, { row: 4, col: 4 }, { row: 5, col: 5 }] }] },
  { id: 12, type: 'collect', goal: { type: 'collect', target: 22, element: 'pig' }, moves: 24, obstacles: [{ type: 'wood', positions: [{ row: 2, col: 2 }, { row: 6, col: 6 }] }] },
  // 第13-20关：循环使用，步数和目标递增
  { id: 13, type: 'collect', goal: { type: 'collect', target: 22, element: 'rat' }, moves: 25, obstacles: [{ type: 'wood', positions: [{ row: 0, col: 0 }, { row: 7, col: 7 }] }] },
  { id: 14, type: 'collect', goal: { type: 'collect', target: 25, element: 'ox' }, moves: 24 },
  { id: 15, type: 'collect', goal: { type: 'collect', target: 25, element: 'tiger' }, moves: 26, obstacles: [{ type: 'wood', positions: [{ row: 3, col: 2 }, { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 3, col: 5 }, { row: 4, col: 2 }, { row: 4, col: 3 }, { row: 4, col: 4 }, { row: 4, col: 5 }] }] },
  { id: 16, type: 'collect', goal: { type: 'collect', target: 25, element: 'rabbit' }, moves: 25 },
  { id: 17, type: 'collect', goal: { type: 'collect', target: 28, element: 'dragon' }, moves: 24 },
  { id: 18, type: 'collect', goal: { type: 'collect', target: 28, element: 'snake' }, moves: 25, obstacles: [{ type: 'wood', positions: [{ row: 1, col: 1 }, { row: 1, col: 6 }, { row: 6, col: 1 }, { row: 6, col: 6 }, { row: 3, col: 3 }, { row: 4, col: 4 }] }] },
  { id: 19, type: 'collect', goal: { type: 'collect', target: 30, element: 'horse' }, moves: 23 },
  { id: 20, type: 'collect', goal: { type: 'collect', target: 30, element: 'goat' }, moves: 25 },
];

export function getLevel(id: number): LevelConfig | undefined {
  return LEVELS.find(l => l.id === id);
}
```

- [ ] **Step 2: 运行类型检查**

```bash
cd /Users/fangna/crane-pet/game && npx tsc --noEmit
```

Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add src/core/LevelConfig.ts
git commit -m "levels: redistribute 20 levels across 12 zodiac elements" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: 更新主入口 main.ts

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: 替换初始存档中的宠物数据**

将 `createNewSave` 中的宠物数据：
```typescript
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
```

改为：
```typescript
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
```

- [ ] **Step 2: 替换关卡碎片奖励映射**

将 `startLevel` 中的：
```typescript
        const fragmentMap: Record<number, string> = {
          3: 'cat',
          5: 'dog',
          8: 'rabbit',
        };
```

改为：
```typescript
        const fragmentMap: Record<number, string> = {
          3: 'rat',
          5: 'ox',
          8: 'tiger',
        };
```

- [ ] **Step 3: 替换菜单宠物图标为图片**

将 `setupScreens` 中的：
```typescript
    const petIcon = document.createElement('div');
    petIcon.textContent = '🐱';
    petIcon.style.fontSize = '80px';
    petIcon.style.marginBottom = '24px';
    petIcon.style.textAlign = 'center';
    menu.appendChild(petIcon);
```

改为：
```typescript
    const petIcon = document.createElement('img');
    petIcon.src = '/assets/avatars/rat.png';
    petIcon.style.width = '80px';
    petIcon.style.height = '80px';
    petIcon.style.marginBottom = '24px';
    petIcon.style.objectFit = 'contain';
    menu.appendChild(petIcon);
```

- [ ] **Step 4: 运行类型检查**

```bash
cd /Users/fangna/crane-pet/game && npx tsc --noEmit
```

Expected: 无错误

- [ ] **Step 5: Commit**

```bash
git add src/main.ts
git commit -m "main: update initial save, fragment map, and menu icon for zodiac" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: 更新游戏界面 HUD 和浮动文字 GameScreen.ts

**Files:**
- Modify: `src/ui/GameScreen.ts`

- [ ] **Step 1: 替换导入**

将：
```typescript
import { ELEMENT_EMOJI } from '../constants';
```

改为：
```typescript
import { ELEMENT_NAMES } from '../constants';
```

- [ ] **Step 2: 修改 formatGoal 方法**

将 `formatGoal` 方法：
```typescript
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
```

改为：
```typescript
  private formatGoal(): string {
    const goal = this.level.goal;
    if (goal.type === 'score') {
      return `${goal.target}分`;
    }
    if (goal.type === 'collect' && goal.element) {
      const collected = this.gameState.getCollectedCount(goal.element);
      const name = ELEMENT_NAMES[goal.element];
      return `${name} ${collected}/${goal.target}`;
    }
    if (goal.type === 'clear') {
      return `清除${goal.target}个障碍`;
    }
    return '';
  }
```

- [ ] **Step 3: 修改浮动文字中的 emoji**

在 `processMatches` 方法中，找到浮动文字相关代码：

将：
```typescript
          const emoji = ELEMENT_EMOJI[goalElement];
          const centerPos = match.positions[Math.floor(match.positions.length / 2)];
          this.renderer.showFloatingText(centerPos, `${emoji} +${match.positions.length}`);
```

改为：
```typescript
          const name = ELEMENT_NAMES[goalElement];
          const centerPos = match.positions[Math.floor(match.positions.length / 2)];
          this.renderer.showFloatingText(centerPos, `${name} +${match.positions.length}`);
```

- [ ] **Step 4: 运行类型检查**

```bash
cd /Users/fangna/crane-pet/game && npx tsc --noEmit
```

Expected: 无错误

- [ ] **Step 5: Commit**

```bash
git add src/ui/GameScreen.ts
git commit -m "ui: replace emoji with element names in HUD and floating text" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 8: 更新家园系统 HomeScreen.ts

**Files:**
- Modify: `src/ui/HomeScreen.ts`
- Modify: `style.css`

- [ ] **Step 1: 在宠物卡片中添加头像**

在 `renderPetList` 方法中，找到 `card.appendChild(info);` 之前，添加头像：

将：
```typescript
      const card = document.createElement('div');
      card.classList.add('pet-card');

      const info = document.createElement('div');
```

改为：
```typescript
      const card = document.createElement('div');
      card.classList.add('pet-card');

      const avatar = document.createElement('img');
      avatar.src = `/assets/avatars/${pet.id}.png`;
      avatar.style.width = '40px';
      avatar.style.height = '40px';
      avatar.style.borderRadius = '8px';
      avatar.style.objectFit = 'contain';
      avatar.style.marginRight = '12px';
      card.appendChild(avatar);

      const info = document.createElement('div');
```

同时将原来的 `card.appendChild(info);` 保持不变，确保头像在 info 之前。

- [ ] **Step 2: 在房间视图中添加宠物头像**

在 `renderRoomView` 方法中，在渲染家具之后，添加渲染宠物的代码：

在 `renderRoomView` 方法的末尾（`this.roomView.appendChild(label);` 循环之后），添加：

```typescript
    // 渲染房间中的宠物
    const pets = this.pets.getAllPets();
    for (let i = 0; i < pets.length; i++) {
      const pet = pets[i];
      const petEl = document.createElement('img');
      petEl.src = `/assets/avatars/${pet.id}.png`;
      petEl.style.position = 'absolute';
      petEl.style.width = '48px';
      petEl.style.height = '48px';
      petEl.style.objectFit = 'contain';
      petEl.style.left = `${(i % 3) * 60 + 20}px`;
      petEl.style.top = `${Math.floor(i / 3) * 60 + 20}px`;
      petEl.style.borderRadius = '8px';
      petEl.style.background = 'rgba(255,255,255,0.6)';
      petEl.style.padding = '2px';
      this.roomView.appendChild(petEl);
    }
```

- [ ] **Step 3: 添加宠物头像 CSS 样式**

在 `style.css` 末尾添加：

```css
.pet-avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: contain;
}

.room-pet-avatar {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.6);
  padding: 2px;
}
```

- [ ] **Step 4: 运行类型检查**

```bash
cd /Users/fangna/crane-pet/game && npx tsc --noEmit
```

Expected: 无错误

- [ ] **Step 5: Commit**

```bash
git add src/ui/HomeScreen.ts style.css
git commit -m "ui: add avatar images to pet cards and room view" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 9: 更新测试 MatchEngine.test.ts

**Files:**
- Modify: `tests/core/MatchEngine.test.ts`

- [ ] **Step 1: 替换所有元素引用**

将文件中的元素引用替换为：
- `cat` -> `rat`
- `dog` -> `ox`
- `bear` -> `tiger`
- `bird` -> `rabbit`
- `hamster` -> `dragon`

由于测试不依赖特定元素语义，只替换字符串即可。最终文件内容：

```typescript
import { describe, it, expect } from 'vitest';
import { MatchEngine } from '../../src/core/MatchEngine';
import type { Cell } from '../../src/types';

function makeCell(element: string): Cell {
  return { element: element as any, special: 'none' };
}

describe('MatchEngine', () => {
  it('finds horizontal match of 3', () => {
    const grid: (Cell | null)[][] = [
      [makeCell('rat'), makeCell('rat'), makeCell('rat'), makeCell('ox')],
      [makeCell('ox'), makeCell('tiger'), makeCell('rabbit'), makeCell('dragon')],
    ];
    const matches = MatchEngine.findMatches(grid);
    expect(matches.length).toBe(1);
    expect(matches[0].positions).toHaveLength(3);
  });

  it('finds vertical match of 3', () => {
    const grid: (Cell | null)[][] = [
      [makeCell('rat'), makeCell('ox')],
      [makeCell('rat'), makeCell('tiger')],
      [makeCell('rat'), makeCell('rabbit')],
    ];
    const matches = MatchEngine.findMatches(grid);
    expect(matches.length).toBe(1);
    expect(matches[0].positions).toHaveLength(3);
  });

  it('returns empty when no matches', () => {
    const grid: (Cell | null)[][] = [
      [makeCell('rat'), makeCell('ox')],
      [makeCell('tiger'), makeCell('rabbit')],
    ];
    const matches = MatchEngine.findMatches(grid);
    expect(matches.length).toBe(0);
  });

  it('detects horizontal 4-match and returns special info', () => {
    const grid: (Cell | null)[][] = [
      [makeCell('rat'), makeCell('rat'), makeCell('rat'), makeCell('rat')],
    ];
    const specials = MatchEngine.findSpecials(grid);
    expect(specials.length).toBe(1);
    expect(specials[0].type).toBe('line_v');
  });

  it('findHint returns null when no valid swap', () => {
    const grid: (Cell | null)[][] = [
      [makeCell('rat'), makeCell('ox'), makeCell('tiger')],
      [makeCell('rabbit'), makeCell('dragon'), makeCell('rat')],
      [makeCell('ox'), makeCell('tiger'), makeCell('rabbit')],
    ];
    const hint = MatchEngine.findHint(grid);
    expect(hint).toBeNull();
  });
});
```

- [ ] **Step 2: 运行测试**

```bash
cd /Users/fangna/crane-pet/game && npx vitest run tests/core/MatchEngine.test.ts
```

Expected: 全部通过

- [ ] **Step 3: Commit**

```bash
git add tests/core/MatchEngine.test.ts
git commit -m "test: update MatchEngine tests for 12 zodiac elements" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 10: 更新测试 PetSystem.test.ts

**Files:**
- Modify: `tests/systems/PetSystem.test.ts`

- [ ] **Step 1: 替换所有宠物ID引用**

将文件中的 `cat` -> `rat`，`dog` -> `ox`。具体替换后的文件内容：

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { PetSystem } from '../../src/systems/PetSystem';

describe('PetSystem', () => {
  let system: PetSystem;

  beforeEach(() => {
    system = new PetSystem();
  });

  it('starts with rat unlocked and named 吱吱', () => {
    expect(system.hasPet('rat')).toBe(true);
    const rat = system.getPet('rat');
    expect(rat).toBeDefined();
    expect(rat!.name).toBe('吱吱');
    expect(rat!.intimacy).toBe(0);
    expect(rat!.currentClothes).toBe('');
  });

  it('returns all pets', () => {
    const pets = system.getAllPets();
    expect(pets).toHaveLength(1);
    expect(pets[0].id).toBe('rat');
  });

  it('returns undefined for unknown pet', () => {
    expect(system.getPet('ox')).toBeUndefined();
    expect(system.hasPet('ox')).toBe(false);
  });

  it('adds and gets fragments', () => {
    system.addFragments('ox', 5);
    expect(system.getFragments('ox')).toBe(5);
  });

  it('unlocks pet with enough fragments', () => {
    system.addFragments('ox', 12);
    expect(system.unlockPet('ox')).toBe(true);
    expect(system.hasPet('ox')).toBe(true);
    expect(system.getFragments('ox')).toBe(0);
  });

  it('refuses to unlock pet with insufficient fragments', () => {
    system.addFragments('ox', 5);
    expect(system.unlockPet('ox')).toBe(false);
    expect(system.hasPet('ox')).toBe(false);
    expect(system.getFragments('ox')).toBe(5);
  });

  it('renames pet', () => {
    system.renamePet('rat', '小花');
    expect(system.getPet('rat')!.name).toBe('小花');
  });

  it('feeds pet and increases intimacy', () => {
    expect(system.feed('rat')).toBe(true);
    expect(system.getPet('rat')!.intimacy).toBe(10);
  });

  it('caps intimacy at max', () => {
    for (let i = 0; i < 15; i++) {
      system.feed('rat');
    }
    expect(system.getPet('rat')!.intimacy).toBe(100);
  });

  it('returns intimacy level', () => {
    expect(system.getIntimacyLevel('rat')).toBe(1);
    system.getPet('rat')!.intimacy = 19;
    expect(system.getIntimacyLevel('rat')).toBe(1);
    system.getPet('rat')!.intimacy = 20;
    expect(system.getIntimacyLevel('rat')).toBe(2);
    system.getPet('rat')!.intimacy = 99;
    expect(system.getIntimacyLevel('rat')).toBe(5);
  });

  it('unlocks and equips clothes', () => {
    system.unlockClothes('rat', '围巾');
    expect(system.getPet('rat')!.unlockedClothes).toContain('围巾');
    system.unlockClothes('rat', '围巾');
    expect(system.equipClothes('rat', '围巾')).toBe(true);
    expect(system.getPet('rat')!.currentClothes).toBe('围巾');
  });
});
```

- [ ] **Step 2: 运行测试**

```bash
cd /Users/fangna/crane-pet/game && npx vitest run tests/systems/PetSystem.test.ts
```

Expected: 全部通过

- [ ] **Step 3: Commit**

```bash
git add tests/systems/PetSystem.test.ts
git commit -m "test: update PetSystem tests for zodiac pets" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 11: 更新测试 SaveManager.test.ts

**Files:**
- Modify: `tests/systems/SaveManager.test.ts`

- [ ] **Step 1: 替换碎片键名**

将：
```typescript
  fragments: { cat: 10, dog: 5 },
```

改为：
```typescript
  fragments: { rat: 10, ox: 5 },
```

- [ ] **Step 2: 运行测试**

```bash
cd /Users/fangna/crane-pet/game && npx vitest run tests/systems/SaveManager.test.ts
```

Expected: 全部通过

- [ ] **Step 3: Commit**

```bash
git add tests/systems/SaveManager.test.ts
git commit -m "test: update SaveManager test fragment keys" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 12: 更新测试 ResourceSystem.test.ts

**Files:**
- Modify: `tests/systems/ResourceSystem.test.ts`

- [ ] **Step 1: 替换碎片键名**

将：
```typescript
  it('tracks fragments', () => {
    system.addFragments('cat', 3);
    expect(system.getFragments('cat')).toBe(3);
  });

  it('spends fragments', () => {
    system.addFragments('dog', 5);
    expect(system.spendFragments('dog', 3)).toBe(true);
    expect(system.getFragments('dog')).toBe(2);
  });
```

改为：
```typescript
  it('tracks fragments', () => {
    system.addFragments('rat', 3);
    expect(system.getFragments('rat')).toBe(3);
  });

  it('spends fragments', () => {
    system.addFragments('ox', 5);
    expect(system.spendFragments('ox', 3)).toBe(true);
    expect(system.getFragments('ox')).toBe(2);
  });
```

- [ ] **Step 2: 运行测试**

```bash
cd /Users/fangna/crane-pet/game && npx vitest run tests/systems/ResourceSystem.test.ts
```

Expected: 全部通过

- [ ] **Step 3: Commit**

```bash
git add tests/systems/ResourceSystem.test.ts
git commit -m "test: update ResourceSystem test fragment keys" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 13: 全量测试与 Dev 验证

- [ ] **Step 1: 运行全部测试**

```bash
cd /Users/fangna/crane-pet/game && npm run test
```

Expected: 全部通过

- [ ] **Step 2: 运行 Dev 服务器验证**

```bash
cd /Users/fangna/crane-pet/game && npm run dev
```

在浏览器中验证：
- 菜单页面显示小鼠头像（不是emoji）
- 进入第1关，棋盘显示12种生肖图片（无emoji、无背景色）
- 消除、下落、提示动画正常
- 目标HUD显示中文名称（如 "鼠 0/10"）
- 浮动文字显示中文名称（如 "鼠 +3"）
- 家园系统宠物卡片显示头像
- 房间视图中显示宠物头像

- [ ] **Step 3: 最终 Commit**

```bash
git commit -m "feat: complete zodiac avatar replacement across all systems" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 自检清单

### 1. Spec 覆盖检查

| Spec 需求 | 对应 Task |
|-----------|-----------|
| 12种生肖元素ID | Task 2, 3 |
| 图片资源复制到 public/assets/avatars/ | Task 1 |
| 棋盘用 background-image 替换 emoji | Task 4 |
| 删除 COLORS 和 ELEMENT_EMOJI | Task 3, 4 |
| 新增 ELEMENT_NAMES | Task 3, 7 |
| 宠物数据12种 | Task 3 |
| 宠物系统卡片头像 | Task 8 |
| 房间视图宠物头像 | Task 8 |
| 20关目标重新分配 | Task 5 |
| 初始存档和菜单适配 | Task 6 |
| 测试迁移 | Task 9-12 |
| Dev 验证 | Task 13 |

**无遗漏。**

### 2. Placeholder 扫描

- 无 "TBD"、"TODO"、"implement later"
- 无 "Add appropriate error handling" 等模糊描述
- 无 "Similar to Task N" 引用
- 所有代码步骤均包含完整代码片段
- 所有命令均包含 Expected 输出

**无占位符。**

### 3. 类型一致性检查

- `ElementType` 在 `types.ts` 中定义为 12 种字符串字面量联合类型
- `constants.ts` 中 `ELEMENTS` 数组、`ELEMENT_NAMES` 记录键名与 `ElementType` 完全一致
- `BoardRenderer.ts`、`GameScreen.ts`、`LevelConfig.ts` 中使用的元素字符串均为 `ElementType` 子集
- 测试文件中 `makeCell` 使用的字符串参数与 `ElementType` 一致

**类型一致。**

---

## 执行交接

**计划已完成并保存。**

**执行选项：**

**1. Subagent-Driven（推荐）** - 每个 Task 分配独立子代理，执行后审查，快速迭代

**2. Inline Execution** - 在本会话中按 Task 顺序执行，使用 executing-plans 批量执行并设置检查点

**选择哪种方式？**