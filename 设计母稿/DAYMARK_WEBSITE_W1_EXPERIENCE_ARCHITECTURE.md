# Daymark Website — W1 Experience Architecture

**Project:** Daymark / 拾序  
**Stage:** W1 — Website Experience Architecture  
**Version:** 0.1  
**Status:** Working master; section-level visual specs are to be derived from this document  
**Domain target:** `daymark.top`

---

## 0. Purpose of W1

W1 does not implement the website. It defines the **experience architecture** of the homepage: what the user sees, understands, and feels as they move through the page.

The governing principle is:

> **The website should explain Daymark by letting the product itself tell the story.**

The homepage is therefore not a conventional feature list. It is an editorial sequence in which one small real-life item is progressively given context, place, time, and memory.

---

# 1. Experience Thesis

## 1.1 What a first-time visitor should understand

Within the first 15–25 seconds, a visitor who has never heard of Daymark should be able to answer:

1. What is it? — a course and task management tool for university students.
2. Why is it different? — it captures small, scattered course-related things and keeps their context.
3. How does it feel? — calm, considered, trustworthy, not noisy or over-automated.
4. What can I do next? — start using the product.

The website should **not** require the visitor to understand the underlying data model, synchronization protocol, AI architecture, or implementation details before understanding the product value.

## 1.2 Emotional progression

The page should move through this sequence:

**Recognition → Relief → Curiosity → Understanding → Trust → Desire to use**

The intended reaction is not “wow, lots of features.” It is:

> “对，就是这些小事最容易忘。”
>
> “原来它是这样把事情放回课程上下文里的。”
>
> “这个东西看起来很舒服。”
>
> “我想试一下。”

---

# 2. Hero Decision

## 2.1 Chosen direction

**Direction A — The Place for Small Things**

Hero headline:

> **把课程生活里那些零散的小事，放回它该在的位置。**

This is the preferred direction because it connects directly to the Chinese brand **拾序** while explaining the product philosophy without reducing it to “another task manager.”

Supporting copy:

> 拾序是一个为大学生设计的课程与事项管理工具。想到就记，让课程、时间和提醒各归其位。

Primary CTA:

> **开始使用**

Secondary CTA:

> **看看它怎么工作**

English brand line may appear as a quiet supporting line rather than the primary hero headline:

> **A quieter place for everything you shouldn't have to remember.**

This English line is provisional and should not dominate the Chinese product positioning in V1.

## 2.2 Hero composition

Desktop:

- Large serif headline occupying roughly 5–7 lines at wide desktop sizes.
- Narrow supporting paragraph under the headline.
- One primary CTA and one quiet secondary action.
- A large real Daymark product scene occupies the lower-right / lower-center field.
- Product scene is not a flat screenshot pasted into a card. It should feel like a physical page/surface placed inside the environment.
- The product UI remains legible at rest.

Mobile:

- Headline becomes 3–5 shorter lines.
- Product visual follows the copy rather than competing with it.
- CTA remains immediately reachable.
- No horizontal cinematic composition that requires the user to zoom or pan.

## 2.3 Hero visual behaviour

At initial load:

- Ambient light is already present.
- Product UI enters with low-distance opacity + translate animation.
- No exaggerated zoom, spin, bounce, or elastic overshoot.

During pointer movement:

- Very small depth/parallax response, approximately 2–6px maximum.
- UI geometry should remain stable.
- Background environment may respond more than the product surface.

During first meaningful scroll:

- Hero product scene becomes the first object in the editorial narrative.
- The page does not simply slide past the hero screenshot.
- The scene transitions into the first product story beat.

---

# 3. Homepage Information Architecture

The homepage is one continuous editorial story.

```text
00  Opening / Hero
        ↓
01  The Small Things
        ↓
02  Capture First
        ↓
03  Put It In Context
        ↓
04  One Item, Many Views
        ↓
05  Let Daymark Remember
        ↓
06  AI, Quietly
        ↓
07  Offline When You Are, Sync When You Can
        ↓
08  A Day With Daymark
        ↓
09  Closing / CTA
        ↓
10  Footer
```

The sections are not independent feature cards. Each section should visually inherit at least one object, phrase, or motion state from the preceding section.

---

# 4. Section 00 — Opening / Hero

## Message

Daymark gives scattered course-life details a place.

## Visual question

**What is this product?**

## Primary visual

A real Daymark overview scene with a small number of realistic sample items.

Example seed data should feel like real university life:

- 保险经济学 · 周五交 PPT
- 数理统计 · 明天带电脑
- AI 职业与保险 · 阅读第 4 章

Do not use empty lorem ipsum, generic startup copy, or invented enterprise data.

## Motion beat

The page loads almost still.

One item quietly gains attention. A very subtle focus cue reveals that the interface is alive.

The user's first scroll causes the product scene to move into the next section instead of disappearing instantly.

## CTA behaviour

`开始使用` → `app.daymark.top` in production.

`看看它怎么工作` → scroll to Section 02.

---

# 5. Section 01 — The Small Things

## Purpose

Create recognition before explaining software.

## Headline direction

> **真正容易忘记的，往往不是大事。**

Alternative supporting line:

> “周五交 PPT。” “明天记得带电脑。” “老师说看第五章。” 这些事情都不大，却散落在课程、聊天、脑子和日历之间。

## Visual system

Instead of showing external apps, use typographic fragments floating in the Daymark environment.

Fragments begin scattered across a large canvas.

Examples:

```text
周五交 PPT
明天带电脑
看第五章
老师说下周再交
这件事属于哪门课？
```

They do not behave like chaotic particles. Their motion is slow and legible.

As the user scrolls, the fragments gradually align around one shared spatial axis.

## Transition

The aligned fragments collapse into one capture input.

This is the bridge into Section 02.

## Design intent

The visitor should understand the problem before seeing the solution.

---

# 6. Section 02 — Capture First

## Core idea

> **先记下来。不要为了记录它，先想好它应该属于什么。**

This section demonstrates Quick Capture as the first-class entry point.

## Product sequence

The page shows one authentic capture interaction:

```text
“周五交保险经济学 PPT”
          ↓
       已记录 ✓
          ↓
   解析 / 理解上下文
          ↓
      课程 + 时间
```

Important: the website should not imply that AI always runs immediately. The actual product architecture gives deterministic parsing priority and invokes AI only when necessary.

## Motion

1. Text is typed or revealed.
2. Local “recorded” state appears first.
3. Structured information appears second.
4. Any ambiguity is handled as a small question, not a dramatic AI flourish.

## Key sentence

> **记录，不应该是另一件需要管理的事。**

---

# 7. Section 03 — Put It In Context

## Core idea

A task without context is incomplete.

Suggested headline:

> **事情不该只记住“做什么”。**

Supporting line:

> 它属于哪门课、什么时候发生、什么时候需要提醒，应该跟它一起存在。

## Visual

The captured item becomes a real Daymark Item.

Its context unfolds around it:

```text
保险经济学
      │
      ├── 周五
      ├── PPT
      └── 提醒
```

The object itself should remain visually stable while metadata appears around it.

## Critical rule

Do not animate the item by spinning it around in 3D.

The meaning is in the **addition of context**, not in geometric spectacle.

---

# 8. Section 04 — One Item, Many Views

## Core idea

This is one of the most important sections in the entire website.

Headline:

> **同一件事，换一个位置看。**

Supporting line:

> 总览、课程、日历，并不是三份数据，而是同一件事情的不同视角。

This directly reflects the actual product model: `Item` is the unique actionable identity; Overview, Course, and Calendar are projections/views of that same item. The current implementation context explicitly defines this separation. citeturn274064view2

## Main visual sequence

One item remains in the center:

```text
保险经济学 · 周五交 PPT
```

Then three environments appear sequentially:

### View 1 — Overview

The item sits among today's unfinished matters.

### View 2 — Course

The same item sits under 保险经济学.

### View 3 — Calendar

The same item appears on Friday.

The item's internal identity never visually “resets.”

## Interaction

A scroll-driven transition should make the visitor feel:

> **不是复制，是换个角度看。**

## Why this section matters

This is the clearest place where Daymark demonstrates that it is not simply a nicer checklist.

---

# 9. Section 05 — Let Daymark Remember

## Core idea

> **你可以忘记它，Daymark 不会。**

Use this carefully. It means “remember the task for you,” not an absolute reliability guarantee.

## Visual

Desktop + phone composition.

A task approaches its due time.

A restrained reminder appears:

```text
保险经济学
明天 · 23:59
PPT
```

The reminder should look like part of the system, not an advertising popup.

## Motion

- Time advances subtly.
- Notification appears with opacity + tiny vertical movement.
- The phone/display responds with a soft material change.
- No pulse loop, no red alarm aesthetic.

## Important semantic truth

The actual product derives reminders from Item time and `ReminderPolicy`; reminders are delivery events rather than a third Item status. This should guide the visual model. citeturn274064view2

---

# 10. Section 06 — AI, Quietly

## Brand proposition

> **AI 只在需要的时候出现。**

This section should be deliberately quieter than modern AI landing pages.

## Example

Show an input with mild ambiguity:

```text
周五交作业
```

Daymark asks one restrained question:

> “这里的‘周五’是 10 月 10 日吗？”

User chooses the appropriate interpretation.

The item then becomes structured.

## Copy direction

> 不替你安排生活。
>
> 不替你做决定。
>
> 只是帮你把模糊的事情，变得清楚一点。

## Hard rule

Never use:

- glowing AI brain graphics
- “Powered by AI” as a hero badge
- autonomous-agent visual clichés
- fake token streams
- hallucinated “smartness” demonstrations

The current product deliberately uses deterministic parsing first, preserves RawCapture, and asks the user to resolve substantive ambiguity. The website must not exaggerate this behavior. citeturn274064view2

---

# 11. Section 07 — Offline When You Are, Sync When You Can

## Core idea

> **网络，不应该决定你能不能记下一件事。**

## Message

Daymark is local-first in everyday interaction. A capture is committed locally before success feedback; authenticated sessions synchronize in the background when available. The current product architecture and release validation explicitly cover offline/sync behavior and real-device validation. citeturn878997view1turn274064view3

## Visual

Laptop on left, phone on right.

At first:

```text
Laptop                       Phone
  Daymark                     Daymark
```

The user creates an item on one side.

The other device quietly catches up.

No giant cloud icon.

No “magic beam.”

The key visual is **continuity**.

## Suggested micro-copy

> 离线时照常记录。
>
> 联网后，再安静地同步。

---

# 12. Section 08 — A Day With Daymark

## Purpose

Move from feature understanding to lifestyle understanding.

This section should answer:

**“长期使用，它会怎样进入我的一天？”**

## Format

Editorial timeline rather than dashboard.

```text
08:15
想到一件事

11:40
课程里的新要求

14:20
收到一次提醒

18:05
打开课程页核对

23:10
今天的事情都各归其位
```

The actual events are illustrative; the structure is the important part.

## Visual principle

The interface slowly becomes calmer as more items are placed correctly.

The emotional movement is:

**scattered → gathered → clear**

Do not show productivity metrics, streaks, scores, or “efficiency +37%” because these are not part of Daymark's product identity.

---

# 13. Section 09 — Closing

The final section should deliberately slow down.

Preferred copy direction:

> **把该记的，交给拾序。**

Supporting copy:

> 从下一件小事开始。

CTA:

> **开始使用 Daymark**

Secondary quiet link:

> 下载 / 登录 / 了解更多

The final 15–20% of the page should contain substantially less visual activity than the middle of the page.

This creates an intentional “landing” instead of ending with a sales banner.

---

# 14. Navigation Architecture

## Desktop navigation

Left:

**拾序 / DAYMARK**

Center or left-middle anchor links:

- 理念
- 怎么工作
- 功能
- 关于

Right:

- GitHub / Project (subject to release policy)
- **进入 Daymark**

The navigation should be compact and translucent only where it improves continuity with the environment.

## Mobile navigation

- logo
- one primary CTA
- menu sheet for secondary navigation

No oversized SaaS mega-menu.

## Scroll behaviour

The navbar may become slightly more opaque after the first viewport, but should not morph into a heavy fixed browser bar.

---

# 15. Editorial Scroll Model

The page uses four types of scroll behaviour.

## Type A — Reveal

Text / UI enters as the viewport reaches it.

Use for:

- headings
- captions
- small product annotations

## Type B — Transform

The same object changes state across a section.

Use for:

- Quick Capture → Item
- Item → Context
- Item → Overview / Course / Calendar

## Type C — Hold / Pin

A section remains visually stable while scroll drives internal state changes.

Use sparingly for:

- Section 04
- Section 07

## Type D — Environment

Very slow background / ambient-light response.

Use throughout the page at low amplitude.

## Global rule

If an animation does not improve comprehension, remove it.

---

# 16. Motion Beat Map

| Moment | User action | Primary motion | Secondary motion | Purpose |
|---|---|---|---|---|
| Hero entry | page load | opacity + 8–16px rise | ambient light | establish calm |
| Hero | pointer | 2–6px parallax | soft environment response | depth |
| Hero → 01 | scroll | product scene shifts | typography enters | transition |
| 01 | scroll | text fragments align | opacity changes | show scattered → ordered |
| 01 → 02 | scroll | fragments collapse to input | line/ambient response | conceptual bridge |
| 02 | scroll | text enters field | cursor / caret | capture |
| 02 | internal timeline | recorded state first | structured fields second | show product truth |
| 03 | scroll | context labels appear | tiny line draws | contextualization |
| 04 | scroll | viewport changes | same item persists | projections |
| 05 | time/scroll | reminder rises | device material response | memory |
| 06 | scroll | question appears | no AI theatrics | ambiguity handling |
| 07 | scroll | device states converge | subtle sync cue | continuity |
| 08 | scroll | timeline progresses | environment calms | daily rhythm |
| 09 | scroll | motion decelerates | light settles | closure |

---

# 17. Product Demonstration Rules

## 17.1 Real UI first

The website should render actual product components or faithful, internally maintained showcase components whenever practical.

Avoid exporting random static screenshots as the primary storytelling medium.

## 17.2 Demo data

Use a dedicated website showcase dataset.

Never expose test accounts, personal information, API keys, live user data, or production database records.

## 17.3 UI fidelity

Showcase components must preserve:

- Daymark typography
- current palette
- current radius language
- current icon stroke language
- actual information hierarchy
- actual terminology

The website may simplify density for presentation, but must not invent product behavior.

---

# 18. Visual Density Strategy

The homepage should breathe.

Target rhythm:

```text
large editorial space
      ↓
small amount of copy
      ↓
product interaction
      ↓
quiet space
      ↓
next idea
```

Avoid the modern SaaS default of:

```text
headline
card
card
card
logo wall
card grid
pricing
CTA
```

Daymark has too much personality for that structure.

---

# 19. Copywriting Rules

## Voice

- calm
- direct
- human
- specific
- lightly literary
- never self-important

## Prefer

> 放回它该在的位置。

> 先记下来。

> 同一件事，换一个位置看。

> AI 只在需要的时候出现。

## Avoid

> 下一代
>
> 革命性
>
> 超级智能
>
> 全能生产力平台
>
> AI 驱动的未来工作空间
>
> 提升效率 300%

The product does not need inflated claims to justify itself.

---

# 20. Performance / Accessibility Experience Rules

The visual ambition does not override basic web quality.

Required baseline:

- keyboard navigable
- visible focus states
- semantic headings
- reduced-motion mode
- no critical information hidden behind motion
- mobile usable without horizontal scroll
- product interactions have non-animated fallbacks
- touch targets remain comfortably usable
- images and video are lazy/optimized where appropriate
- fonts do not block first meaningful paint

The current product already has explicit touch-target, focus, reduced-motion, and physical mobile validation work; the website should inherit that attitude rather than regress it. citeturn115213view1turn274064view3

---

# 21. Mobile Composition Rules

Mobile is not desktop compressed to 390px.

## Desktop

Use:

- wide typography
- large product scenes
- horizontal relationships
- pinned narrative moments

## Mobile

Use:

- vertical narrative
- fewer simultaneously visible objects
- stacked product states
- simplified motion
- more direct copy

At any point, the visitor should understand which object is being discussed.

When a desktop effect would reduce legibility on mobile, use a different composition rather than simply disabling it.

---

# 22. Homepage Failure Modes

The implementation is considered wrong if it becomes:

1. A generic beige SaaS template.
2. A portfolio piece that forgets to explain the product.
3. An AI landing page with green/black glow effects.
4. A gallery of screenshots with no narrative.
5. A motion demo in which the interface moves more than the meaning does.
6. A page that requires desktop-class hardware to feel good.
7. A copy-heavy landing page with no tangible product demonstration.

---

# 23. Reference Principles From Existing Product Websites

Current high-quality product sites reinforce the direction taken here: Things presents the product through focused visual simplicity and a direct explanation of its core task model; Craft uses authentic product surfaces as the narrative medium and connects multiple capabilities through a continuous story rather than relying only on abstract marketing graphics. citeturn921445search4turn921445search0

Daymark should borrow the principle—not the visual identity:

> **Show the product doing the thing.**

---

# 24. W1 Acceptance Gate

W1 is PASS when the following are all true:

- [ ] First viewport communicates Daymark's category and core value without a feature list.
- [ ] Hero direction is locked.
- [ ] Homepage has a coherent narrative from problem → capture → context → views → reminder → AI → sync → daily use → CTA.
- [ ] Quick Capture is the primary interactive story beat.
- [ ] One Item / Many Views is established as the conceptual centerpiece.
- [ ] AI is visibly subordinate to the product's core value.
- [ ] Motion has a reason for every major beat.
- [ ] Desktop and mobile have separate composition logic.
- [ ] Showcase data is defined as fictional/demo data.
- [ ] Website never promises functionality that the current product does not actually provide.
- [ ] The visual language remains a direct descendant of Daymark's existing product UI.

---

# 25. Next Stage — W2

W2 should now turn the architecture into a concrete **Visual + Motion Direction Specification**.

W2 deliverables:

1. Hero visual composition, exact hierarchy, and first-screen geometry.
2. Section-by-section visual boards in written form.
3. Color/material system for the web environment.
4. Typography scale and responsive rules.
5. Product showcase frame system.
6. Motion tokens and easing hierarchy.
7. Scroll scene specifications.
8. Desktop/mobile composition for each major section.
9. Asset rules.
10. A first “prototype target” containing Hero + Section 01 + Section 02.

W2 is the stage at which the site can become concrete enough for implementation planning.
