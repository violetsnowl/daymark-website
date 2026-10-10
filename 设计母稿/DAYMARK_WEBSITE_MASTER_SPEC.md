# Daymark / 拾序
# Website Master Specification

**文档名称**：Daymark Website Master Spec
**文档编号**：W0-MASTER
**版本**：v0.1
**阶段**：Website Foundation / 官网新阶段
**状态**：Design Baseline — 可进入 W1 官网架构与视觉设计
**更新日期**：2026-10-08

---

## 0. 文档目的

这不是一份“官网开发说明”，而是 Daymark 官网的**母规格**。

它负责回答五件事：

1. 官网为什么存在；
2. 官网应该让陌生用户感受到什么；
3. 官网应该如何把 Daymark 的产品理念转译成视觉与交互；
4. 官网哪些地方允许自由发挥，哪些地方绝对不能漂移；
5. 后续设计师、AI Agent、前端开发与验收人员，以什么作为唯一基线。

本文件不追求提前锁定每一个像素。它锁定的是**设计原则、叙事结构、交互哲学、系统边界与质量门槛**。

---

# 1. 当前事实基线

截至 2026-10-08，Daymark 主仓库已经进入产品发布前阶段。仓库公开信息显示，Phase 8 的 release gate 已于 2026-09-29 清零；当前产品已具备本地优先记录、课程/事项/日历主链路、课程导入、AI 解释与确认、提醒、离线同步、真实 PostgreSQL、Supabase 认证、双设备同步、Windows 与移动端验证等能力。

官网必须基于这些**真实存在的产品能力**叙事，不得为了营销而虚构产品能力。

Daymark 当前核心产品事实：

- 日常默认入口是全局事项总览，而不是学习规划 Dashboard；
- `Item` 是统一的可操作事项身份；
- Overview、Course、Calendar 等视图指向同一批事项；
- Calendar 是有时间 Item 的投影，不是另一套数据；
- Quick Capture 先保留原始输入，再进行确定性解析，仅在必要时使用 AI；
- 有歧义时优先让用户确认，不让 AI 替用户擅自决定；
- Reminder 是对事项的时间化提醒，而不是另一种 Item 状态；
- 本地优先、离线可记录、联网后同步；
- 支持跨设备同步与冲突处理；
- 产品明确不做学习规划、优先级体系、标签树、课程表替代品或 AI 教练。

来源：
- https://github.com/a161858970-ux/Daymark
- https://raw.githubusercontent.com/a161858970-ux/Daymark/main/IMPLEMENTATION_CONTEXT.md
- https://raw.githubusercontent.com/a161858970-ux/Daymark/main/CURRENT_IMPLEMENTATION_STATE.md
- https://raw.githubusercontent.com/a161858970-ux/Daymark/main/apps/web/src/styles.css

---

# 2. 官网的产品定义

## 2.1 官网不是“产品介绍页”

Daymark 官网的第一任务不是罗列功能，而是完成：

> **第一次认识 Daymark 时，让一个完全陌生的人在 30–90 秒内理解：它是什么、为什么需要它、它为什么和普通待办应用不一样，以及为什么值得打开。**

因此官网属于：

> **Editorial Product Website / 编辑式产品官网**

而不是：

- 通用 SaaS Landing Page；
- AI Startup Landing Page；
- 大量插画的学生工具宣传页；
- 追求炫技的 WebGL 展示页；
- 单纯把 App 截图排列成瀑布流的 Product Tour。

---

# 3. 品牌核心

## 3.1 品牌双名

**中文品牌：拾序**

**英文品牌：Daymark**

二者不是“中文名 + 英文翻译”的关系，而应被视为同一个品牌的双语身份。

“拾序”的核心语义：

- 拾：收拢那些零散、容易遗失的东西；
- 序：重新给予位置、上下文与顺序；
- 不强调控制一切，而强调让混乱恢复可见、可找、可完成。

“Daymark”的英文品牌感受：

- day：日常、每天；
- mark：标记、留痕、定位；
- 不要把名称解释为“daily task manager”；
- 官网语境中以品牌记忆为主，不强行做字面翻译。

## 3.2 品牌核心命题

暂定品牌命题：

> **让那些本来不该占据你记忆的事情，有一个可靠的位置。**

这不是最终公开文案；它是官网的**内容生成母句**。

所有官网功能介绍都应能回到这一命题。

## 3.3 品牌气质

四个关键词：

**Quiet / Precise / Human / Considered**

中文对应：

**安静 / 准确 / 有人感 / 有分寸**

附加气质：

- 有编辑感，而非科技炫技；
- 有温度，但不卖萌；
- 有高级感，但不奢侈品牌化；
- 有技术底子，但不把技术名词当品牌主角。

---

# 4. 官网体验目标

官网应该让用户经历这样的心理路径：

```text
“我只是随便看看”
        ↓
“这好像是在解决我真的会遇到的问题”
        ↓
“原来它不是普通待办”
        ↓
“它理解课程和事项之间的关系”
        ↓
“它把东西放回了该在的位置”
        ↓
“这个产品做得很认真”
        ↓
“我想打开试试”
```

因此：

> **理解先于说服，体验先于卖点，产品本身先于品牌口号。**

---

# 5. 非目标 / 明确禁止方向

以下方向不进入官网核心视觉语言：

## 5.1 不做 Generic SaaS

禁止：

- 蓝紫渐变；
- 巨型圆角卡片墙；
- “Everything you need to…” 套模板；
- 大面积 icon + 三栏 Feature Grid 作为主要叙事；
- 统一玻璃卡片包住所有内容。

## 5.2 不做“AI 产品”视觉

禁止：

- 紫色/蓝色 AI glow；
- 粒子大模型；
- 发光网络；
- “Ask AI” 占据 Hero 主位；
- AI 生成内容作为视觉主角。

Daymark 的 AI 是**安静的能力层**，不是品牌主角。

## 5.3 不做装饰性 3D

除非未来存在明确的产品语义，否则不使用：

- 漂浮地球；
- 立体日历模型；
- 无意义 3D 球体；
- 玻璃方块；
- 大量粒子；
- 高耗能 WebGL 背景。

## 5.4 不做“学生网站”套路

禁止把“大学生”视觉化成：

- 校园照片；
- 教室照片；
- 学生拿电脑；
- 咖啡、书本、桌面静物 stock photo；
- “考试周救星”式营销。

Daymark 的使用者可以是学生，但品牌不应被锁死为低幼学生工具。

## 5.5 不通过夸大文案制造高级感

不使用：

- revolutionary；
- next-generation；
- AI-powered everything；
- all-in-one productivity ecosystem；
- 一切没有事实支撑的超级功能词。

---

# 6. Website Visual DNA

官网不是重新设计一套颜色，而是**放大 Daymark App 已经形成的视觉基因**。

## 6.1 核心颜色

继承 App：

| Token | Value | 用途 |
|---|---:|---|
| Canvas | `#F3F0E9` | 主画布、页面环境 |
| Surface | `#FAF8F3` | 内容表面 |
| Surface Raised | `#FFFDF8` | 高层级 UI / showcase |
| Surface Muted | `#ECE9E1` | 次级区域 |
| Ink | `#252B28` | 主文字 |
| Ink Soft | `#4F5A55` | 次文字 |
| Muted | `#727B76` | 辅助文字 |
| Faint | `#969D98` | 最弱文本/标记 |
| Line | `#D9D7CF` | 分隔线 |
| Line Strong | `#C7C8BF` | 强分隔 |
| Accent | `#31564A` | Daymark 深绿 |
| Accent Strong | `#24473C` | 强调/品牌深绿 |
| Accent Soft | `#DFE7E0` | 柔和强调 |

官网允许使用透明度、径向环境光和局部 tonal variation，但不得改变整体米灰 + 米白 + 深墨 + 深绿的核心气候。

## 6.2 色彩原则

颜色的工作方式：

> **让“环境”保持安静，让“重要的东西”自然浮出来。**

绿色不是装饰色，而是“焦点被确认”的颜色。

绿色使用频率应低于页面元素数量的直觉预期。

---

# 7. Material / 材质语言

## 7.1 核心材质

Daymark 官网采用三种主要材质：

### A. Paper / Canvas

- 米灰背景；
- 轻微色温变化；
- 近乎没有纹理；
- 负责承载整个页面。

### B. Surface / Paper White

- 米白；
- 非纯白；
- 低对比度阴影；
- 负责承载产品 UI。

### C. Light / Ambient Glow

- 非霓虹；
- 极低饱和度；
- 极宽、极软；
- 用来表达 section 之间的情绪变化。

## 7.2 玻璃使用规则

官网可以使用非常少量的 translucent / blur surface，但其定位是：

> **环境与 UI 之间的接口。**

而不是：

> “因为高级网站都应该有 glassmorphism。”

玻璃必须由背景环境中的光和颜色产生意义。

禁止：

- 所有组件都是毛玻璃；
- 透明卡片套透明卡片；
- 高亮白描边塑料感；
- 强 blur 掩盖设计问题。

---

# 8. Typography System

## 8.1 总体原则

Daymark 的字体不是装饰，而是官网最重要的视觉资产之一。

字体应同时表现：

- editorial；
- human；
- calm；
- trustworthy。

## 8.2 中文

优先使用系统可用高质量宋体/人文宋体路线作为大标题风格，正文使用高可读性无衬线字体。

推荐策略：

```text
Display / Headline → ui-serif / Songti SC / STSong / 高质量中文衬线
Body → Inter / system sans / Microsoft YaHei
```

不得为了“高级感”强制引入过大的字体文件。

## 8.3 英文

英文品牌名、kicker、导航和 body 优先保持现代无衬线；大标题可以在特定场景使用 serif 形成 editorial contrast。

## 8.4 尺度

桌面首页 Hero H1 允许到：

```css
font-size: clamp(56px, 8vw, 128px);
```

但大字必须配合足够留白与合理行长，禁止只为“大”而大。

移动端 Hero H1 通常落在约 48–72px 区间，再依据具体中文断行进行视觉调整。

## 8.5 文字节奏

官网正文不追求“信息密度”，而追求：

> **一句话说清楚一件事。**

---

# 9. Layout System

## 9.1 页面整体

主内容最大宽度建议：

```text
1440–1600px 级别内容容器
```

但不是所有 section 都使用统一 max-width。

必须允许：

- full bleed；
- narrow text column；
- wide product stage；
- asymmetric editorial layout；
- edge-to-edge transition。

## 9.2 空间原则

官网空间尺度必须明显大于 App。

App 的目标是“高效使用”；
官网的目标是“给产品建立呼吸感”。

所以：

```text
App spacing → functional
Website spacing → narrative
```

## 9.3 分隔

Divider 永远是最后手段。

优先使用：

- 空白；
- 色温变化；
- 背景环境变化；
- typography hierarchy；
- product stage 的边界。

---

# 10. Motion Philosophy

核心原则：

> **Static should be beautiful. Dynamic should reveal meaning.**

中文：

> **静态足够漂亮；动态只负责揭示。**

## 10.1 Motion 三层

### Level 1 — Micro Motion

用途：按钮、hover、focus、icon、text reveal。

基准：

- 120ms：tiny feedback；
- 180ms：standard interaction；
- 240ms：content transition；
- 280ms：panel；
- 360ms：larger local transition。

继承 App 的现有 motion scale。

### Level 2 — Product Motion

用途：

- Quick Capture 展开；
- Item 被整理；
- Course context 出现；
- Calendar projection；
- Reminder；
- device sync。

建议单场景 400–900ms。

### Level 3 — Editorial Motion

用途：

- scroll narrative；
- section pin；
- large typography；
- product scene transition；
- environment light change。

可跨 1–4 秒，但应由 scroll progress 或用户行为驱动，而不是无意义自动播放。

## 10.2 Motion 禁止事项

禁止：

- UI 持续漂浮；
- 高频 bounce；
- 大面积 shake；
- 频繁 scale 1 → 1.1 → 1；
- 用鼠标移动让所有东西疯狂跟随；
- 自动轮播抢焦点；
- 首屏加载动画超过用户等待耐心。

## 10.3 Reduced Motion

用户启用 `prefers-reduced-motion` 时：

- 删除非必要位移；
- 删除 parallax；
- 删除 scrub；
- 保留低成本 opacity / state change；
- 内容顺序与可理解性必须完全保持。

---

# 11. Cursor / Pointer Philosophy

桌面端允许出现少量 pointer-aware interaction。

原则：

> **Cursor 是邀请，而不是遥控器。**

允许：

- showcase UI 局部 light response；
- hover 时轻微边界变化；
- 高价值交互点产生细小反馈；
- 图片/产品 stage 的 1–3% 以内视差。

禁止：

- 整页跟随鼠标旋转；
- cursor trail；
- 巨型 custom cursor；
- 任何遮挡正文的 cursor 特效。

---

# 12. Website Narrative Architecture

首页不是功能列表，而是一条连续叙事。

## 12.1 推荐主结构

```text
00 Opening
01 The Small Things
02 Capture
03 Put It In Context
04 One Item, Many Views
05 Remember
06 AI, Quietly
07 Offline / Sync
08 A Day with Daymark
09 Closing CTA
10 Footer
```

这是官网第一版骨架，不意味着后续每段必须独立成为一个 card section。

---

# 13. Section Specification

## 00 — Opening / First Breath

### 目的

让用户先感受到 Daymark，而不是马上理解所有功能。

### 视觉

- 大尺度留白；
- 品牌名；
- 极简 logo；
- 巨型 serif headline；
- 极低强度环境光；
- 一个真实但经过艺术指导的 Daymark UI stage。

### 核心 CTA

主 CTA：进入 Daymark / 开始使用

次 CTA：了解更多 / 查看产品

### 暂定 headline direction

可测试方向：

> **让零散的课程生活，有一个位置。**

或：

> **把该记的，交给拾序。**

二者都不是最终定稿，W1 需要进行文案比较。

### 动效

初始几乎静止。

随着用户第一次滚动：

- headline 轻微退出中心；
- product stage 进入主要视野；
- 背景环境光发生极低幅度变化。

---

## 01 — The Small Things

### 产品命题

真正消耗人的不是“管理所有人生”，而是那些零散的课程小事：

- 老师说周五交；
- 下次课要带电脑；
- PPT 上有一条要求；
- 一件事明明属于某门课；
- 时间知道，却没有可靠位置。

### 视觉方法

不要做插画。

用真实文字碎片组成一种“生活中的 information fragments”。

文字碎片慢慢汇聚到一个安静的 Daymark surface。

### 动效

碎片不应像粒子乱飞。

它们应该：

```text
散落 → 被辨认 → 被放回位置
```

这是 Daymark 品牌叙事的第一处核心隐喻。

---

## 02 — Capture

### 这是首页第一个功能高潮

用 Quick Capture 展示 Daymark 最有产品识别度的交互。

### 场景

用户输入：

> “保险经济学周五交死亡螺旋 PPT”

网页中的模拟 Daymark UI：

```text
Raw input
   ↓
course context
   ↓
due date
   ↓
Item
```

最终形成真实样式的事项。

### 核心信息

> **你先记下来。剩下的事情，不必在脑子里完成。**

这比“AI 自动识别任务”更符合 Daymark 品牌。

### 技术实现

优先做 deterministic staged animation；不要为了官网展示真的调用生产 AI。

---

## 03 — Put It In Context

### 核心产品概念

一个事项不只是一个标题，它有上下文。

```text
Item
 ├─ Course
 ├─ Semester
 ├─ Time
 ├─ Reminder
 └─ provenance
```

### 视觉

一个 Item 在页面中逐渐获得：

```text
课程
↓
日期
↓
提醒
```

但不要出现技术 schema 图。

最终用户看到的是：

> “它知道这件事属于哪里。”

---

## 04 — One Item, Many Views

### 这是官网第二个核心高潮

展示同一个 Item 在：

```text
Overview
Course
Calendar
```

之间变化。

### 关键叙事

> **一次记录，处处有它的位置。**

### 动效

不是切换三张 screenshot。

而是同一个对象在视觉空间中进行 projection：

```text
Item
 ↓
Overview
 ↓
Course
 ↓
Calendar
```

用户应该能感知到：

> “不是复制了三个东西，而是同一个东西从不同角度被看见。”

---

## 05 — Remember

### 核心产品价值

提醒不是催促，而是把记忆负担外包。

### 文案方向

> **你不用一直记得。**

### 视觉

一个有时间的 Item 在接近 deadline 时获得柔和提示。

不是红色报警器，不是通知轰炸。

可展示：

```text
deadline
     ↓
reminder
     ↓
user completion
```

### 品牌原则

Reminder 的视觉强度必须低于用户自己完成 Item 的视觉强度。

---

## 06 — AI, Quietly

### 核心立场

Daymark 有 AI，但 Daymark 不是 AI 产品。

### 页面命题

> **AI 只在它真正有用的时候出现。**

### 可展示场景

- 模糊输入；
- PDF / 图片课程导入；
- 需要用户确认的多事项拆分；
- 不确定的课程归属。

### 视觉

AI 不是一个会说话的机器人。

不要：

```text
Ask Daymark anything...
```

而是：

```text
Daymark notices ambiguity
        ↓
asks one small question
        ↓
user decides
```

### 核心品牌语义

> **它会帮忙，但不会替你做决定。**

---

## 07 — Offline / Sync

### 核心价值

记录应该在网络之外依然可靠。

### 视觉

桌面端 + 手机端两个 Daymark surface。

```text
Laptop                 Phone
   │                     │
   └──── same context ───┘
```

动作：

```text
Offline
 ↓
Capture
 ↓
Connection restored
 ↓
Sync
```

### 文案

> **先记下来。网络会自己追上。**

该区域要基于真实能力叙事，不夸大同步为无限制实时协同。

---

## 08 — A Day with Daymark

这是官网后半段最值得保留的“情绪段”。

不再介绍新功能。

而是完整模拟一个普通日子：

```text
Morning
→ check today

Lecture
→ capture a small thing

Afternoon
→ see course context

Evening
→ reminder arrives

Night
→ complete
```

目的：

> **把功能重新还原成生活。**

这一段可以成为官网最有电影感的一段，但节奏要安静。

---

## 09 — Closing / CTA

页面最后不要再次塞 Feature Grid。

只留下一个清晰动作：

> **把该记的，交给拾序。**

CTA：

> **开始使用 Daymark**

次级信息：

- Web App；
- 后续可补 Windows / Android；
- GitHub（如决定公开）。

---

# 14. Navigation

## 14.1 Desktop

采用极简顶栏。

左：

```text
logo + 拾序 / DAYMARK
```

中：

```text
Product
Philosophy
```

右：

```text
GitHub（可选）
Open Daymark
```

不建议在首页顶部放 Pricing，除非未来出现真实收费体系。

## 14.2 Mobile

优先：

```text
logo          menu
```

菜单保持极简。

不要把桌面导航原样塞进 hamburger menu 后再堆 10 个链接。

---

# 15. CTA Strategy

官网 CTA 只有一个主方向：

> **打开产品。**

所有 CTA 最终都指向：

```text
https://app.daymark.top
```

首页主域名负责品牌；App 子域名负责使用。

CTA 层级：

1. Primary — Open / Start Daymark
2. Secondary — Explore product
3. Tertiary — GitHub / documentation（如开放）

不能出现 4–6 个同权重按钮。

---

# 16. Product Showcase System

这是整个官网最重要的视觉组件系统。

## 16.1 Showcase 不等于 screenshot

必须优先让 UI “活着”。

例如：

- 事项状态变化；
- detail panel 打开；
- date 被加入；
- calendar projection；
- reminder appearance；
- course context；
- sync state。

## 16.2 UI 可简化，但不能伪造

为了视觉而删减 UI 是允许的；
为了营销而添加 App 根本不存在的功能是不允许的。

允许：

- mock user data；
- 固定 showcase scenario；
- 隐藏与叙事无关的控件；
- 为展示做数据预设。

禁止：

- 虚构不存在的 AI agent；
- 虚构协作空间；
- 虚构实时团队功能；
- 虚构无限自动化流程。

---

# 17. Interaction Scene Grammar

官网所有主要互动场景优先使用以下语法：

```text
Notice
  ↓
Focus
  ↓
Transform
  ↓
Settle
```

例如 Quick Capture：

```text
Notice input field
↓
Focus cursor
↓
Input becomes structured Item
↓
Everything settles
```

而不是：

```text
input
↓
explode
↓
spin
↓
flash
↓
AI particle
↓
card bounce
```

---

# 18. Scroll Architecture

## 18.1 基本节奏

首页应该有明显的节奏变化：

```text
Quiet
↓
Explain
↓
Interactive
↓
Quiet
↓
Interactive
↓
Emotional
↓
Quiet
```

不能每一屏都“高潮”。

## 18.2 Pinning

建议只在 2–3 个高价值章节使用 pin：

- Capture；
- One Item, Many Views；
- Offline / Sync（可选）。

其余 section 使用自然滚动。

## 18.3 Scroll progress

允许 section 内元素根据 progress 变化，但避免把整页做成一部“强制播放视频”。

用户必须可以快速滚动而不损失理解。

---

# 19. Responsive System

至少覆盖：

```text
360
390
430
768
1024
1280
1440
```

## 19.1 Mobile 原则

移动端不是 desktop 缩放版。

必须重新 composition：

- 大标题重新断行；
- 产品 showcase 从横向 stage 改为纵向 sequence；
- 复杂双栏改为连续阅读；
- motion 减少；
- pointer interaction 自动消失；
- hover-only information 不得承担核心信息。

## 19.2 Touch

所有核心交互目标保持约 44px 最小触控尺寸，继承 App 已有可访问性基线。

---

# 20. Accessibility

官网视为正式产品界面，而不是“宣传图”。

必须满足：

- semantic HTML；
- heading hierarchy；
- keyboard navigation；
- visible focus；
- reduced motion；
- meaningful alt text；
- button/link semantic separation；
- sufficient text contrast；
- interactive showcase 不依赖 hover 才能理解；
- motion 不能造成信息丢失。

---

# 21. Performance Budget

官网允许有复杂动画，但性能必须服从体验。

## 21.1 默认技术策略

优先级：

```text
CSS
↓
CSS transform / opacity
↓
Motion / lightweight React animation
↓
Canvas / SVG
↓
GSAP ScrollTrigger
↓
WebGL / Three.js（仅在存在明确价值时）
```

## 21.2 禁止默认引入

不得在初始化阶段无理由加入：

- Three.js；
- React Three Fiber；
- Lenis；
- GSAP 全家桶；
- 大型 UI library；
- 大型 icon library；
- 未使用的 analytics SDK。

## 21.3 图片

产品 showcase 优先：

- HTML / CSS UI；
- SVG；
- WebP / AVIF；
- 响应式尺寸。

不要把整块 UI 截成超大 PNG。

---

# 22. Recommended Website Tech Stack

第一版建议：

```text
React
TypeScript
Vite
CSS
Motion for React
```

如滚动叙事复杂度确实达到需求，再加入：

```text
GSAP + ScrollTrigger
```

Smooth scroll（例如 Lenis）列为后续增强，不作为 W1/W2 的硬依赖。

不默认使用 WebGL。

---

# 23. Repository / Engineering Boundary

官网与 App 分离。

建议：

```text
Daymark
└── 产品主仓库

Daymark-site
└── 官网独立仓库
```

原因：

- 官网迭代节奏不同；
- 防止 marketing animation 修改污染产品 App；
- Agent 操作半径更小；
- 部署与回滚简单；
- 可以独立做 preview deployment。

允许共享：

- logo；
- brand tokens；
- 核心颜色；
- typography rules；
- icon language。

不共享：

- App runtime state；
- production application routes；
- business logic；
- authentication implementation。

---

# 24. Domain Architecture

生产域名约定：

```text
daymark.top          → brand website
www.daymark.top      → redirect / canonical
app.daymark.top      → Web App
api.daymark.top      → public API
```

DNS 建议统一由 Cloudflare 承担；官网可部署为 Cloudflare Workers / Static Assets 路线。

API 保持独立，不与官网 Hosting 强绑定。

---

# 25. Security / Production Boundary

官网上线前：

- API CORS 从开发态宽松策略收紧为明确 allowlist；
- API 不直接暴露内部服务端口；
- public website 不持有服务端 secret；
- AI key 仅在后端；
- auth callback / redirect domains 使用生产域名；
- production env 与 development env 完全分离。

特别注意：

官网演示中的 mock data 不得调用真实用户数据。

---

# 26. SEO / Metadata

最低要求：

```text
<title>
<meta description>
canonical
Open Graph
Twitter/X card
favicon
robots.txt
sitemap.xml
```

首页 Title 工作方向：

> 拾序 Daymark — 把零散的课程生活，放回该在的位置

最终 wording 在 W1 决定。

## Open Graph

制作一张品牌主视觉，不直接使用纯 logo。

要求：

- 米灰背景；
- logo；
- 品牌名称；
- 一句品牌命题；
- 不使用过度复杂的 screenshot collage。

---

# 27. Analytics / Privacy

第一版只保留必要指标：

- 首页访问；
- CTA 点击；
- App 开始使用；
- section visibility（如确有必要）；
- outbound GitHub 点击（如开放）。

不允许为了“数据完整”默认采集大量用户行为。

产品官网的气质应与 Daymark 的数据克制原则一致。

---

# 28. Copywriting Rules

## 28.1 文案气质

优先：

- 简短；
- 有画面；
- 少术语；
- 不吆喝；
- 不过度营销。

## 28.2 文案结构

推荐：

```text
一个事实
↓
一句解释
↓
一个真实产品动作
```

而不是：

```text
标题
↓
三行营销形容词
↓
四张 feature cards
```

## 28.3 AI 文案

禁止：

> AI-powered intelligent productivity...

优先：

> 当事情不够明确时，它会问你一次。

---

# 29. Logo Rules

目前使用用户已经确定的 Daymark logo 作为官方品牌主标。

要求：

- 不修改 logo 几何；
- 不随 section 任意改色；
- 不做 3D logo；
- 不发光；
- 不做长期旋转动画；
- 不把 logo 变成网页 loading spinner。

Logo 可以在：

- 黑/深色环境；
- 米白环境；
- compact navbar；
- footer

之间做必要尺寸适配，但保持品牌识别的一致性。

---

# 30. Footer

建议保持极简：

```text
拾序
DAYMARK

把该记的，交给拾序。

Product
GitHub
Privacy
Terms

© Daymark
```

未来有正式隐私政策、服务条款、帮助中心后再扩展。

---

# 31. Agent Implementation Rules

后续任何 Agent 在进入官网代码工作区前必须先读取本文件。

Agent 必须：

1. 把本文件视为设计约束，不是灵感来源；
2. 不擅自新增品牌色；
3. 不擅自引入大型动画依赖；
4. 不把所有内容卡片化；
5. 不把 glassmorphism 当成默认 component；
6. 不制造 App 中不存在的产品能力；
7. 不让动画承担纯装饰性工作；
8. 默认支持 mobile / keyboard / reduced motion；
9. 所有复杂视觉必须有明确产品叙事理由；
10. 在大规模改动前先说明影响范围。

Agent 可以自由决定：

- 具体 HTML 结构；
- CSS architecture；
- component 拆分；
- Motion implementation；
- SVG 绘制方式；
- 数据 mock 结构。

Agent 不可以自行决定：

- 品牌定位；
- 主色系；
- Hero 核心命题；
- 首页 narrative order；
- 动效哲学；
- 是否把 AI 放到品牌中心。

---

# 32. Review Rules

每个主要 section 在 review 时必须回答五个问题：

### Q1
它是否让 Daymark 更像 Daymark？

### Q2
它是否在解释一个真实产品概念？

### Q3
去掉动效后，静态画面是否仍然成立？

### Q4
动效是否改变了用户理解，而不只是改变了视觉？

### Q5
它是否把注意力放在了正确的位置？

如果 Q3 或 Q4 为否，该 section 应退回重做。

---

# 33. Quality Gates

## W0 — Master Spec Gate

- [x] 品牌定位定义
- [x] 视觉方向定义
- [x] Motion philosophy 定义
- [x] IA 初版定义
- [x] 技术边界定义
- [x] Domain architecture 定义

## W1 — Architecture Gate

必须完成：

- [ ] 首页完整 storyboard
- [ ] 每 section 目标
- [ ] 每 section UI scene
- [ ] scroll behavior
- [ ] CTA path
- [ ] desktop/mobile composition

## W2 — Visual Gate

必须完成：

- [ ] typography
- [ ] spacing
- [ ] visual material
- [ ] hero composition
- [ ] showcase language
- [ ] motion prototype

## W3 — Prototype Gate

至少做：

- [ ] Hero
- [ ] Capture
- [ ] One Item, Many Views

必须达到：

> **只看前三段，也能判断这是不是 Daymark。**

## W4 — Full Build Gate

- [ ] 所有 section
- [ ] responsive
- [ ] accessibility
- [ ] CTA
- [ ] SEO
- [ ] error / fallback

## W5 — Production Gate

- [ ] HTTPS
- [ ] DNS
- [ ] Cloudflare
- [ ] production domain
- [ ] `app.daymark.top`
- [ ] `api.daymark.top`
- [ ] CORS allowlist
- [ ] performance test
- [ ] mobile test
- [ ] reduced-motion test

---

# 34. First Prototype Priority

不要先做完整首页。

第一轮只做一个 30–60 秒体验闭环：

```text
Hero
 ↓
The Small Things
 ↓
Quick Capture
 ↓
```

这个原型必须证明三件事：

1. Daymark 的视觉语言能在浏览器里成立；
2. “安静”与“动态”可以同时存在；
3. Product UI 可以成为官网的主角，而不是装饰。

如果这三点没有成立，不进入全文案、全文档和全站开发。

---

# 35. Final Design Principle

整个官网最终遵循一句母原则：

> **不要让网站展示 Daymark 有多少功能，让网站展示 Daymark 如何让一天重新获得秩序。**

视觉层面：

> **Quiet canvas. Precise type. Living product UI.**

交互层面：

> **Stillness first. Motion with meaning.**

产品表达层面：

> **Capture → Context → Place → Remember → Continue.**

品牌层面：

> **拾起零散的事，给它们一个位置。**

---

# 36. 下一阶段工作定义

本文件完成后，Daymark Website 正式进入：

## W1 — Website Experience Architecture

W1 不写生产代码。

W1 的交付物为：

1. 首页完整 IA；
2. 每一 section 的用户心理任务；
3. 每 section 的产品叙事；
4. storyboard；
5. desktop / mobile composition；
6. motion beat map；
7. CTA journey；
8. Hero 三套方向；
9. 第一版官网文案框架；
10. Prototype scope。

W1 完成并通过评审后，才进入 W2 Visual Direction 与原型实现。

---

# Appendix A — Current Daymark Product DNA Snapshot

```text
Brand
拾序 / Daymark

Core feeling
Quiet / Precise / Human / Considered

Canvas
#F3F0E9

Surface
#FAF8F3

Ink
#252B28

Accent
#31564A

Radius
7 / 12 / 18px

Motion
120 / 180 / 240 / 280 / 360ms

Primary object
Item

Primary action
Quick Capture

Primary views
Overview / Course / Calendar

Quiet capability
AI

Infrastructure promise
Local-first / Offline / Sync

Brand metaphor
Scatter → Gather → Place → Remember
```

---

# Appendix B — Domain Target State

```text
daymark.top
└── Website / Brand

app.daymark.top
└── Daymark Web App

api.daymark.top
└── Public API
```

---

# Appendix C — Design Vocabulary

推荐词：

- editorial
- quiet
- considered
- tactile
- warm neutral
- precise
- contextual
- living UI
- ambient light
- soft transition
- restrained motion
- spatial narrative

慎用词：

- futuristic
- disruptive
- revolutionary
- magical AI
- next-gen
- hyper productivity

禁止作为设计指令：

- “做得像一个高级 SaaS”
- “做得像 Apple”
- “加入很多科技感”
- “多一些 AI 感”
- “炫一点”

后续所有视觉需求都应该从本规格中的具体语义出发，而不是使用这些模糊描述。
