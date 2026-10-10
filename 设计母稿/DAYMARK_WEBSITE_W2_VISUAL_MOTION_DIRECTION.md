# Daymark Website — W2 Visual + Motion Direction

**Project:** Daymark / 拾序  
**Stage:** W2 — Visual + Motion Direction  
**Version:** 0.1  
**Status:** Working master  
**Domain target:** `daymark.top`  
**Language policy:** Chinese-first; English is a complete alternate-language site, not mixed bilingual presentation

---

## 0. W2 Purpose

W2 turns the W1 experience architecture into a concrete visual and motion direction.

W2 answers five questions:

1. What does the Daymark website physically look like?
2. What is the visual hierarchy of each major scene?
3. How does the site move without becoming a motion showcase?
4. How does the same system behave on desktop, tablet, and mobile?
5. How is Chinese treated as the primary product language, with English as a deliberate alternate site rather than a parallel line-by-line translation?

W2 is still a design specification. It does **not** lock implementation details that should be discovered through prototype testing, but it does lock the intended visual behavior tightly enough that an implementation agent can no longer interpret “高级、克制、动态” freely.

---

# 1. Non-Negotiable Design Position

## 1.1 Core sentence

> **Daymark 的官网不是广告页，而是一个可以被阅读的产品空间。**

The visitor should feel that they have entered the same world as the product itself.

## 1.2 Visual personality

The website should feel:

- 安静
- 有秩序
- 温和
- 精确
- 有人味
- 有编辑感
- 有质感
- 有一点点诗意，但不矫饰

It should **not** feel:

- 科技创业公司模板
- AI 产品发布页
- 年轻潮流品牌官网
- SaaS 模板
- 极简到没有人格的设计作品
- 华丽但缺乏产品信息的互动实验

## 1.3 The website must look like Daymark, not “a website for Daymark”

The visual system is a direct descendant of the product application.

Existing product tokens include:

- Canvas: `#F3F0E9`
- Surface: `#FAF8F3`
- Raised surface: `#FFFDF8`
- Ink: `#252B28`
- Ink soft: `#4F5A55`
- Muted: `#727B76`
- Line: `#D9D7CF`
- Accent: `#31564A`
- Accent strong: `#24473C`
- Accent soft: `#DFE7E0`
- Radius: 7 / 12 / 18px
- Existing motion scale: 120 / 180 / 240 / 280 / 360ms

These are the foundation, not suggestions. The current app's root CSS establishes this visual language directly. citeturn149769view1

## 1.4 Web extension of the product system

The website may add three visual concepts that do not need to exist inside the normal app UI:

1. **Environment Light** — very soft atmospheric illumination.
2. **Editorial Scale** — oversized typography and large empty fields.
3. **Narrative Surface** — large product surfaces that can transform during scrolling.

These additions must never introduce a new color identity.

---

# 2. Language Architecture — Chinese First

This is a hard requirement for V1.

## 2.1 Chinese is the default public language

`https://daymark.top/` opens the Chinese site.

All primary navigation, headings, explanatory copy, buttons, captions, interaction labels, footer content, accessibility labels, and SEO-facing visible copy are Chinese.

Do not place Chinese and English as two visible lines simply to look international.

## 2.2 English is a separate full-language mode

English is available through an explicit global language control.

Recommended route structure:

```text
/        → 简体中文
/en/     → English
```

The language switch changes the complete page language.

Example:

```text
中文  |  English
```

It should not generate a page like:

```text
把课程生活放回它该在的位置。
A quieter place for everything you shouldn't have to remember.
```

The Chinese site never becomes a bilingual poster.

## 2.3 Language switching behavior

- Explicit user choice takes priority over browser language.
- Do not automatically redirect a user away from `/` based solely on browser locale.
- Persist the visitor's explicit language choice.
- `/` remains the canonical Chinese experience.
- `/en/` is the canonical English experience.
- Later implementation should provide `hreflang` between the two versions and correct canonical URLs.

## 2.4 What may remain in English on the Chinese site

Only unavoidable proper names or brand marks:

- Daymark as the official Latin brand name
- GitHub, Google, etc. where they are actual external service names
- technical names when a product setting genuinely needs them

No English taglines, feature headings, or duplicate explanatory copy should be added merely for decoration.

## 2.5 Copy rhythm in Chinese

Prefer short, natural Chinese sentences.

Good:

> **先记下来。**

> **同一件事，换一个位置看。**

> **AI 只在需要的时候出现。**

Avoid:

> 下一代 AI 驱动的智能课程生产力解决方案

---

# 3. Global Page Geometry

## 3.1 Canvas

Base page color:

```css
background: #F3F0E9;
```

The page is not a collection of white cards floating on beige.

The beige canvas is the **continuous environment**.

White/near-white surfaces appear only when they have semantic purpose: a product surface, input field, reminder card, device screen, or contained article object.

## 3.2 Main content width

Target desktop content width:

```text
1280–1360px
```

Maximum art direction width:

```text
1440px
```

The page may use full viewport space for environmental scenes, but text and dense product content should remain controlled.

## 3.3 Outer gutters

Recommended starting values:

```text
≥ 1440px viewport: 48–64px
1200–1439px:       40–48px
768–1199px:       28–40px
< 768px:          20–24px
```

These are visual targets, not a license to hard-code every section independently.

## 3.4 Grid

Desktop:

```text
12-column grid
24px nominal gutter
```

Tablet:

```text
8-column grid
20px nominal gutter
```

Mobile:

```text
4-column logical grid
16px nominal gutter
20–24px outer padding
```

The grid is primarily for alignment discipline. Decorative objects may extend beyond it.

## 3.5 Vertical rhythm

The page uses large editorial pauses.

Typical major section spacing:

```text
Desktop: 160–260px
Tablet: 120–180px
Mobile: 96–144px
```

Large pauses are intentional. Do not compress the page just to reduce scroll length.

---

# 4. Surface and Material System

## 4.1 Three material classes

### Material A — Canvas

The page's continuous environmental field.

Characteristics:

- matte
- warm
- no visible border
- extremely subtle ambient gradients

### Material B — Product Surface

Used for Daymark UI shown inside the website.

Characteristics:

- near-white
- precise border
- restrained shadow
- existing Daymark radius language
- strong text readability

### Material C — Editorial Glass / Light Surface

Used only for floating navigation, small control surfaces, and a few scene transitions.

Characteristics:

- low opacity
- no thick white border
- background-aware
- very subtle blur
- no glossy “Apple clone” effect

The site may borrow the concept of material responding to its environment, but it must remain visibly Daymark.

## 4.2 Shadow

Existing app shadow:

`0 18px 55px rgba(40,48,43,0.09)`

Website showcase surfaces may use a similar family but should generally reduce contrast rather than increase it.

The product should feel seated in the page, not levitating 60px above it.

## 4.3 Border rules

Use borders only when they communicate structure.

Preferred:

```text
1px line
low contrast
warm gray
```

Avoid:

```text
bright white outline
hard gray rectangle
multiple nested borders
```

---

# 5. Typography Direction

## 5.1 Hierarchy

Daymark's website is typography-led, but not typography-only.

There are three tiers:

### Display Serif

For:

- hero headline
- major section statements
- closing line

Recommended direction:

```text
Noto Serif SC / Songti SC / platform serif fallback
```

The final font choice must be tested on Windows, macOS, iOS, and Android before V2 lock.

### Product Sans

For:

- interface
- navigation
- supporting copy
- metadata
- captions

Direction:

```text
Inter + Chinese sans fallback
```

### Utility Text

For:

- tiny labels
- section indices
- state captions

Small but never cryptic.

## 5.2 Hero typography

Desktop target:

```text
font-size: clamp(56px, 6.2vw, 96px)
line-height: 1.05–1.12
letter-spacing: slightly negative / optical
```

The headline should generally stay within roughly 7–10 Chinese characters per line where composition allows it, rather than forcing one giant block.

Mobile target:

```text
44–58px display size
line-height: 1.10–1.18
```

Exact values should be refined in the first prototype.

## 5.3 Body copy

Target desktop:

```text
17–20px
line-height: 1.65–1.8
```

Mobile:

```text
16–18px
line-height: 1.65–1.8
```

The website should never rely on very small text to look refined.

---

# 6. Hero — Exact Visual Direction

## 6.1 Hero purpose

The hero must answer:

> **Daymark 是什么？**

without looking like an app-store description.

## 6.2 Hero composition

Desktop composition:

```text
┌──────────────────────────────────────────────────────────────┐
│ 拾序 / Daymark                     关于  怎么工作   开始使用 │
│                                                              │
│                                                              │
│   把课程生活里那些                                            │
│   零散的小事，                                                │
│   放回它该在的位置。                                          │
│                                                              │
│   为大学生而做的课程与事项管理工具。                           │
│   想到就记，让课程、时间和提醒各归其位。                       │
│                                                              │
│   [ 开始使用 ]      [ 看看它怎么工作 ↓ ]                      │
│                                                              │
│                              ┌──────────────────────────┐    │
│                              │      Daymark 总览        │    │
│                              │                          │    │
│                              │  保险经济学   周五交 PPT │    │
│                              │  数理统计     明天带电脑 │    │
│                              │  AI 职业与保险 阅读第4章│    │
│                              └──────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

The exact ASCII arrangement is conceptual. The important visual relationship is:

**large editorial text + real product surface + wide breathing room**.

## 6.3 Product surface angle

The product scene may have a very mild perspective effect.

Recommended maximum:

```text
X rotation: 0–2°
Y rotation: 0–4°
Z rotation: 0°
```

This is enough to imply physical presence without becoming a 3D mockup.

## 6.4 Initial state

At page load:

- canvas is already visible
- headline is already legible quickly
- product surface enters with opacity + 8–16px vertical movement
- ambient green light settles behind it
- nothing bounces
- no loading animation occupies the hero

## 6.5 Pointer response

Desktop pointer interaction:

- Product surface: maximum 2–4px depth response.
- Background light: maximum 10–18px movement across a broad radius.
- Buttons: ordinary product micro-interaction.

The pointer should make the environment feel responsive, not move the application around.

## 6.6 Hero scroll transition

The first meaningful scroll should transform the hero into the next scene.

The product surface should not merely slide upward and vanish.

Preferred sequence:

```text
Hero product scene
      ↓
slight deceleration
      ↓
product scene becomes visually quieter
      ↓
scattered phrase fragments begin appearing
      ↓
hero text exits the attention center
```

The user should feel like they are entering a new page chapter.

---

# 7. Scene 01 — “真正容易忘记的，往往不是大事。”

## 7.1 Visual idea

A large open field with scattered fragments of real university-life notes.

Example:

```text
周五交 PPT

明天带电脑

老师说看第五章

下周再交

这件事属于哪门课？
```

## 7.2 Placement

Fragments should be placed using a designed composition, not random coordinates.

They should occupy approximately 55–70% of the content field.

A few may sit close to the viewport edges as quiet peripheral material.

## 7.3 Motion

Initial state:

- fragments have slight positional variation
- no spinning
- no particle behavior
- no continuous wandering

Scroll:

- fragments progressively align to an invisible grid
- text opacity changes subtly
- two or three fragments can move more than the others to establish the concept

End state:

The fragments naturally suggest a single input field.

## 7.4 Transition into Capture

The final motion should be semantic:

```text
散落的事情
      ↓
聚到一起
      ↓
一句话
      ↓
“先记下来。”
```

---

# 8. Scene 02 — Quick Capture

## 8.1 This is the first major interactive hero moment

The scene should make a visitor want to interact with it even before clicking the CTA.

## 8.2 Composition

A large centered Daymark capture surface.

Approximate desktop width:

```text
680–820px
```

The rest of the viewport remains quiet.

## 8.3 Demonstration sequence

Show:

```text
周五交保险经济学 PPT
```

Then:

```text
已记录
```

Then structured interpretation:

```text
保险经济学
周五
PPT
```

## 8.4 Important truthfulness rule

Do not visually imply that every capture is instantly “AI analyzed”.

The current implementation saves RawCapture first, then determines whether a safe deterministic path can form an Item; ambiguous inputs may remain pending, and AI is used only when required. citeturn149769view0

The website should show the logical order:

**记下 → 理解 → 确认 → 归位**

not:

**输入 → AI 魔法 → 完美任务**

## 8.5 Interaction

On desktop, the visitor may click into the field and edit the demo phrase.

The interaction is simulated locally and must never write to the production database.

The demo should offer one low-friction reset action, such as:

> 重新试一次

---

# 9. Scene 03 — Context

## 9.1 Visual idea

The captured sentence becomes an actual structured object.

Center object:

```text
保险经济学
周五交 PPT
```

Context grows outward:

```text
课程        时间        提醒
```

## 9.2 Geometry

Keep the item stationary.

Use surrounding metadata to move instead.

This is the opposite of “hero object flies around the screen”.

## 9.3 Visual rhythm

```text
item
↓
course appears
↓
time appears
↓
reminder appears
↓
whole object settles
```

The final state should feel materially calmer than the initial one.

---

# 10. Scene 04 — One Item, Many Views

## 10.1 This is the conceptual centerpiece

The scene may occupy an entire viewport height plus an additional narrative scroll period.

## 10.2 Sticky stage

Recommended structure:

```text
section
  ├── sticky visual stage
  └── scroll narrative driver
```

The visual stage remains broadly stable while the same Item changes context.

## 10.3 Three views

### Overview

The item is one of several unfinished things.

### Course

The item is shown under 保险经济学.

### Calendar

The same item is projected onto Friday.

## 10.4 No cloning illusion

The website should make it obvious that the object remains the same.

Methods:

- same title text
- same small identifying accent
- continuous motion path
- no hard scene cuts

Recommended motion:

```text
View 1 → 2: 600–900ms
View 2 → 3: 700–1000ms
```

Motion may be scroll-scrubbed rather than time-triggered.

## 10.5 Final caption

Preferred Chinese line:

> **不是复制，是换个角度看。**

---

# 11. Scene 05 — Reminder

## 11.1 Visual idea

Time becomes visible without becoming an alarm.

## 11.2 Device composition

One desktop or phone display is enough in the first half of the scene.

A second device may appear later, but the focus is the reminder itself.

## 11.3 Reminder appearance

Example:

```text
保险经济学
明天 · 23:59
PPT
```

Appearance:

- fade in
- 6–10px upward movement
- small increase in surface elevation
- no pulsing loop
- no red warning motif

## 11.4 Product truth

Reminder plans are derived from Item time and ReminderPolicy; reminder delivery is not a replacement for the Item itself. The current implementation explicitly models reminders as delivery events. citeturn149769view0

The website should therefore show a reminder as something that **surfaces an existing item**, not as a new task card created by the reminder system.

---

# 12. Scene 06 — AI, Only When Needed

## 12.1 Visual mood

This section should be more empty than the sections before it.

A small ambiguous input occupies the center.

Example:

```text
周五交作业
```

Then one modest clarification:

> **这里的“周五”是 10 月 10 日吗？**

## 12.2 Visual hierarchy

The question should be smaller than the primary product object.

No glowing neural network.

No animated code stream.

No giant “AI” title.

The section headline can be:

> **AI，只在需要的时候出现。**

## 12.3 Motion

The AI clarification should appear almost like a normal UI state.

That restraint is the point.

---

# 13. Scene 07 — Offline / Sync

## 13.1 Core visual metaphor

**Continuity, not cloud magic.**

Laptop and phone are shown as two instances of one living Daymark environment.

## 13.2 Sequence

```text
Laptop                    Phone
   │                        │
   │   item exists          │
   │                        │
   └──── network returns ───┘
            ↓
       state converges
```

## 13.3 Motion

Use a very thin, low-contrast connection cue.

The cue should be closer to a change in state than a visible “beam”.

Suggested sequence:

1. New item is created on laptop.
2. Phone remains unchanged for a beat.
3. Sync indicator subtly activates.
4. Phone updates.
5. Both devices settle into visually matching states.

## 13.4 Product truth

Current release documentation says local capture commits before success feedback and authenticated sessions synchronize in the background when available; real multi-device verification has been performed. citeturn149769view0

The website may confidently show continuity, but should not imply instant synchronization under every network condition.

---

# 14. Scene 08 — A Day With Daymark

## 14.1 This scene should be the quietest product scene before the ending

Rather than another feature section, show a day progressing.

## 14.2 Composition

A vertical editorial timeline:

```text
08:15
想到一件事

11:40
课程里出现一个新要求

14:20
收到一次提醒

18:05
打开课程页核对

23:10
今天的事情，各归其位
```

## 14.3 Motion

The timeline progresses slowly.

The environment gradually becomes visually simpler.

This creates the emotional progression:

```text
散
↓
聚
↓
清楚
```

## 14.4 Explicitly prohibited metrics

Do not introduce:

- productivity scores
- streaks
- percentage improvements
- fake “time saved” counters
- gamification badges
- empty dashboard analytics

These are not part of Daymark's product identity.

---

# 15. Closing Scene

## 15.1 Visual direction

The page should end with almost nothing competing for attention.

Large quiet field.

Small brand mark.

Headline:

> **把该记的，交给拾序。**

Supporting line:

> **从下一件小事开始。**

Primary CTA:

> **开始使用**

## 15.2 Motion

The page slows down rather than stops abruptly.

Ambient gradients settle.

Any active pointer or scroll effects reduce to near-zero.

The CTA remains static and confident.

---

# 16. Navigation Visual System

## 16.1 Desktop

Height target:

```text
68–76px
```

Logo left.

Primary anchors around the center-left or center.

Primary CTA right.

Language switch is secondary, compact, and visually quiet.

Suggested Chinese navigation:

```text
理念    怎么工作    关于

中文 / English

进入 Daymark
```

The navigation should not contain a long product category menu.

## 16.2 Scroll state

Before scrolling:

- very low visual weight
- may visually merge with the canvas

After scrolling:

- slightly more opaque surface
- subtle blur
- subtle bottom line only if needed

The navbar should never become a dark floating toolbar.

## 16.3 Mobile

Structure:

```text
logo                   menu
```

The primary CTA should appear inside the menu and may optionally remain as a small action in the top bar if readability remains excellent.

Menu opens as a quiet full-height or large bottom sheet style surface.

---

# 17. Motion System

## 17.1 Motion hierarchy

### Level 1 — Interface

```text
120–180ms
```

Use for:

- hover
- focus
- button state
- icon response

### Level 2 — Component

```text
180–360ms
```

Use for:

- panels
- surface transitions
- local state changes

### Level 3 — Narrative

```text
600–1200ms
```

Use for:

- product state transformations
- scene transitions
- item projection changes

### Level 4 — Atmosphere

```text
3–12s
```

Use for:

- ambient light drift
- extremely low-amplitude background movement

Atmospheric animation must never be required to understand content.

## 17.2 Easing direction

Default preference:

- ease-out for entrances
- ease-in-out for state changes
- spring only when motion benefits from physical settling

Spring should be subtle.

Avoid:

- rubber-band overshoot
- exaggerated bounce
- scale above 1.03 for ordinary interface states

## 17.3 Transform budget

For ordinary UI:

```text
translate: usually ≤ 16px
scale: usually 0.98–1.02
rotation: usually 0°
```

For large environmental scenes, larger movement is allowed only when it is part of scroll composition and does not move critical product information unexpectedly.

---

# 18. Scroll Architecture

## 18.1 Scroll is the primary cinematic controller

The website should rely on scroll to reveal meaning.

Not:

```text
automatic slideshow
```

But:

```text
user decides pace
↓
page responds
```

## 18.2 Three scroll distances

### Short

One viewport or less.

Use for:

- text reveal
- small explanatory sections

### Medium

1–1.5 viewport heights.

Use for:

- capture
- context

### Long / Pinned

1.5–3 viewport heights worth of scroll.

Use only for:

- One Item / Many Views
- Offline / Sync

Do not turn every section into a sticky cinematic sequence.

## 18.3 Scroll cancellation / interruption

When the user scrolls quickly:

- content should not become trapped in a slow animation
- the page should resolve to a sensible state
- pinned scenes should have clear progress

The site should feel responsive to the user's reading speed.

---

# 19. Interactive Demonstration Rules

## 19.1 Public website demos are simulations

All interactive product showcases operate on local demo data.

They must never touch production customer data.

## 19.2 Demo state should be deterministic

Refresh should return to a known starting state.

No randomness that changes the story between visitors.

## 19.3 User interaction is optional

A visitor should understand the product if they only scroll.

Interaction should enrich understanding, not become a gate.

## 19.4 Every demo needs an inert fallback

When JavaScript, reduced motion, low-power mode, or accessibility settings prevent animation:

- the important content remains visible
- the final state is available as static composition
- the page remains semantically understandable

---

# 20. Product Showcase Component Family

The website should build a small internal visual component library.

Recommended primitives:

```text
ProductSurface
ProductWindow
ItemRow
CourseChip
DateLabel
ReminderSurface
CaptureField
ContextAnnotation
DeviceFrame
SyncState
SceneCaption
```

These components do not need to be shared with `apps/web` in V1.

Their purpose is to make the website's product visualizations consistent and easy to tune.

## 20.1 Showcase component rule

Whenever possible, use the same:

- typography
- colors
- terminology
- icon geometry
- information hierarchy

as the actual app.

The website may simplify density, but it may not invent behavior.

---

# 21. Iconography

Use the product's existing icon family wherever practical.

Rules:

- thin-to-medium stroke
- rounded visual endpoints where existing product icons use them
- no ornamental icon packs
- no emoji as interface iconography
- no gradient icons
- no 3D icon renders

Icons are supporting objects, never the primary visual spectacle.

---

# 22. Texture and Background Art Direction

The page may use a very subtle environmental texture.

Acceptable:

- near-invisible grain
- extremely soft radial light
- very low-frequency blur fields
- tiny differences in warm/cool beige

Not acceptable:

- visible noise overlay
- moving grain that reads as video
- dotted mesh
- technical grid
- stars
- neon gradient
- green glow around every card

The environment should feel like warm paper under changing light, not like a futuristic dashboard.

---

# 23. Image / Video Policy

## 23.1 Preferred visual source

Primary visual material:

1. real product UI
2. generated or designed product demonstration scenes
3. brand typography
4. very restrained abstract environment

## 23.2 Avoid stock photography

Do not use generic:

- students smiling at laptops
- classroom stock photos
- desks with coffee
- campus architecture
- hands typing

The product can communicate the idea more honestly than stock photography.

## 23.3 Video

Video is optional, not required.

When used:

- muted by default
- short looping sequence
- compressed
- controls available when relevant
- poster frame must carry the story without playback

---

# 24. Responsive Art Direction

## 24.1 Desktop philosophy

Desktop can exploit:

- wide negative space
- side-by-side device composition
- horizontal product transitions
- large typography
- pinned scenes

## 24.2 Tablet philosophy

Tablet is a compressed desktop composition, but with fewer simultaneously visible objects.

## 24.3 Mobile philosophy

Mobile is its own composition system.

Rules:

- typography comes first
- one focal object at a time
- no horizontal product panning
- no tiny UI screenshots
- sticky scenes become shorter or become simple in-flow sequences
- pointer-only interactions must have touch alternatives

## 24.4 Mobile scene transformations

Desktop:

```text
Item
→ Overview
→ Course
→ Calendar
```

Mobile may instead use:

```text
Item
↓
总览
↓
课程
↓
日历
```

The same conceptual transformation remains, but the physical composition changes.

---

# 25. Accessibility Motion Mode

`prefers-reduced-motion: reduce` is a first-class visual mode.

When active:

- no parallax
- no large transform
- no scroll scrubbing required for meaning
- no looping ambient movement
- transitions become opacity / instant-state changes

Pinned scenes may instead show their final state or allow manual step changes.

No essential explanation may exist only inside motion.

---

# 26. Language-Specific Layout Rules

Chinese and English are not expected to have identical line breaks.

The English site may use:

- larger line length
- fewer characters per line
- slightly different section heights

The same semantic scene must remain, but exact typography may adapt.

Do not force Chinese and English into identical grid widths purely for implementation convenience.

## 26.1 Translation principles

Chinese:

> **把课程生活里那些零散的小事，放回它该在的位置。**

English version should express the same idea naturally rather than translate word-by-word.

Never publish machine-like literal translation merely to keep geometry identical.

---

# 27. Performance Budget Direction

Visual richness must remain lightweight.

Target principles:

- no autoplay heavy hero video
- no WebGL dependency for core content
- images in modern formats where appropriate
- lazy-load below-the-fold media
- preload only genuinely critical fonts
- avoid large JS libraries unless a real interaction needs them
- use CSS for simple visual effects

The first meaningful viewport must remain responsive on normal mobile hardware.

A low-power device should lose visual flourish before it loses usability.

---

# 28. SEO / Social Surface

Chinese homepage should have:

```text
<title>拾序 Daymark｜课程与事项管理</title>
<meta name="description" ...>
```

The final copy should be refined after positioning is finalized.

English page should have its own title and description.

Required later:

- canonical URLs
- `hreflang`
- `robots.txt`
- `sitemap.xml`
- Open Graph image
- Twitter/X card metadata
- favicon / web app icon
- 404 page

The OG image should be a brand composition, not a screenshot of the browser.

---

# 29. First Prototype Scope

The first implementation prototype should include only:

```text
Hero
+
Scene 01 — Small Things
+
Scene 02 — Quick Capture
```

This prototype must answer one question:

> **“Daymark 官网的世界感是否成立？”**

Do not implement all ten sections before answering this.

## 29.1 Prototype acceptance

A visitor should be able to:

1. land on the page
2. understand the product category
3. feel the Daymark visual personality
4. scroll into the first narrative section
5. see the product itself perform an understandable action
6. use the page comfortably on mobile
7. understand the story with motion disabled

---

# 30. W2 Visual Review Questions

Before moving into implementation:

### Brand

> 如果把 Daymark Logo 拿掉，只看颜色、字体、空间和产品 UI，还能认出这是 Daymark 吗？

### Product

> 如果把文案全部删除，只看 UI 的变化，用户还能理解产品在做什么吗？

### Motion

> 每一个主要动画是否都在表达“事情变得更清楚”这一件事？

### Restraint

> 有没有任何一个效果只是因为“看起来高级”才存在？

### Chinese-first

> 中文页面是否在任何地方为了“国际感”而强行塞入英文？

### Performance

> 如果在一台普通手机上体验，这个页面是不是仍然舒服？

---

# 31. Explicit Anti-Patterns

The implementation fails the direction if it uses a combination resembling any of the following:

```text
黑色背景
+
荧光绿色
+
3D 球体
+
粒子
+
AI 大脑
+
渐变光晕
```

or:

```text
米白背景
+
12 个 SaaS 卡片
+
每个卡片 hover 上浮
+
“AI-powered” 徽章
+
截图矩阵
```

or:

```text
巨型视频
+
自动播放
+
强 parallax
+
不断漂移的 UI
```

These may all be technically impressive, but they are visually wrong for Daymark.

---

# 32. W2 Design Principle in One Sentence

> **让网页像拾序本身一样：不替你制造更多信息，只把已经存在的东西，放到更合适的位置。**

That sentence should influence layout, motion, typography, interaction, copy, and technical choices.

---

# 33. W2 Acceptance Gate

W2 is PASS when all of the following are true:

- [ ] Chinese is the default site language.
- [ ] English is a full alternate site, not visible bilingual duplication.
- [ ] `/` and `/en/` are the planned canonical language surfaces.
- [ ] Daymark's existing palette remains the visual DNA.
- [ ] Website environment adds only light/material/editorial extensions.
- [ ] Hero composition is concrete enough to prototype.
- [ ] Product UI is the primary visual material.
- [ ] Quick Capture is the first major interactive scene.
- [ ] One Item / Many Views is the main narrative centerpiece.
- [ ] Reminder, AI, and Sync are represented truthfully.
- [ ] Motion levels and transform limits are documented.
- [ ] Reduced-motion behavior is defined.
- [ ] Mobile is treated as a separate composition system.
- [ ] Stock photography and generic AI visual motifs are prohibited.
- [ ] First implementation scope is limited to Hero + Scene 01 + Scene 02.
- [ ] A prototype review is required before building the full homepage.

---

# 34. Next Stage — W3 Prototype Specification

W3 should stop discussing the website in broad terms and specify the first playable experience.

W3 deliverables:

1. Hero pixel/relative geometry.
2. Actual Chinese homepage copy draft.
3. Desktop 1440px scene composition.
4. Mobile 390px scene composition.
5. Hero product showcase wireframe.
6. Scene 01 fragment layout coordinates / grid behavior.
7. Quick Capture interaction state machine.
8. Exact motion timeline / scroll progress mapping.
9. Navigation + language switch interaction.
10. Demo dataset.
11. Initial component inventory.
12. Prototype implementation brief for the coding agent.
13. Visual QA checklist for first local run.

W3 is the point where the design moves from **direction** to **buildable scene specification**.
