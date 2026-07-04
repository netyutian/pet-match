# 消消乐多端响应式布局重构设计

## 日期

2026-07-04

## 背景

本项目为基于 Vite + TypeScript 的浏览器端 match-3 游戏（消消乐），无前端框架，UI 通过原生 DOM 操作构建。当前已有基础移动端适配（viewport meta、touch 事件、少量 media query），但存在棋盘尺寸 hardcoded、缺少横屏处理、字号未分级、JS 与 CSS 尺寸不同步等问题。

## 目标

对前端进行布局层响应式重构，使游戏在以下设备上均能良好显示：

- **移动端**：小屏手机（<=360px）和标准手机（361px-768px）竖屏
- **Pad 端**：平板竖屏（769px-1024px）和横屏（>=1025px）
- **浏览器 Web 端**：桌面浏览器

**范围限定**：仅布局响应式，不改动交互逻辑，不做 3D 性能降级。

## 非目标

- 不引入第三方响应式框架或 UI 库
- 不改动画时长或游戏逻辑
- 不针对特定设备做交互差异（如手机滑动 / Pad 点击）

## 设计原则

- **CSS 控制外观，JS 控制行为**：尺寸、间距、字体由 CSS 变量驱动，JS 仅在必要时读取
- **渐进增强**：小屏保证功能完整，大屏提升视觉舒适度
- **无 premature 抽象**：不封装复杂的响应式系统，直接修改现有文件

## 断点定义

| 断点 | 范围 | 典型设备 |
|------|------|----------|
| compact | <= 360px | iPhone SE 等小屏手机 |
| mobile | 361px - 768px | 标准手机竖屏 |
| tablet | 769px - 1024px | iPad 竖屏 / 安卓平板 |
| desktop | >= 1025px | iPad 横屏 / 桌面浏览器 |
| landscape-short | max-height: 500px + orientation: landscape | 手机横屏 |

## CSS 变量体系

```css
/* compact (default) */
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

## 各屏幕布局规则

### 游戏屏幕（GameScreen）

- 棋盘 `max-width: var(--board-max-width)`，始终居中
- HUD 同宽，与棋盘对齐，使用 `var(--hud-max-width)`、`var(--hud-padding)`、`var(--hud-font-size)`
- 横屏时：HUD 和返回按钮垂直空间压缩，棋盘以可用高度为上限自适应

### 菜单屏幕（MenuScreen）

- 头像网格 `max-width: var(--menu-grid-max-width)`
- 标题字号随 `--font-base` 缩放（`calc(var(--font-base) * 2.2)`）
- 按钮使用 `var(--btn-padding)` 和 `var(--btn-font-size)`

### 关卡选择（LevelSelectScreen）

- `stair-svg` 和 `stair-nodes` 使用 `var(--level-svg-max-width)`
- 节点 `avatar-ring` 尺寸使用 `var(--avatar-ring-size)`
- 花朵等装饰元素在 compact 断点下隐藏部分（`nth-child(n+9)` 规则保留）

### 3D 动物世界（Home3DScreen）

- 画布尺寸限制在容器内，不再直接取 `window.innerWidth`
- 容器使用 `max-width: var(--board-max-width)` 与整体风格一致
- 渲染器 pixel ratio 上限保持 2，不额外改动

### 弹窗 / 模态框

- 统一使用 `var(--modal-max-width)`，避免小屏溢出

## JS 改动清单

| 文件 | 改动 |
|------|------|
| `BoardRenderer.ts` | 移除 `gridEl.style.maxWidth = '400px'`、`gridEl.style.gap = '2px'` 等硬编码，改为由 CSS 类控制；`THRESHOLD = 24` 改为基于单元格实际尺寸的动态比例（如 cell 宽度的 30%）；`showFloatingText` 的 `-20px` 硬偏移改为基于文本宽度计算或居中；`createCellElement` 中 `borderRadius: '12px'` 改为读取 `var(--cell-radius)` 或移除 inline style 由 CSS 控制 |
| `GameScreen.ts` | `showVictoryModal` 和 `showObstacleHint` 的 `max-width` 改为 `var(--modal-max-width)`；HUD 创建时不再设置固定 font-size |
| `Home3DScreen.ts` | `init3D` 和 `onResize` 中画布尺寸改为基于容器 `clientWidth/clientHeight`，而非 `window.innerWidth/Height`；移除 `window.innerWidth` 直接引用 |
| `style.css` | 全面重构，引入上述 CSS 变量和媒体查询，统一各组件尺寸；清理重复 CSS 规则（如重复的 `eliminate` / `fallIn` keyframes） |

## 关键文件

- `style.css` — 核心响应式样式和 CSS 变量
- `src/ui/BoardRenderer.ts` — 棋盘渲染，移除硬编码 px
- `src/ui/GameScreen.ts` — 游戏 HUD 和弹窗适配
- `src/ui/Home3DScreen.ts` — 3D 画布容器化
- `src/ui/LevelSelectScreen.ts` — 关卡节点尺寸（如 CSS 无法覆盖则移除 inline style）

## 测试验证项

1. 在 iPhone SE（375px）上棋盘不溢出，按钮可点击
2. 在 iPhone 14 Pro（430px）上棋盘和 HUD 对齐，无白边
3. 在 iPad 竖屏（768px）上棋盘明显大于手机，不显得空
4. 在 iPad 横屏 / 桌面（1024px+）上棋盘大小舒适，周围不空旷
5. 手机横屏时棋盘和 HUD 不重叠，布局紧凑
6. 关卡选择 SVG 路径和节点在所有断点下对齐无错位
7. 3D 动物世界画布在 Pad 横屏上不拉伸变形

## 风险评估

- **SVG 节点对齐**：`LevelSelectScreen` 使用 `getPointAtLength` 计算节点位置，如果 `max-width` 变化但 SVG `viewBox` 不变，节点位置理论上与容器宽度无关（因为 SVG 内部坐标系固定），但需验证实际渲染。
- **滑动阈值**：`THRESHOLD` 改为动态计算后，如果 cell 尺寸变化过程中用户正在滑动，阈值可能突变。由于尺寸变化仅在 resize 时发生，用户滑动时不会 resize，风险低。
- **CSS 变量兼容性**：本项目面向浏览器，所有目标浏览器均支持 CSS 自定义属性，无需 polyfill。

## 未来扩展

如需进一步做交互差异（如 Pad 支持鼠标点击交换），可在本方案基础上扩展，不影响当前布局层改动。
