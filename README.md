# Daymark / 拾序 — 品牌官网

`daymark.top` 的前端实现。当前进度：**十节 + 完整 Footer 全部实现，已完成多轮验收修订，并已正式上线 `https://daymark.top`**（2026-10-12，Cloudflare Workers + GitHub 自动部署；Hero / 小事 / 先记下来 / 上下文 / 换一个位置看 / 提醒 / AI / 离线同步 / 一天 / 落地）。

官网不是普通 SaaS 落地页，而是 Daymark 产品视觉语言在公共 Web 空间的延伸。本仓库的所有视觉与动效决定都来自 5 份设计母稿，不在这里重新定义。

> **接手这个项目请先读 [`HANDOFF.md`](./HANDOFF.md)** —— 它讲现在在哪、怎么接着干、别踩什么。
> 实现细节与逐轮修复记录在 [`REVIEW.md`](./REVIEW.md)（含当前生效的全部滚动窗口参数）。

---

## 快速开始

```bash
npm install
npm run dev        # http://127.0.0.1:5173/
```

其它命令：

```bash
npm run build      # tsc -b && vite build -> dist/
npm run preview    # 本地预览生产构建 http://127.0.0.1:4173/
npm run typecheck  # 仅类型检查
npm test           # 本地确定性解析器的单元测试
```

> Windows 提示：`vite.config.ts` 里开启了 `server.watch.usePolling`。某些编辑器保存文件时会短暂锁定临时文件，原生 watcher 会因此抛 `EBUSY` 崩溃，轮询可以规避。

---

## 设计母稿是唯一基线

实现前必须按顺序阅读（优先级 W0 → W1 → W2 → W3 → W4），文件在 `设计母稿/`：

| 文档 | 作用 |
|---|---|
| `DAYMARK_WEBSITE_MASTER_SPEC.md` | 品牌、视觉基因、动效哲学、禁止项、验收规则 |
| `DAYMARK_WEBSITE_W1_EXPERIENCE_ARCHITECTURE.md` | 首页叙事结构、每段用户心理任务 |
| `DAYMARK_WEBSITE_W2_VISUAL_MOTION_DIRECTION.md` | 视觉与动效方向、响应式美术指导 |
| `DAYMARK_WEBSITE_W3_PROTOTYPE_SPEC.md` | 第一版原型的可施工规格（本次实现范围） |
| `DAYMARK_WEBSITE_W4_FULL_HOMEPAGE_SCENE_SPEC.md` | 完整首页场景与中文文案母稿 |

**实现者可以决定**：CSS 机制、组件拆分、DOM 结构、响应式插值方式、状态管理、动画实现细节、性能优化、兼容性处理、无障碍实现。

**实现者不可以自行决定**：品牌定位、主色系、中文优先的语言体系、Hero 核心命题、首页叙事顺序、动效哲学、AI 品牌定位、产品真实能力边界。

---

## 目录结构

```text
src/
  app/                    站点外壳
    App.tsx               路由：/ 与 /en/
    LocaleProvider.tsx    语言上下文（切换、持久化、路径前缀）
    HomePage.tsx          场景组成顺序（十节）
    useDocumentMeta.ts    title / canonical / hreflang / OG 随路由更新
    NotFoundPage.tsx      404
  content/                内容层（文案与数据，与视觉组件解耦）
    types.ts              SiteCopy 契约
    cn.ts / en.ts         中文母稿 / 英文独立文案
    demo.ts               showcase 数据集（中英各一份，确定性）
    parseCapture.ts       本地确定性"理解"步骤
    *.test.ts             解析器与主 Item 连续性测试
    config.ts             公开非敏感配置
  components/
    site/                 站点外观：导航、语言开关、按钮、品牌标记、Footer
    product/              Daymark 产品界面展示组件族
    scene/                SceneHeader + 十节场景组件
  motion/
    index.ts              reduced-motion、场景 progress（三种窗口定义）、stepReveal
  styles/
    tokens.css            设计 token（直接继承 App）
    global.css            基础排版、按钮、环境光、reduced-motion
    site.css              各场景布局
```

分层原则：**内容层决定说什么，场景层决定故事，组件层决定可复用的视觉物件，motion 层只提供数值。**

---

## 三处关键机制

### 1. 语言体系（中文优先）

- `/` 是完整中文体验，也是 canonical 入口；`/en/` 是完整英文体验。
- 中文页面不出现装饰性英文标题、slogan 或双语双行展示；只有 `Daymark`、`GitHub` 这类专有名词保留拉丁写法。
- 语言是一次真实跳转，不做原地翻译，因此任何时刻都不会同屏出现两种语言。
- 明确选择会写入 `localStorage: daymark-language`；**入口不由浏览器语言推断**——`/` 永远是中文（用户裁决 2026-10-13），`/en/` 只能由语言开关进入。

### 2. 产品展示（本地、确定性）

首页里出现的 Daymark 界面（Hero、场景 02/04/05/07）全部是 **HTML/CSS 组件**，不是截图：

- 完全本地状态，不请求 `api.daymark.top`，不读写数据库，不调用真实 LLM，不读取登录态。
- 视觉语言直接继承产品本体：`#F3F0E9` canvas、`#FAF8F3` surface、7/12/18px 圆角、`事项总览 / 课程 / 日程` 等真实术语、`ui-serif + Songti SC` 大标题栈。
- 刷新后故事完全一致，没有任何随机。

场景 02 展示的是产品真实的逻辑顺序：

```text
记下 → 理解 → 确认 → 归位
```

先出现"已记录"，再出现结构化字段；当地址不足以判断"它属于哪门课"时，`CLARIFY` 状态会明说这一点并等待用户确认，而不会编造答案。

场景 06（AI, Quietly）沿用同一条原则：输入「周五交作业」只缺**课程归属**，所以它只问这一件事，也只确认这一件事 —— 时间保持用户写的「周五」，内容保持「作业」，**不生成任何未经确认的日期或细节**。「再看看」是一条真实可用的路径，不是死路。

**由此产生一条硬约束**：主 Item 的时间元信息统一为「周五 · 23:59」，页面上不允许出现任何具体日期（`checks.mjs` 里有正则扫描守着）。

### 3. 动效

- 每个场景只有 **一个** scroll progress 值（`useSceneProgress`），所有局部变化由它派生；没有多套互相打架的 trigger。
- 窗口有**三种定义方式**，按场景性质选，不是风格偏好：视口比例（钉住场景）、固定像素（揭示须完整发生在屏内）、**场景自有边界**（后面还有内容的场景）。当前每个场景用的是哪种、参数是多少，见 [`REVIEW.md`](./REVIEW.md) §0。
- 数值来自视口测量而非累加，因此快速滚动不会把用户困在未完成的动画里。
- `prefers-reduced-motion: reduce` 是一等模式：不做视差、不做碎片漂移、不做滚动 scrub，直接呈现最终可读状态。
- 禁止项照旧：大幅旋转、bounce、shake、无意义 parallax、自动轮播。

---

## 本地验证

`.review/` 下是本地验证工具（不属于站点产物，也不参与构建）：

```bash
node .review/checks.mjs        http://127.0.0.1:4173/   # 105 项浏览器行为断言（主入口）
node .review/probe-page-end.mjs http://127.0.0.1:4173/  # 六视口的场景边界与"离开后是否还变"
node .review/measure.mjs       http://127.0.0.1:4173/   # 参考视口 DOM 几何测量
node .review/shots.mjs         http://127.0.0.1:4173/   # 参考视口截图（按状态定位）
node .review/perf.mjs          http://127.0.0.1:4173/   # LCP / CLS / 传输量采样
node .review/probe.mjs         http://127.0.0.1:4173/   # 场景滚动窗口实测
node .review/probe-bands.mjs   http://127.0.0.1:4173/ 1440 900   # 逐帧打出 progress 与各元素值
```

`checks.mjs` 覆盖：Scene 02 状态机与重置、歧义输入、Scene 03 的四组上下文与「事项静止」、Scene 04 的三个投影与标记连续性、Scene 05 的两次到达、Scene 06 的课程归属歧义（含"不生成日期"）、Scene 07 的四种状态与边界、Scene 08 的"不是仪表盘"与时间轴逐条到场、Scene 09 的构成、Footer 三组与链接可解析、键盘可聚焦、移动端菜单（含 Escape 与滚动锁定）、7 个宽度的水平溢出、reduced-motion 终态、语言切换与持久化、metadata 与 canonical、404。

`.review/scratch/` 是排查用的一次性脚本，可随时删除。

参考视口（W3 §25.3）：`1440×900`、`1280×800`、`768×1024`、`390×844`，外加 `360`/`430`/`1024` 溢出回归；六视口探针另含 `1024×1366`。

---

## 这一版**没有**做

独立页面（`/about`、`/privacy`、`/terms`）、正式 Open Graph 主视觉、分析埋点、`<1024px` 的 tablet motion 矩阵（整页验收已完成，等排期）。这些属于预期而非缺失，均在母稿的后续 Stage 中，或需项目所有者拍板。**网页版已上线**（`app.daymark.top`，由 App 仓库 `violetsnowl/Daymark` 的 `daymark-app` Worker 托管，非本仓库产物）。

## 已知待办

1. `public/favicon.svg` 是按品牌标记几何重绘的矢量版本，最终上线前应与正式品牌资产核对。
2. Logo 目前只使用产品 App 既有的标记几何；若存在正式矢量资产，应替换为它。
3. 英文文案为独立撰写的第一版，V2 锁定前还需要一轮语言润色。
4. **一处"成对参数"**需要同步修改，没有自动化检查能抓住不一致：Scene 07 的 `.scene-sync` 尾部空间 ↔ 它的 `leadIn`。它有交叉注释。（Scene 04 原先也是手工成对——舞台高度 ↔ 组件里的窗口——现在由同一次测量写入并由断言看守，不再需要人肉同步；见 REVIEW §0D 第四轮。）
5. ~~**远端仓库尚未配置**~~ —— **已解决（2026-10-11）**：已推送 `violetsnowl/daymark-website`（私人仓库），Cloudflare 连仓自动部署。见 [`HANDOFF.md`](./HANDOFF.md) §7。

---

## 部署

**已于 2026-10-12 完成上线**（`daymark.top`；执行记录见 [DEPLOY.md](./DEPLOY.md) §8）。域名托管、Cloudflare 与 GitHub 自动部署的完整步骤见 [DEPLOY.md](./DEPLOY.md)。
