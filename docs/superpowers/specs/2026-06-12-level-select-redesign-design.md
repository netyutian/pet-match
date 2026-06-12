# 关卡选择页面重设计

## 概述

将现有的垂直列表式关卡选择页面升级为效果图所示的"天梯攀登"布局：一条蜿蜒向上的阶梯，每个关卡以对应生肖的圆形头像展示，背景为蓝天白云与草地花朵。保持现有 20 个线性关卡不变，每关的目标生肖决定其头像。

## 视觉结构

页面是一个全屏滚动容器，内部按 z-index 分层：

```
level-select-screen (全屏, overflow-y: auto)
  ├── sky-bg           (z-0, 渐变背景, fixed)
  ├── clouds           (z-1, 浮动云朵)
  ├── stair-svg        (z-2, SVG 蜿蜒阶梯路径)
  ├── stair-nodes      (z-3, 20 个关卡节点, 绝对定位)
  ├── grass-ground     (z-4, 底部草地渐变)
  ├── flowers          (z-5, 草地边缘小花)
  └── back-btn         (z-10, 左上角返回按钮)
```

进入页面时，自动滚动到当前最高解锁关卡的位置（使其位于屏幕中央偏下）。

## 背景层

### 天空

`linear-gradient(180deg, #4A90E2 0%, #87CEEB 35%, #E0F6FF 70%, #FFF8E7 100%)`

占满全屏高度。全屏高度由 20 个关卡节点总高度决定，移动端约 `1400px`，桌面端约 `1800px`。

### 云朵

5-7 个白色椭圆组合（`border-radius: 50%`），`opacity: 0.85`。通过 CSS 动画 `float` 以不同速度缓慢水平漂移（`animation-duration: 25s-40s`），营造立体感。

### 草地

底部固定 `18vh` 高度，`linear-gradient(180deg, #90EE90 0%, #32CD32 60%, #228B22 100%)`。顶部边缘用 `border-radius: 50% 50% 0 0` 做出柔和的丘状起伏。

### 花朵

12-16 个小圆点（`width: 6px-10px`，`border-radius: 50%`），颜色 `#FF6B6B / #FFD93D / #FF9FF3 / #FFFFFF`，随机分布在草地上方边缘。部分带绿色细茎（`::after` 伪元素），轻微随风摆动动画。

## 阶梯 SVG 与节点定位

### SVG 路径

- `viewBox="0 0 400 1000"`
- `preserveAspectRatio="xMidYMax meet"`
- 路径从底部中央 `(200, 1000)` 开始，以贝塞尔曲线蜿蜒向上至 `(200, 0)`，整体呈"S"形蛇形走势
- `stroke: #F5F5F5`，`stroke-width: 24`，`stroke-linecap: round`，`fill: none`
- 用 `stroke-dasharray: 30 15` 模拟台阶断裂感
- 路径下方加一层偏移 2px 的 `#00000020` 阴影路径，增加立体感

### 节点定位算法

用 JavaScript 读取 SVG path 的 `getTotalLength()`，将 20 个关卡均匀分布：

```
segmentLength = path.getTotalLength() / (LEVELS.length - 1)
for i in 0..19:
  point = path.getPointAtLength(i * segmentLength)
  // point.x, point.y 转换为像素定位
```

第 1 关在底部（已解锁区域起始），第 20 关在顶部。节点使用 `position: absolute`。

## 关卡节点样式与状态

### 头像容器

- `80x80px`（移动端 `64x64px`）
- `border-radius: 50%`
- `border: 4px solid #FFD700`（金色边框）
- `box-shadow: 0 4px 12px rgba(0,0,0,0.2)`
- 背景色取该生肖对应颜色（如鼠 `#FFB6C1`），来自 `COLORS` 常量

### 头像图片

`img` 标签加载 `/assets/avatars/{element}.png`，`object-fit: cover`，填满圆形。

### 星级

3 颗小星星（`font-size: 12px`，`⭐`）水平排列在头像底部外侧。`0` 星时隐藏。

### 关卡标签

- 头像正下方
- `background: #4A90E2`
- `color: white`
- `padding: 4px 12px`
- `border-radius: 12px`
- `font-size: 14px`
- 文字为 `第${id}关`

### 已解锁状态

以上样式正常显示，点击可进入关卡。

### 未解锁状态

- 头像 `filter: grayscale(100%) brightness(0.7)`
- 边框变 `#CCCCCC`
- 标签背景变 `#999999`
- `cursor: not-allowed`
- 点击无反应

## 交互与动画

### 进入动画

页面加载时，关卡节点从 `scale(0)` + `opacity(0)` 依次弹出：
- 第 1 关延迟 `0ms`
- 每关递增 `80ms`
- 缓动：`cubic-bezier(0.34, 1.56, 0.64, 1)`（弹性效果）
- 持续：`400ms`

### 头像呼吸

已解锁关卡的头像有持续的轻微缩放动画：`scale(1) → scale(1.05) → scale(1)`，`2s` 循环。

### 最新关卡高亮

当前最高解锁关卡额外加一个脉动光环：
- `box-shadow` 从 `0 0 0 0 rgba(255,215,0,0.4)` 扩散到 `0 0 0 16px rgba(255,215,0,0)`
- `1.5s` 循环

### 点击反馈

点击已解锁关卡时，头像快速 `scale(0.9)` 然后恢复，伴随轻微下沉动画。

### 自动滚动

进入页面后，平滑滚动到当前最高解锁关卡位置（`behavior: smooth`），使其位于视口中心偏下 `20%` 处。

### 云朵漂移

云朵以不同速度水平移动，超出边界后从另一侧重新进入。

## 响应式适配

| 断点 | 头像尺寸 | 标签字号 | 边框 | 间距调整 |
|------|----------|----------|------|----------|
| 桌面端 (> 768px) | 96x96px | 16px | 4px | 标准 |
| 移动端 (< 768px) | 64x64px | 12px | 3px | 缩小 20% |
| 小屏手机 (< 375px) | 52x52px | 11px | 3px | 隐藏部分花朵 |

SVG `viewBox` 宽度在桌面端放大到 `600`。

## 数据映射

关卡到生肖的映射使用现有 `LevelConfig.goal.element` 字段：

| 关卡 | 生肖 | 头像文件 |
|------|------|----------|
| 1, 7, 13, 19 | rat | rat.png |
| 2, 8, 14, 20 | dog | dog.png |
| 3, 9, 15 | rabbit | rabbit.png |
| 4, 10, 16 | ox | ox.png |
| 5, 11, 17 | rooster | rooster.png |
| 6, 12, 18 | pig | pig.png |

## 文件变更清单

- `src/ui/LevelSelectScreen.ts` — 重写 DOM 结构和渲染逻辑
- `style.css` — 新增关卡选择页面样式（约 200 行）
- `src/core/LevelConfig.ts` — 无需变更
- `src/constants.ts` — 无需变更
- 无新增资源文件（复用现有 `/assets/avatars/*.png`）
