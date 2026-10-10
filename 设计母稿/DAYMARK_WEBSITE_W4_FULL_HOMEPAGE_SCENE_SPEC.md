# Daymark Website — W4 Full Homepage Scene Specification

**Project:** Daymark / 拾序  
**Stage:** W4 — Full Homepage Scene Specification  
**Version:** 0.1  
**Status:** Master specification complete for design phase  
**Domain:** `https://daymark.top/`  
**Default language:** 简体中文（CN）  
**Alternate language:** English（EN）  
**Companion documents:** W0 Website Master Spec / W1 Experience Architecture / W2 Visual + Motion Direction / W3 Prototype Specification

---

# 0. W4 的意义

W0 定义品牌与官网总原则。  
W1 定义用户阅读官网时经历的故事。  
W2 定义视觉与动效语言。  
W3 把 Hero、Scene 01、Scene 02 变成了第一份可施工原型蓝图。

W4 完成剩余首页场景，并将以下内容统一闭环：

- Scene 03 — Context
- Scene 04 — One Item, Many Views
- Scene 05 — Reminder
- Scene 06 — AI, Quietly
- Scene 07 — Offline / Sync
- Scene 08 — A Day With Daymark
- Scene 09 — Closing
- 完整导航与 Footer
- 中文文案主体系
- 英文独立内容体系
- Desktop / Tablet / Mobile 场景适配
- 全页 Scroll / Motion dependency map
- Product Showcase 组件族
- SEO / Social / Legal surface
- Production implementation brief
- 全站视觉验收 Gate

W4 的目标不是再增加“高级效果”，而是确保：

> **整张官网从第一屏到最后一屏，都像同一个 Daymark。**

---

# 1. Full Homepage Experience

完整首页结构：

```text
00  Navigation
01  Hero
02  Small Things
03  Quick Capture
04  Context
05  One Item, Many Views
06  Reminder
07  AI, Quietly
08  Offline / Sync
09  A Day With Daymark
10  Closing
11  Footer
```

整页情绪：

```text
认识
↓
共鸣
↓
尝试理解
↓
发现产品方法
↓
建立信任
↓
感到安心
↓
产生使用欲
↓
安静落地
```

整页绝对不能变成：

```text
Hero
→ 功能 1
→ 功能 2
→ 功能 3
→ 功能 4
→ 功能 5
→ CTA
```

真正的叙事线是：

```text
零散
↓
记录
↓
获得上下文
↓
获得位置
↓
被记住
↓
必要时得到帮助
↓
跨设备保持连续
↓
回到日常
↓
归于清楚
```

---

# 2. Full-page Continuity Rule

官网中的“主角”是同一个概念对象：

```text
一件真实的课程小事
```

推荐主 Demo Item：

> **周五交保险经济学 PPT**

它从 Scene 02 开始出现，并尽量在后续继续作为同一对象被继承。

继承方式：

```text
Capture
↓
Item
↓
Context
↓
Overview
↓
Course
↓
Calendar
↓
Reminder
↓
Daily timeline
```

禁止：

- 每个 section 重新创造一个完全不同的 demo item
- 每段都用不同颜色表示“新产品”
- 视觉上把同一任务不断复制成多个彼此无关的卡片

网站应该让用户隐约感受到：

> **它一直是同一件事，只是越来越有位置。**

---

# 3. Scene 03 — Context

## 3.1 Section purpose

Scene 02 解决：

> **先把事情记下来。**

Scene 03 紧接着解决：

> **事情被记下来以后，它不再只是孤立的一句话。**

核心观点：

> **事情不该只记住“做什么”。**

---

## 3.2 Primary copy

标题：

> **事情不该只记住“做什么”。**

正文：

> **它属于哪门课、什么时候发生、什么时候需要提醒，应该跟它一起存在。**

收束句：

> **记下来的，不只是内容，还有它的上下文。**

---

## 3.3 Main visual

中心对象：

```text
┌──────────────────────────────────┐
│                                  │
│  保险经济学                      │
│  周五交 PPT                      │
│                                  │
└──────────────────────────────────┘
```

然后围绕它逐步出现：

```text
           保险经济学
                │
         ┌──────┴──────┐
         │             │
       周五            提醒
         │
        PPT
```

视觉重点：

> **Item 本身保持稳定，context 在靠近它。**

---

## 3.4 Context reveal timeline

建议 Scene 03 使用中等长度 scroll narrative：

```text
0.00–0.20
Item alone

0.20–0.45
课程标签进入

0.45–0.65
时间进入

0.65–0.82
内容类型 / 描述进入

0.82–1.00
提醒状态出现

1.00
整个 Item settles
```

每一步不要同时出现。

顺序必须表达：

```text
事情
→ 属于哪里
→ 什么时候
→ 需要怎样记住
```

---

## 3.5 Material

Item：

- `#FAF8F3`
- warm border
- radius 18px
- soft shadow

Context annotation：

- 不使用重卡片
- 优先使用 text + thin line + small chip
- accent green 只用于一处主连接关系

---

## 3.6 Mobile

Desktop：

```text
Item
↖ course
→ time
↘ reminder
```

Mobile：

```text
Item
↓
课程
↓
时间
↓
提醒
```

避免同时展示四组信息。

---

# 4. Scene 04 — One Item, Many Views

# 4.1 Homepage conceptual centerpiece

这是整个官网最重要的产品思想段落。

标题：

> **同一件事，换一个位置看。**

正文：

> **总览、课程、日历，并不是三份数据，而是同一件事情的不同视角。**

收束：

> **不是复制，是换个角度看。**

---

# 4.2 Scene structure

这是全站最值得使用 Sticky / Pin 的 section。

建议高度：

```text
Desktop:
2.2–2.8 viewport heights

Tablet:
1.8–2.3 viewport heights

Mobile:
1.4–1.8 viewport heights
```

结构：

```text
section
  ├── sticky visual stage
  └── scroll progress driver
```

---

# 4.3 Visual stage

中央保持一个连续的 Product Item：

> **保险经济学 · 周五交 PPT**

周围环境发生变化。

### Stage A — Overview

UI 环境：

```text
今天

保险经济学
周五交 PPT

数理统计
明天带电脑

AI 职业与保险
阅读第 4 章
```

Item 是列表中的一个对象。

---

### Stage B — Course

整个 Product Surface 变化：

```text
保险经济学

周五交 PPT
阅读课程资料
准备课堂展示
```

同一个 Item 移入课程上下文。

---

### Stage C — Calendar

Product Surface 转为时间视角：

```text
周五

09       10       11 ... 23

                  ●
          周五交保险经济学 PPT
```

视觉语言保持一致。

---

# 4.4 Continuous identity

同一个 Item 必须满足至少 3 项连续线索：

1. 文本标题保持完全一致
2. accent / identification mark 保持一致
3. 动画路径连续

不允许：

```text
Overview 卡片消失
↓
突然出现另一张 Course 卡片
```

应该像：

```text
同一件东西
被移动到新的观察位置
```

---

# 4.5 Scroll mapping

推荐：

```text
0.00–0.18
Overview settles

0.18–0.45
Overview → Course

0.45–0.72
Course remains for reading

0.72–0.94
Course → Calendar

0.94–1.00
Calendar settles
```

Transition duration：

```text
600–1000ms
```

最好使用 scroll-linked values，而不是多个不可控 trigger。

---

# 4.6 Desktop visual composition

左侧：

```text
小节标题
一句解释
```

中央/右侧：

```text
巨大产品表面
```

底部可以出现：

```text
01  总览
02  课程
03  日历
```

这些数字不是进度条，而是轻量 editorial cue。

---

# 4.7 Mobile composition

不做左右双栏。

采用：

```text
同一件事

↓ 总览

↓ 课程

↓ 日历
```

每个视图在一个较短的视觉阶段中依次出现。

可以保留：

```text
01 / 03
```

作为轻量视觉导航，但不要做游戏化 progress meter。

---

# 5. Scene 05 — Reminder

## 5.1 Purpose

Scene 04 解决：

> **事情有位置。**

Scene 05 解决：

> **时间到了，它重新回到你面前。**

---

## 5.2 Primary copy

标题：

> **有些事，不用一直记着。**

正文：

> **到了需要注意的时候，拾序会把已经记录的事情重新带回来。**

收束：

> **你可以把它暂时放下。**

---

## 5.3 Core visual

主 Product Surface：

```text
保险经济学
周五 · 23:59
PPT
```

时间不是倒计时 UI。

不显示：

```text
23:58:41
```

这会产生焦虑和游戏化感。

---

## 5.4 Reminder reveal

视觉过程：

```text
静止的 Item
      ↓
时间标签进入
      ↓
轻微状态变化
      ↓
提醒面出现
      ↓
Item remains the same
```

Reminder 是 Item 的一次“重新出现”。

---

## 5.5 Reminder surface

建议：

```text
width: 320–420px desktop
width: 100% mobile
```

样式：

- near-white
- radius 16px
- low-contrast border
- subtle elevation

不要：

- 红色
- 警报 icon
- pulsating loop
- 大面积 notification bubble
- 系统 toast 模拟器

---

## 5.6 Motion

```text
opacity: 0 → 1
translateY: 8–10px → 0
```

约：

```text
450–650ms
```

最终状态至少停留足够久，让人读完。

---

# 6. Scene 06 — AI, Quietly

# 6.1 Role

这是品牌信任段落，不是技术展示段落。

标题：

> **AI，只在需要的时候出现。**

正文：

> **不替你安排生活，也不替你做决定。只是当一件事情还不够清楚时，帮你把它弄明白一点。**

---

# 6.2 Main scenario

使用有歧义的真实输入：

> **周五交作业**

系统发现信息不足。

出现一次轻量问题：

> **这里的“周五”是 10 月 10 日吗？**

提供两个选项：

```text
10 月 10 日
再看看
```

---

# 6.3 Visual hierarchy

页面空间应比 Scene 05 更空。

结构：

```text
                AI，只在需要的时候出现。

                    周五交作业

                 这里的“周五”
                 是 10 月 10 日吗？

                  [ 10 月 10 日 ]
                  [    再看看    ]
```

AI 标识甚至可以不单独出现。

因为：

> **真正重要的是解决歧义，而不是“这是 AI”。**

---

# 6.4 Motion

低幅度：

```text
input remains stable
↓
question fades in
↓
options become available
↓
selection resolves the Item
```

不要：

- “AI thinking” 3 秒
- 光带扫过
- loading dots 持续
- token stream
- neural network lines

---

# 6.5 Interaction

允许用户点击模拟回答。

选择以后：

```text
周五交作业
       ↓
10 月 10 日
       ↓
信息变清楚
```

Demo 完全本地。

---

# 6.6 AI truthfulness rule

官网所有 AI 文案必须遵守：

> **AI 辅助理解，不宣称 AI 替你管理整个大学生活。**

禁止：

- “全自动规划你的学期”
- “AI 自动安排所有学习任务”
- “AI 教练”
- “智能决策中枢”
- “一键替你完成管理”

这些都不是 Daymark 当前产品定位。

---

# 7. Scene 07 — Offline / Sync

# 7.1 Core proposition

标题：

> **网络不在线，事情也不用等。**

正文：

> **离线时照常记录。联网后，再安静地同步。**

---

# 7.2 Visual metaphor

核心不是云。

核心是：

> **连续性。**

建议两个设备：

```text
Laptop                     Phone
┌──────────────┐      ┌───────────┐
│ Daymark      │      │ Daymark   │
│              │      │           │
│ 新事项       │      │           │
└──────────────┘      └───────────┘
```

Laptop 新增：

> 周五交保险经济学 PPT

Phone 暂时没有。

随后：

```text
网络恢复
```

Phone 出现同一 Item。

---

# 7.3 Sync visual cue

使用极细的一条路径：

```text
Laptop ───────── Phone
```

但它不是发光 beam。

更好的表达是：

```text
Phone 的 Item opacity:
0 → 0.4 → 1
```

同时 Laptop 状态轻微稳定。

---

# 7.4 Motion

阶段：

```text
0.00
Laptop item appears

0.25
Phone still unchanged

0.45
subtle sync state

0.65
Phone item enters

0.85
both surfaces equalize

1.00
connection disappears
```

最终画面不留下永久的“连接线”。

表达：

> **同步完成以后，连接本身就不重要了。**

---

# 7.5 Mobile

移动端不强求两台设备完整并排。

可以：

```text
设备 A
    ↓
状态变化
    ↓
设备 B
    ↓
相同的 Item
```

或者采用 stacked device cards。

---

# 8. Scene 08 — A Day With Daymark

# 8.1 Purpose

前面的 section 都在解释产品机制。

这一段开始解释：

> **长期使用 Daymark，会是什么感觉？**

---

# 8.2 Primary copy

标题：

> **最后，你只是继续过自己的日子。**

正文：

> **想到的时候记下来。该看的时候去看。需要提醒的时候收到提醒。剩下的事情，不必一直占着脑子。**

---

# 8.3 Visual form

采用 editorial timeline，而不是 dashboard。

示意：

```text
08:15

想到一件事
周五交保险经济学 PPT


11:40

课程里出现一个新要求


14:20

收到一次提醒


18:05

打开课程页核对


23:10

今天的事情，各归其位。
```

---

# 8.4 Motion

Timeline progression：

```text
scroll
↓
时间轻微推进
↓
事件出现
↓
环境越来越清楚
```

环境光从稍活跃：

```text
散开的 soft light
```

逐渐变得：

```text
更均匀
更安静
```

不做昼夜主题切换。

不要让页面变成“天气 App”。

---

# 8.5 Emotional endpoint

最后一句：

> **今天的事情，各归其位。**

它不是 productivity slogan。

不是：

> “你今天效率提升了 37%。”

而是：

> **终于不用一直记着。**

---

# 8.6 Metrics prohibition

这一段禁止引入：

- 完成率
- streak
- productivity score
- 任务增长曲线
- efficiency percentage
- “节省 2.5 小时”
- AI score
- 成就徽章

Daymark 的价值是：

> **减轻认知负担。**

不是：

> **把人变成一个效率仪表盘。**

---

# 9. Scene 09 — Closing

# 9.1 Purpose

整个网站到这里应该明显变慢。

这是“落地”。

---

# 9.2 Primary copy

> **把该记的，交给拾序。**

Subcopy：

> **从下一件小事开始。**

CTA：

> **开始使用**

Secondary quiet action：

> **回到前面看看**

---

# 9.3 Composition

大面积 Canvas。

中间偏上：

```text
拾序
```

大标题：

```text
把该记的，
交给拾序。
```

CTA 位于标题下方。

底部不要再继续塞 feature list。

---

# 9.4 Final motion

页面此前的环境动效逐渐减少：

```text
ambient light amplitude
100%
 ↓
60%
 ↓
30%
 ↓
10%
```

任何产品 Surface 最终停止运动。

CTA 保持稳定。

最后用户看到的是：

```text
一个名字
一句话
一个动作
```

---

# 10. Footer

Footer 不承担新的产品叙事。

它承担：

> **身份、导航、状态、合法信息。**

---

## 10.1 Desktop composition

建议：

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  拾序 / Daymark                                              │
│  把零散的小事，放回它该在的位置。                            │
│                                                              │
│  产品              关于               外部                    │
│  怎么工作          品牌介绍            GitHub                 │
│  开始使用          更新日志            联系方式               │
│                                                              │
│  中文 / English                                               │
│                                                              │
│  © Daymark                                                   │
│  隐私政策 · 服务条款                                          │
└──────────────────────────────────────────────────────────────┘
```

---

## 10.2 Footer density

比传统 SaaS footer 少。

不放：

- 巨量 sitemap
- 十几个社交链接
- “Resources” 等空泛栏目
- 没有实际内容的知识中心
- 虚构联系方式

---

## 10.3 Mobile

采用纵向堆叠。

每组之间留足空间。

不要折叠菜单式 footer，除非内容真实增长到无法自然排版。

---

# 11. Full Navigation Architecture

## 11.1 Chinese

桌面推荐：

```text
拾序 / Daymark

理念
怎么工作
关于

中文 / English

进入 Daymark
```

建议 anchor：

```text
理念 → Small Things
怎么工作 → Capture / Context / Views
关于 → A Day / Footer
```

---

## 11.2 English

对应：

```text
Daymark

Ideas
How it works
About

中文 / English

Open Daymark
```

不要为了保持长度一致而强行逐字符翻译。

---

# 12. Language Architecture — Final

正式生产结构：

```text
/
  Chinese homepage

/en/
  English homepage
```

必要时可扩展：

```text
/en/about
/en/privacy
```

中文：

```text
/about
/privacy
```

但 V1 不需要创建大量页面。

---

## 12.1 Language switch

桌面：

```text
中文 / English
```

当前语言可以使用轻微强调。

不能出现：

```text
简中 | 繁中 | English | 日本語 | ...
```

V1 不做过度国际化。

---

## 12.2 Persistence

使用 localStorage 或等价轻量机制保存明确语言选择。

键名示意：

```text
daymark-language
```

值：

```text
cn
en
```

语言偏好不应该写入后端账户数据。

---

## 12.3 Locale semantics

中文版：

```text
zh-CN
```

英文：

```text
en
```

HTML：

```html
<html lang="zh-CN">
```

英文：

```html
<html lang="en">
```

---

# 13. Chinese Content System — V1

以下是 V1 中文文案母稿。

## Hero

### H1

> **把课程生活里那些零散的小事，放回它该在的位置。**

### Description

> **拾序是一个为大学生设计的课程与事项管理工具。想到就记，让课程、时间和提醒各归其位。**

### Primary CTA

> **开始使用**

### Secondary CTA

> **看看它怎么工作 ↓**

---

## Small Things

### H2

> **真正容易忘记的，往往不是大事。**

### Body

> **“周五交 PPT。”“明天记得带电脑。”“老师说看第五章。”这些事情都不大，却散落在课程、聊天、脑子和日历之间。**

---

## Capture

### H2

> **先记下来。**

### Body

> **不要为了记录一件事，先想好它应该属于什么。**

### Caption

> **记录，不应该是另一件需要管理的事。**

---

## Context

### H2

> **事情不该只记住“做什么”。**

### Body

> **它属于哪门课、什么时候发生、什么时候需要提醒，应该跟它一起存在。**

---

## Views

### H2

> **同一件事，换一个位置看。**

### Body

> **总览、课程、日历，并不是三份数据，而是同一件事情的不同视角。**

### Closing

> **不是复制，是换个角度看。**

---

## Reminder

### H2

> **有些事，不用一直记着。**

### Body

> **到了需要注意的时候，拾序会把已经记录的事情重新带回来。**

### Closing

> **你可以把它暂时放下。**

---

## AI

### H2

> **AI，只在需要的时候出现。**

### Body

> **不替你安排生活，也不替你做决定。只是当一件事情还不够清楚时，帮你把它弄明白一点。**

---

## Sync

### H2

> **网络不在线，事情也不用等。**

### Body

> **离线时照常记录。联网后，再安静地同步。**

---

## A Day

### H2

> **最后，你只是继续过自己的日子。**

### Body

> **想到的时候记下来。该看的时候去看。需要提醒的时候收到提醒。剩下的事情，不必一直占着脑子。**

### Closing

> **今天的事情，各归其位。**

---

## Closing

### H2

> **把该记的，交给拾序。**

### Body

> **从下一件小事开始。**

### CTA

> **开始使用**

---

# 14. English Content System — V1 Direction

English must be written as native copy, not literal translation.

Provisional semantic direction:

Hero:

> **Put the small things back where they belong.**

Supporting idea:

> Daymark is a course and task manager built for university life.

Capture:

> **Remember it first. Organize it second.**

Views:

> **One thing. Different ways to see it.**

AI:

> **AI, only when you need it.**

Sync:

> **Offline when you are. Sync when you can.**

Closing:

> **Leave the things worth remembering to Daymark.**

These are content-direction placeholders. English should receive its own later copy polish and should not be displayed on the Chinese site.

---

# 15. Responsive Scene Matrix

| Scene | Desktop | Tablet | Mobile |
|---|---|---|---|
| Hero | editorial split + large product surface | reduced split | stacked |
| Small Things | scattered field | denser field | vertical fragments |
| Capture | centered large input | centered medium | full-width input |
| Context | radial annotations | partial radial | vertical context |
| Views | sticky multi-view stage | shorter sticky stage | sequential stacked views |
| Reminder | device / surface | single device | single surface |
| AI | sparse centered scene | same | compact centered interaction |
| Sync | laptop + phone | two compact devices | stacked devices |
| A Day | wide editorial timeline | centered timeline | vertical timeline |
| Closing | large whitespace | same | shorter whitespace |

---

# 16. Mobile-Specific Principles

Mobile page不是 Desktop 的压缩版。

核心顺序：

```text
文字
↓
产品对象
↓
单一状态
↓
下一件事
```

同时出现在画面中的主要对象最好不超过：

```text
1 个主对象
2 个辅助对象
```

特别是：

- One Item / Many Views
- Offline / Sync

必须优先保证阅读清晰，而不是完整复制桌面镜头。

---

# 17. Full Motion Dependency Map

## Global ambient

```text
Canvas
  └── ambient light
```

Amplitude:

```text
very low
```

不依赖滚动理解。

---

## Hero

```text
page load
 ├── nav reveal
 ├── headline reveal
 ├── copy reveal
 └── product surface reveal

pointer
 ├── product depth
 └── light movement

scroll
 └── hero → scene 01 transition
```

---

## Small Things

```text
scroll
 ├── fragments align
 ├── opacity normalize
 └── scene handoff
```

---

## Capture

```text
user submit
 ├── captured
 ├── structured
 └── settled
```

---

## Context

```text
scroll
 ├── course
 ├── time
 ├── reminder
 └── settled
```

---

## One Item / Many Views

```text
scroll
 ├── overview
 ├── course
 └── calendar
```

This is the largest motion dependency.

---

## Reminder

```text
scroll / scene activation
 └── reminder reveal
```

---

## AI

```text
scroll
 └── clarification appears

interaction
 └── ambiguity resolves
```

---

## Sync

```text
scene progress
 ├── device A changes
 ├── delay
 ├── sync state
 └── device B converges
```

---

## A Day

```text
scroll
 ├── timeline advances
 ├── event appears
 └── environment calms
```

---

## Closing

```text
scroll
 └── motion decelerates
```

---

# 18. Motion Implementation Rules

## 18.1 One source of truth per scene

Do not build:

```text
onScroll callback A
onScroll callback B
intersection trigger C
timer D
setTimeout E
```

for the same visual relationship.

Prefer one scene progress value:

```ts
progress = 0...1
```

Then derive all local properties.

---

## 18.2 No scroll hijacking

Do not disable native browser scrolling.

No custom scroll container for the whole page.

No wheel-event interception unless there is an exceptional, documented reason.

---

## 18.3 Fast scrolling

When user scrolls fast:

- scene may skip intermediate states
- final state must remain coherent
- pinned scenes must not trap the visitor
- no long forced animation

---

# 19. Product Showcase Component Inventory

Recommended website-only component family:

```text
SiteNav
LanguageSwitch
PrimaryCTA
SectionHeader
SceneCaption

ProductSurface
ProductWindow
ProductHeader
ItemRow
ItemDetail
CourseLabel
DateLabel
ReminderSurface
CaptureField
ContextAnnotation
ViewSwitcher
CalendarProjection
DeviceFrame
SyncIndicator
TimelineEvent
AIClarification
```

---

# 20. Component Ownership

## Site shell

```text
SiteNav
Footer
LanguageSwitch
CTA
```

## Content

```text
Copy data files
Demo data
Metadata
```

## Product showcase

```text
ProductSurface
ItemRow
CaptureField
...
```

## Motion

```text
scene progress
derived transforms
reduced-motion adapters
```

## Scene composition

```text
HeroScene
SmallThingsScene
CaptureScene
ContextScene
ViewsScene
ReminderScene
AIScene
SyncScene
DayScene
ClosingScene
```

组件原则：

> **Scene 决定故事。Component 决定可复用的视觉物件。**

---

# 21. Demo Data Model — Final

建议建立网站专用 dataset：

```ts
const showcaseData = {
  mainItem: {
    course: "保险经济学",
    title: "周五交 PPT",
    time: "周五",
    detail: "PPT"
  },

  secondaryItems: [
    {
      course: "数理统计",
      title: "明天带电脑",
      time: "明天"
    },
    {
      course: "AI 职业与保险",
      title: "阅读第 4 章",
      time: "下周"
    }
  ],

  fragments: [
    "周五交 PPT",
    "明天带电脑",
    "老师说看第五章",
    "下周再交",
    "这件事属于哪门课？"
  ]
};
```

数据必须 deterministic。

禁止根据随机数改变布局故事。

---

# 22. Demo Interaction Safety

所有官网 Demo：

```text
Local state only
```

绝对不能：

```text
fetch(api.daymark.top)
POST /items
读取真实用户数据
调用生产 LLM
读取登录状态
```

即便未来用户已经登录了 Daymark 官网，官网 showcase 仍然使用 demo state。

---

# 23. SEO Architecture

## Chinese

Canonical：

```text
https://daymark.top/
```

Title：

> **拾序 Daymark｜课程与事项管理**

Description：

> **把课程生活里零散的小事，放回它该在的位置。拾序是一款为大学生设计的课程与事项管理工具。**

---

## English

Canonical：

```text
https://daymark.top/en/
```

Title / Description 独立编写。

---

## Required metadata

```text
canonical
hreflang
robots
sitemap
favicon
theme-color
og:title
og:description
og:image
twitter:card
```

---

# 24. Open Graph Image

OG 图片不使用：

```text
browser screenshot
```

建议：

```text
米灰背景
大留白
拾序 / Daymark logo
一句核心中文
一个小型真实 product surface
```

尺寸：

```text
1200 × 630
```

移动社交平台应能在缩略图里看懂：

> 这是一个安静、认真、具有产品感的工具。

---

# 25. Favicon / App Icon

复用正式品牌 Logo。

至少准备：

```text
favicon.svg
favicon.ico
apple-touch-icon.png
icon-192.png
icon-512.png
```

不要专门做一个与产品 App 完全不同的“网站 favicon”。

---

# 26. 404 Page

404 不做幽默彩蛋。

建议：

标题：

> **这里暂时没有你要找的东西。**

辅助：

> **也许它应该在别的位置。**

按钮：

> **回到拾序**

视觉保持主站 Canvas / Typography。

这一页可以成为品牌气质的小补充，但不要比首页更炫。

---

# 27. About Surface — V1

首页 Footer 的“关于”可以跳到一个轻量 About section，而不是立即建设完整公司官网。

内容核心：

> **拾序，Daymark。**

> **为大学生的课程生活而做。**

简述：

> 课程里真正需要记住的，往往不是一件“大事”，而是许多零散、具体、容易忘记的小事。拾序希望让这些事情有地方可去，也让你不必一直把它们放在脑子里。

不要虚构：

- 公司规模
- 融资
- 用户数量
- 商业合作
- “全球数百万学生”
- 任何未经事实支持的市场数据

---

# 28. GitHub Surface

如果当前 release policy 允许公开仓库，则 Footer 可以提供：

> **GitHub**

指向公开项目。

视觉上只是一个外部链接。

不要把 GitHub 变成：

```text
GitHub Stars 1,024
Open source community
...
```

除非这些数字已经真实存在且具有展示价值。

---

# 29. Legal Surface

至少预留：

```text
隐私政策
服务条款
```

如果 V1 内测阶段尚未最终发布正式条款：

> 使用独立占位页面，不写虚假法律文本。

正式上线前需要完成法务文本确认。

---

# 30. Accessibility — Full Homepage

要求：

## Semantic

```text
header
nav
main
section
footer
```

标题：

```text
1 × h1
多 × h2
必要时 h3
```

---

## Keyboard

所有：

- CTA
- language switch
- nav
- menu
- interactive demo

必须可键盘操作。

---

## Focus

Focus indicator 必须清晰。

沿用产品语言：

```text
accent outline / ring
```

不能简单：

```css
outline: none;
```

---

# 31. Reduced Motion — Full Site

当：

```css
prefers-reduced-motion: reduce
```

时：

## 保留

- all copy
- all product states
- all UI relationships
- final scene states
- CTA
- language switch

## 删除或简化

- parallax
- ambient drift
- scroll-scrubbing transforms
- long intro
- large scale movement
- decorative transitions

特别是 Scene 04：

```text
sticky transformation
```

不能成为理解产品的唯一方式。

在 reduced-motion 模式下，可以直接按静态顺序显示：

```text
总览
课程
日历
```

---

# 32. Performance Budget — Production Direction

建议目标：

```text
LCP
< 2.5s on reasonable mobile conditions

CLS
< 0.1

INP
good / responsive
```

核心要求：

- 首屏不使用重型视频
- 首屏不依赖 WebGL
- 产品 UI 优先 HTML/CSS
- 字体谨慎加载
- below-the-fold media lazy-load
- 图片采用 AVIF / WebP / SVG
- 避免大体积第三方动画库
- 不用 JS 实现可以用 CSS 完成的效果

---

# 33. Browser Support

首版重点验证：

```text
Chrome / Edge
Safari
Firefox
```

移动重点：

```text
iOS Safari
Android Chrome
```

不要求极老旧浏览器像素级一致。

但不能因为不支持某个现代视觉 API，就让核心内容消失。

---

# 34. Deployment Architecture — Website

推荐生产结构：

```text
GitHub
   ↓
Cloudflare Workers / Static Assets
   ↓
daymark.top

app.daymark.top
   ↓
Daymark Web App

api.daymark.top
   ↓
Cloud server
   ↓
reverse proxy
   ↓
127.0.0.1:3100
```

官网本身尽量保持静态 / edge-hosted。

不要为了官网继续增加一台应用服务器。

---

# 35. Environment Variables

网站只允许出现公开、非敏感配置，例如：

```text
VITE_APP_URL
VITE_GITHUB_URL
VITE_SITE_URL
```

禁止：

```text
DATABASE_URL
JWT_SECRET
SUPABASE_SERVICE_ROLE_KEY
API private keys
LLM keys
```

任何不需要发送给浏览器的 secret 都不能进入前端 bundle。

---

# 36. Production Domain Rules

Canonical public surfaces：

```text
https://daymark.top/
https://daymark.top/en/
https://app.daymark.top/
https://api.daymark.top/
```

建议：

```text
www.daymark.top
→ 301 / canonical redirect
→ daymark.top
```

不要让：

```text
www.daymark.top
daymark.top
```

长期都被搜索引擎视为两个独立主站。

---

# 37. Website / App Boundary

官网不应该直接复用整个 `apps/web`。

建议：

```text
Daymark
├── apps/web       ← 产品 App
├── apps/api       ← API
└── ...

Daymark-site       ← 官网
```

共享概念即可：

```text
brand tokens
logo
terminology
demo data
```

不应该因为官网改动而高风险影响产品 App。

---

# 38. Agent Implementation Brief — Final

## Agent identity

Agent is:

> **Implementation engineer**

Agent is not:

> **Creative director**

---

## Agent may decide

- CSS implementation
- component extraction
- exact DOM nesting
- responsive interpolation
- state management mechanics
- animation implementation details
- performance optimizations
- browser compatibility fixes

---

## Agent may not independently change

- brand palette
- core typography direction
- section order
- Chinese-first language model
- main headline
- main visual narrative
- product truthfulness
- AI positioning
- motion philosophy
- anti-pattern rules

Without explicit design review.

---

# 39. Agent Build Order

## Stage A

```text
site shell
routing
language system
metadata
navigation
footer
```

## Stage B

```text
Hero
Small Things
Capture
```

## Stage C

```text
Context
Views
```

## Stage D

```text
Reminder
AI
Sync
```

## Stage E

```text
A Day
Closing
```

## Stage F

```text
responsive QA
motion QA
accessibility
performance
SEO
```

---

# 40. Agent Stop Conditions

Agent must stop and request review when:

1. Hero begins to look generic.
2. Accent green becomes dominant.
3. Motion requires WebGL / heavy dependency.
4. Chinese typography feels forced.
5. Product showcase can no longer be identified as real Daymark.
6. Scene 04 becomes visually confusing.
7. Mobile composition requires horizontal scrolling.
8. Animation becomes the only way to understand a section.
9. Implementation requires real API calls for showcase behavior.
10. Agent believes adding a new visual system is necessary.

---

# 41. Full Homepage Build Acceptance Gate

官网正式认为“设计实现方向成立”，必须同时满足：

## Brand

- [ ] 不看 Logo，颜色、空间、字体、产品表面也能感觉是 Daymark。
- [ ] 没有 generic SaaS aesthetic。
- [ ] 米灰是环境，不是一个卡片。
- [ ] 深绿是强调，不是发光主色。

## Language

- [ ] `/` 为完整中文体验。
- [ ] 中文站没有装饰性英文副标题。
- [ ] `/en/` 为完整独立英文体验。
- [ ] 全局语言切换正常。

## Product

- [ ] 用户能理解 Daymark 是课程与事项管理工具。
- [ ] Quick Capture 清晰。
- [ ] Context 清晰。
- [ ] One Item / Many Views 成为真正的产品差异点。
- [ ] Reminder / AI / Sync 没有夸大。

## Motion

- [ ] 每个 major animation 都有明确语义。
- [ ] 快速滚动不失控。
- [ ] reduced-motion 模式完整。
- [ ] 没有大范围 bounce / spin / shake。

## Mobile

- [ ] 390px 可自然阅读。
- [ ] 不出现水平滚动。
- [ ] 产品 UI 不缩成看不懂。
- [ ] 主要交互支持 touch。

## Performance

- [ ] 没有 heavy hero video。
- [ ] 没有 WebGL 核心依赖。
- [ ] 首屏加载不会被非必要效果阻塞。
- [ ] media 经过压缩。

## Trust

- [ ] 所有产品展示都是真实能力的忠实表达。
- [ ] Demo 不触碰生产数据。
- [ ] 不展示私人信息。
- [ ] 不虚构用户规模、市场数据、AI 能力。

---

# 42. Final Art Direction Checklist

在每一次大改之后，都问：

### 1

> **它更像 Daymark 了吗？**

### 2

> **它让用户更懂产品了吗？**

### 3

> **这个动画真的需要吗？**

### 4

> **中文是不是自然的第一语言？**

### 5

> **删掉 20% 的装饰以后，会不会反而更好？**

最后一个问题尤其重要。

---

# 43. Full Homepage Mental Model

如果整个官网最终只能留下一个动态印象，应该是：

```text
一个零散的念头

        ↓

被拾起来

        ↓

获得课程

        ↓

获得时间

        ↓

获得提醒

        ↓

在总览里找到它

        ↓

在课程里理解它

        ↓

在日历里看到它

        ↓

在需要的时候重新回来

        ↓

同步到另一块屏幕

        ↓

最后

不再需要一直记着它
```

这就是 Daymark 官网最完整的一句话。

---

# 44. Master Website Principle

> **让网页像拾序本身一样：不制造更多信息，不用更多效果证明自己，而是把已经存在的事情，放到更合适的位置。**

---

# 45. Design Phase Status

W0:

```text
PASS
```

W1:

```text
PASS
```

W2:

```text
PASS
```

W3:

```text
READY FOR PROTOTYPE IMPLEMENTATION
```

W4:

```text
MASTER SPEC COMPLETE
```

这里的“COMPLETE”指：

> **官网设计母规格层面的闭环已经完成。**

并不意味着：

> 官网已经视觉验收完成。

真正的实现仍然必须经历：

```text
W3 prototype implementation
        ↓
local visual review
        ↓
W4 implementation
        ↓
whole-page visual QA
        ↓
production polish
```

---

# 46. Recommended Next Engineering Stage

设计阶段之后，不再继续无限增加 W5 / W6 / W7 的“大方向文档”。

下一阶段直接进入：

# **Website Implementation**

第一实现目标：

```text
Hero
+
Small Things
+
Quick Capture
```

先跑起来。

然后进行一次真正的视觉评审。

评审通过之后，再继续：

```text
Context
→ Views
→ Reminder
→ AI
→ Sync
→ A Day
→ Closing
```

这时设计规格负责“不要跑偏”，浏览器实际渲染负责“告诉我们什么真的好看”。

---

# 47. Closing Note

Daymark 的产品本体已经花了大量精力去解决：

> 记录、上下文、时间、提醒、离线、同步、AI 和不同视角之间的关系。

官网不应该再创造第二套世界。

官网真正应该做的是：

> **把产品已经解决的关系，变成一段可以被用户亲眼看见的体验。**

因此最终的高级感不来自“技术多”。

而来自：

```text
设计有秩序
信息有位置
动效有理由
产品有真实感
语言有自己的声音
```

这才是 Daymark / 拾序 的官网。
