# 12生肖头像替换设计

## 背景

将消消乐游戏中的宠物头像和棋盘元素从6种emoji动物替换为12生肖主题图片头像，扩展游戏元素种类，提升视觉表现。

## 范围

- 游戏板元素：6种 -> 12种生肖动物
- 棋盘渲染：emoji + 背景色 -> 图片背景
- 宠物系统：12种宠物，全部有头像
- 家园系统：宠物卡片和房间视图显示头像
- 关卡配置：20关目标元素重新分配
- 测试：全部更新为12种新元素

## 元素映射

| 元素ID | 中文名 | 图片文件名 | 喜爱食物 |
|--------|--------|------------|----------|
| rat | 鼠 | rat.png | 奶酪 |
| ox | 牛 | ox.png | 青草 |
| tiger | 虎 | tiger.png | 肉干 |
| rabbit | 兔 | rabbit.png | 胡萝卜 |
| dragon | 龙 | dragon.png | 龙珠糖 |
| snake | 蛇 | snake.png | 鸡蛋 |
| horse | 马 | horse.png | 苹果 |
| goat | 羊 | goat.png | 青菜 |
| monkey | 猴 | monkey.png | 香蕉 |
| rooster | 鸡 | rooster.png | 米粒 |
| dog | 狗 | dog.png | 骨头 |
| pig | 猪 | pig.png | 红薯 |

## 资源管理

- 图片复制到 `public/assets/avatars/` 目录
- 使用英文文件名（`rat.png` 到 `pig.png`）
- 通过 Vite `public` 目录直接 serve，URL 为 `/assets/avatars/{id}.png`
- 图片原始尺寸约660x660，通过 CSS `background-size: contain` 缩放

## 棋盘渲染改造

`BoardRenderer.renderCell` 改动：
- 移除 `textContent`（emoji）和 `backgroundColor`
- 设置 `backgroundImage: url('/assets/avatars/{element}.png')`
- 设置 `backgroundSize: contain`、`backgroundRepeat: no-repeat`、`backgroundPosition: center`
- 保持特殊块边框：`line_h`/`line_v` 蓝色边框、`bomb` 红色边框

CSS 动画（eliminating、falling、hint、target）施加在格子 div 上，背景图片会随 div 一起动画，无需额外改动。

## 常量表变更

`constants.ts`：
- `ELEMENTS`：12种生肖ID数组
- `COLORS`：删除（或保留作为fallback）
- `ELEMENT_EMOJI`：删除
- `ELEMENT_NAMES`：新增，记录中文名称
- `PET_DATA`：12种宠物数据，含物种名和喜爱食物
- `PET_CLOTHES`：12种宠物，每种2件衣服

## 宠物系统与家园系统

`HomeScreen.ts`：
- 宠物卡片（`.pet-card`）左侧添加头像 `img`（40x40）
- 房间视图（`.room-view`）放置的宠物显示头像（绝对定位）
- 宠物详情弹窗头部显示大头像

`PetSystem.ts`：
- 初始解锁宠物从 `cat` 改为 `rat`
- 12种宠物数据完整配置

## 关卡配置

`LevelConfig.ts`：
- 前12关：每关分别收集一种生肖（rat 到 pig 各一关）
- 第13-20关：循环使用，步数和目标数量递增
- 木箱障碍关卡保持不变，只改目标元素

## 初始存档

`main.ts`：
- `unlockedPets: ['cat']` -> `unlockedPets: ['rat']`
- 宠物初始数据中的 `cat` 改名为 `rat`
- 菜单主界面的 emoji `🐱` 替换为 `rat` 头像图片

## 测试迁移

- `MatchEngine.test.ts`：所有 `makeCell('cat')` 等改为 `makeCell('rat')` 等
- `Board.test.ts`：同步更新元素引用
- `PetSystem.test.ts`：初始解锁宠物改为 `rat`，其他旧元素键名更新
- `SaveManager.test.ts`：`fragments` 中的旧键名更新
- `GameState.test.ts`：引用旧元素的测试更新

## 风险评估

- 图片文件较大（单张约500KB，12张共6MB），在移动端加载可能较慢。本次先直接复制，后续可考虑压缩或懒加载。
- 12种元素在8x8棋盘上，初始匹配概率更低，死局概率降低，游戏体验更流畅。
- 测试改动量大，需逐一验证通过。

## 验收标准

- [ ] 游戏板显示12种生肖图片，无emoji和背景色
- [ ] 特殊块（line_h、line_v、bomb）边框正常显示
- [ ] 消除、下落、提示、目标动画正常
- [ ] 宠物系统卡片和房间视图显示头像
- [ ] 20个关卡目标元素正确分配
- [ ] 所有测试通过
- [ ] `npm run dev` 正常运行无报错
