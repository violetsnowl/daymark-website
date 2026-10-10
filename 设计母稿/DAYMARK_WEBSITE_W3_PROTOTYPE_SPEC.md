# Daymark Website — W3 Prototype Specification

**Project:** Daymark / 拾序  
**Stage:** W3 — Prototype Specification  
**Version:** 0.1  
**Status:** Buildable prototype master  
**Domain target:** `daymark.top`  
**Default language:** 简体中文（CN）  
**Alternate language:** English（EN）  
**Prototype scope:** Hero + Scene 01 + Scene 02 + Global Navigation / Language Switch  

---

# 0. W3 Purpose

W0 defined the website as a brand/product space.  
W1 defined the narrative.  
W2 defined the visual and motion direction.

W3 now defines the first **buildable experience**.

The objective is not to finish the full website. The objective is to create the smallest complete slice that can answer:

> **Daymark 的官网世界感是否真正成立？**

The prototype must be close enough to production intent that visual decisions made here can survive into the rest of the website.

Prototype scope:

```text
Global Navigation
        ↓
Hero
        ↓
Scene 01 — 真正容易忘记的，往往不是大事。
        ↓
Scene 02 — 先记下来。
```

The prototype must include:

- desktop composition
- tablet-safe behavior
- mobile composition
- Chinese default experience
- full English alternate route scaffold
- language switch
- real-looking Daymark product showcase
- local-only interactive demo
- scroll-driven narrative motion
- reduced-motion fallback
- semantic content / SEO skeleton

---

# 1. W3 Design Lock

## 1.1 Core product statement

Primary Chinese positioning:

> **把课程生活里那些零散的小事，放回它该在的位置。**

Secondary Chinese explanation:

> **拾序是一个为大学生设计的课程与事项管理工具。想到就记，让课程、时间和提醒各归其位。**

Primary CTA:

> **开始使用**

Secondary CTA:

> **看看它怎么工作**

No English tagline is displayed on the Chinese homepage.

---

# 2. Language System — W3 Hard Requirement

## 2.1 Route model

Chinese:

```text
https://daymark.top/
```

English:

```text
https://daymark.top/en/
```

## 2.2 Chinese page rule

The following must be Chinese on `/`:

- navigation labels
- hero headline
- hero paragraph
- CTA
- section heading
- demo labels
- interaction feedback
- accessibility labels where user-visible
- footer navigation
- legal / product utility links

Allowed English only for unavoidable proper names and service names:

- Daymark
- GitHub
- Google
- other external brand names

## 2.3 Language switch

Desktop compact control:

```text
中文 / English
```

The control is a mode switch, not a pair of decorative labels.

Clicking `English` navigates to `/en/`.

Clicking `中文` navigates to `/`.

Do not translate content live in-place while preserving the exact current scroll state in V1.

Recommended behavior:

1. preserve the current broad page destination when practical
2. navigate to the equivalent section on the other language route
3. do not produce visible bilingual duplication

## 2.4 Persistence

If the user explicitly changes language, persist the choice locally for future visits.

Do not force language based only on browser locale.

`/` remains the canonical Chinese entry point.

## 2.5 English site

The prototype does not need full English copy for every below-the-fold section yet, but the routing and content model must be prepared for a complete independent English page.

The implementation should make language data content-driven rather than hard-coded sentence-by-sentence inside visual components.

---

# 3. Prototype Technical Boundary

## 3.1 Recommended stack

```text
React
TypeScript
Vite
CSS
Motion for React
```

Use native browser APIs and CSS for simple effects.

Do not introduce a rendering framework solely for visual novelty.

## 3.2 Animation library policy

Use Motion for:

- entrance / exit
- small interactive states
- gesture response
- local layout transitions
- scroll-linked values where sufficient

Do not add GSAP in the prototype unless Motion cannot reliably express a required pinned scene.

GSAP may be introduced later for complex multi-stage scroll scenes, but W3 should intentionally remain light.

## 3.3 No WebGL in W3

No Three.js / React Three Fiber / custom shaders in prototype.

The environment must already feel premium without them.

## 3.4 No public product API calls

The showcase is entirely local and deterministic.

No:

- production API request
- real user account
- database read/write
- analytics-driven state
- external LLM request during showcase

---

# 4. Prototype Page Skeleton

The initial implementation tree should conceptually resemble:

```text
src/
  app/
    App.tsx
    routes.tsx
  content/
    cn.ts
    en.ts
    demo.ts
  components/
    site/
      SiteNav.tsx
      LanguageSwitch.tsx
      PrimaryButton.tsx
    product/
      ProductSurface.tsx
      ProductHeader.tsx
      ItemRow.tsx
      CaptureField.tsx
      ContextChip.tsx
      DemoStatus.tsx
    scene/
      HeroScene.tsx
      SmallThingsScene.tsx
      CaptureScene.tsx
  motion/
    tokens.ts
    reducedMotion.ts
    scroll.ts
  styles/
    tokens.css
    global.css
```

Names are illustrative. The important requirement is separation between:

- content
- website shell
- product showcase components
- motion logic
- scene composition

Do not create one monolithic page component containing all states.

---

# 5. Global Prototype Geometry

## 5.1 Viewport reference sizes

Primary desktop design reference:

```text
1440 × 900
```

Secondary desktop validation:

```text
1280 × 800
1728 × 1117
```

Primary mobile design reference:

```text
390 × 844
```

Secondary mobile validation:

```text
375 × 812
430 × 932
```

Tablet validation:

```text
768 × 1024
1024 × 1366
```

## 5.2 Container

Desktop content container:

```css
max-width: 1360px;
margin-inline: auto;
padding-inline: clamp(24px, 4vw, 64px);
```

The hero may use the full viewport as an environment while the text and product surface remain aligned to the container.

## 5.3 Hero minimum height

Desktop:

```text
min-height: 88–96svh
```

Mobile:

```text
min-height: auto
```

Mobile must not force an oversized hero merely to imitate the desktop cinematic composition.

---

# 6. Global Navigation — Buildable Spec

## 6.1 Desktop composition

Approximate height:

```text
72px
```

Grid:

```text
Logo                links             language       CTA
```

Suggested exact labels:

```text
拾序 / Daymark

理念     怎么工作     关于

中文 / English

[ 进入 Daymark ]
```

The center navigation can be slightly denser or moved toward the left-middle depending on final optical balance. Do not center the navigation mathematically if it makes the overall composition feel unstable.

## 6.2 Logo treatment

Use the current approved Daymark / 拾序 brand mark.

The logo is a calm identifier, not a hero headline.

Approximate target:

```text
logo height: 24–28px
```

If the logo asset exists in a raster form, obtain a vector/transparent production asset before final release.

## 6.3 Navigation surface

At top:

```text
background: transparent / canvas blend
```

After scrolling approximately 48–80px:

```text
background: low-opacity surface
backdrop-filter: subtle blur
border-bottom: 1px warm line only when needed
```

Do not turn the navigation into a dark toolbar.

## 6.4 CTA

Primary CTA label:

> **进入 Daymark**

Destination:

```text
https://app.daymark.top
```

For local development, allow a configurable URL.

The CTA should use the same semantic dark-green family as the product's primary action.

## 6.5 Mobile navigation

Top row:

```text
拾序 / Daymark                        菜单
```

Height:

```text
60–68px
```

Opening the menu should reveal a quiet surface containing:

```text
理念
怎么工作
关于

中文 / English

[ 进入 Daymark ]
```

The menu is a functional overlay, not a full-screen animated spectacle.

---

# 7. Hero — Buildable Desktop Spec

## 7.1 Hero hierarchy

The desktop hero contains four layers:

```text
Layer 0  Canvas / environmental light
Layer 1  Navigation
Layer 2  Editorial copy
Layer 3  Product surface
```

No additional decorative hero illustration is required.

## 7.2 Copy block

Approximate placement:

```text
left edge = content container
width     = 48–54% of inner container
vertical  = 36–44% viewport height
```

Headline:

> **把课程生活里那些零散的小事，放回它该在的位置。**

Do not manually insert line breaks in content data.

Use layout constraints to allow optical line wrapping.

However, desktop prototype should aim for a composition visually close to:

```text
把课程生活里那些
零散的小事，
放回它该在的位置。
```

The implementation may use soft line-break opportunities or a controlled max-width rather than hard-coded `<br>` elements where possible.

## 7.3 Headline

Target:

```text
font-size: clamp(60px, 6.0vw, 92px)
line-height: 1.06–1.12
font-weight: 400–500 depending on chosen serif
```

The title must not be bolded into a startup-marketing aesthetic.

## 7.4 Supporting paragraph

Text:

> **拾序是一个为大学生设计的课程与事项管理工具。想到就记，让课程、时间和提醒各归其位。**

Target width:

```text
420–560px
```

Target size:

```text
18–20px
```

## 7.5 Hero CTA group

Primary:

> **开始使用**

Secondary:

> **看看它怎么工作 ↓**

Button geometry:

```text
height: 46–52px
padding-inline: 20–24px
radius: 12px
```

Primary button uses dark green.

Secondary button is visually quiet; it should not compete with the primary CTA.

## 7.6 Hero product surface

Approximate desktop size:

```text
width: 620–760px
height: 420–520px
```

Position:

```text
right side / lower half
```

It may extend slightly beyond the container's visual column but must not be clipped in a way that hides meaningful UI.

## 7.7 Product surface visual

The product showcase should visually resemble a refined Daymark application window.

Suggested visible content:

```text
Daymark

今天

保险经济学
周五交 PPT

数理统计
明天带电脑

AI 职业与保险
阅读第 4 章
```

Optional low-priority background items can remain partially visible but should not create dashboard density.

## 7.8 Hero product surface rules

Use:

- `#FAF8F3` surface
- 1px warm border
- radius approximately 18px
- restrained shadow
- no glass effect on the main product surface

The product surface is more opaque than the environment.

## 7.9 Hero environmental light

Use one broad radial light field behind the product surface.

Suggested visual family:

```text
accent green
very low opacity
large blur radius
```

The light should be perceived before it is consciously noticed.

Do not place green glow behind every object.

---

# 8. Hero — Initial Motion Timeline

Total initial load choreography target:

```text
0ms      page visible / no blocking loader
80ms     nav becomes clear
140ms    hero headline begins
260ms    supporting copy becomes clear
360ms    CTA becomes clear
460ms    product surface begins entry
620ms    product surface reaches rest
```

Actual implementation should respect user/device performance. Do not delay interaction to complete a theatrical intro.

## 8.1 Headline entrance

```text
opacity: 0 → 1
translateY: 12px → 0
```

Duration:

```text
500–700ms
```

## 8.2 Product entrance

```text
opacity: 0 → 1
translateY: 16px → 0
scale: 0.985 → 1
```

Duration:

```text
650–850ms
```

Avoid spring bounce for this entrance.

## 8.3 Pointer response

Desktop only.

Product surface response:

```text
max translate: 2–4px
max rotation: 1–2°
```

Environment light:

```text
max translate: 10–18px
```

Use pointer position smoothing so the response feels atmospheric rather than mechanical.

## 8.4 CTA hover

Primary CTA:

- background becomes slightly deeper
- text remains stable
- translateY at most 1–2px
- no large scale

Secondary CTA:

- text emphasis / opacity change
- arrow moves 2–4px at most

---

# 9. Hero — Scroll Transition

The first scroll is treated as a camera move into the next chapter.

## 9.1 Scroll progress window

Use the first approximately:

```text
0.0 → 0.85 viewport worth of scroll
```

for the primary hero transition.

Do not require a long 3–4 viewport sticky hero for W3.

## 9.2 Hero transition stages

### 0.00–0.25

Hero is dominant.

Product surface begins to move upward slightly.

### 0.25–0.55

Hero copy loses opacity slightly.

Product surface moves toward the visual center.

### 0.55–0.75

Scene 01 text fragments begin entering the environment.

### 0.75–0.85

Hero copy reaches near-zero attention priority.

Product surface is visually quieter.

Scene 01 becomes primary.

No hard crossfade to white/black.

---

# 10. Scene 01 — Buildable Spec

## 10.1 Section statement

Headline:

> **真正容易忘记的，往往不是大事。**

Supporting copy:

> **“周五交 PPT。” “明天记得带电脑。” “老师说看第五章。” 这些事情都不大，却散落在课程、聊天、脑子和日历之间。**

The final production wording may be refined after visual proofing, but the semantic structure is locked.

## 10.2 Layout

Desktop:

```text
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                         [fragment]                          │
│                                                            │
│      [fragment]                 [fragment]                  │
│                                                            │
│                       HEADLINE                             │
│                                                            │
│   [fragment]                          [fragment]            │
│                                                            │
│                [fragment]                                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

Do not literally center every fragment around the heading. The composition should have editorial imbalance.

## 10.3 Fragment dataset

Initial deterministic set:

```text
周五交 PPT
明天带电脑
老师说看第五章
下周再交
这件事属于哪门课？
```

Optional seventh fragment:

```text
记得买计算器电池
```

But keep the first prototype to 5–6 fragments.

## 10.4 Typography of fragments

Use the same main sans / serif family as the product ecosystem, but vary:

- size
- opacity
- alignment
- placement

Avoid handwritten fonts.

## 10.5 Initial fragment state

Fragments are already visible when the section becomes primary.

Each fragment may have a tiny positional offset within a 6–14px range.

No continuous wandering.

## 10.6 Scroll alignment behavior

As scroll progresses through Scene 01:

- fragments move gradually toward an invisible vertical / editorial axis
- opacity normalizes slightly
- two fragments can visually “find” each other
- one fragment fades before the final state

The desired conceptual movement is:

```text
散落
  ↓
看得见彼此
  ↓
开始归拢
```

## 10.7 Section final state

At the end of Scene 01, the fragments should no longer feel like separate floating objects.

They visually suggest:

```text
一句话
   ↓
一个入口
```

This is the bridge into Quick Capture.

---

# 11. Scene 01 Scroll Mapping

Recommended scroll duration:

```text
1.0–1.25 viewport heights
```

Progress map:

```text
0.00–0.20   settle / introduction
0.20–0.45   fragments move toward shared alignment
0.45–0.70   hierarchy compresses
0.70–0.90   fragments resolve toward capture concept
0.90–1.00   handoff to Scene 02
```

Use scroll-linked values rather than multiple independent trigger callbacks.

This reduces jitter and makes rapid scrolling predictable.

---

# 12. Scene 02 — Quick Capture

## 12.1 Role

Quick Capture is the first unmistakable “product moment”.

The visitor should understand the concept even without reading every caption.

## 12.2 Section statement

Headline:

> **先记下来。**

Supporting line:

> **不要为了记录一件事，先想好它应该属于什么。**

Secondary sentence / caption:

> **记录，不应该是另一件需要管理的事。**

## 12.3 Composition

Desktop:

```text
                 先记下来。

        不要为了记录一件事，
        先想好它应该属于什么。

         ┌─────────────────────────┐
         │ 周五交保险经济学 PPT    │
         │                     ↵   │
         └─────────────────────────┘

                  已记录 ✓

      保险经济学   ·   周五   ·   PPT
```

The input surface is the focal object.

## 12.4 Capture surface dimensions

Desktop:

```text
width: 680–820px
min-height: 84px
```

Mobile:

```text
width: 100%
min-height: 76px
```

## 12.5 Input visual style

Use a near-white surface with:

- warm border
- large but not excessive radius
- subtle inset / elevation
- generous horizontal padding

The surface should look like a product control, not a messaging app.

## 12.6 Demo interaction mode

The prototype supports a local demo state machine.

States:

```text
EMPTY
  ↓
TYPING
  ↓
CAPTURED
  ↓
STRUCTURING
  ↓
STRUCTURED
  ↓
RESET
```

No real AI call is made.

## 12.7 State EMPTY

Placeholder:

> **记下一件事……**

The placeholder is muted and unobtrusive.

## 12.8 State TYPING

The visitor may type.

Recommended interaction behavior:

- no live backend validation
- no autocomplete
- normal caret
- submit with Enter only when non-empty

For touch devices, a visible demo action may be provided:

> **记录**

## 12.9 State CAPTURED

Immediately after submit:

Text remains visible.

A small state label appears:

> **已记录**

This happens before structured interpretation.

The visual implication is:

> recording succeeded first.

## 12.10 State STRUCTURING

After a short delay:

```text
课程      保险经济学
时间      周五
内容      PPT
```

A tiny state label may say:

> **正在整理**

Duration target:

```text
350–650ms
```

Do not fake a long “AI thinking” animation.

## 12.11 State STRUCTURED

Final state:

```text
保险经济学
周五交 PPT

周五
```

The interface should visually “settle”.

Optional caption:

> **课程、时间和事项，各归其位。**

## 12.12 Reset

Quiet text action:

> **重新试一次**

Reset returns immediately to EMPTY.

No loading transition required.

---

# 13. Quick Capture Demo Data

## 13.1 Default input

```text
周五交保险经济学 PPT
```

## 13.2 Deterministic structured output

```text
课程：保险经济学
时间：周五
内容：PPT
```

## 13.3 Optional secondary examples

A small preset list may be introduced only after the main demo is stable:

```text
明天数理统计记得带电脑
AI 职业与保险下周看第四章
```

But only one demo should auto-play at a time.

## 13.4 Truthfulness rule

The website may simplify parsing into a visual story, but must never imply that every natural-language input always resolves perfectly.

The real product prioritizes deterministic parsing, preserves raw capture, and uses AI / confirmation only when needed. The website should remain consistent with that behavior.

---

# 14. Quick Capture Motion Timeline

Target sequence after user submits:

```text
0ms
submit

0–120ms
input settles

120–260ms
“已记录” appears

300–520ms
structured metadata begins

520–760ms
course / time / content settle

760–900ms
final calm state
```

For automatic showcase playback, the entire sequence may run in approximately 1.8–2.4 seconds.

For real user interaction, use a slightly shorter and more responsive version.

## 14.1 Important visual rule

The item itself remains spatially stable.

Metadata moves into place around it.

Do not make the item fly or spin.

---

# 15. Hero + Scene 01 + Scene 02 Continuous Story

These three scenes must feel like one uninterrupted sentence.

## Stage A

Hero says:

> **这些事情值得有一个位置。**

## Stage B

Scene 01 says:

> **因为它们真的很容易散掉。**

## Stage C

Scene 02 says:

> **所以第一步，不是整理。是先记下来。**

This logical chain must remain visible even when motion is disabled.

---

# 16. Mobile Hero — 390px Reference

## 16.1 Composition

Mobile order:

```text
nav
↓
hero headline
↓
hero supporting copy
↓
CTA
↓
product surface
```

The product surface must not sit beside the headline.

## 16.2 Hero title

Target size:

```text
44–56px
```

Target line length:

```text
approximately 5–8 Chinese characters per visual line
```

Possible visual wrapping:

```text
把课程生活里那些
零散的小事，
放回它该在的位置。
```

Do not force the exact line breaks if the chosen font produces a better optical composition.

## 16.3 Product surface

Width:

```text
calc(100vw - 40px)
```

Maximum width:

```text
none on mobile
```

Height should be determined by content rather than forcing the desktop aspect ratio.

## 16.4 Mobile pointer effects

No pointer parallax.

Use:

- press feedback
- short opacity response
- small translation only where semantic

---

# 17. Mobile Scene 01

The fragment field becomes a more vertically composed list.

Example:

```text
周五交 PPT

明天带电脑

老师说看第五章

下周再交
```

The fragments can enter at different vertical positions, but should remain readable.

Do not place text near the viewport edge where mobile browser UI may obstruct it.

The alignment sequence can be simplified:

```text
散落文本
↓
纵向靠拢
↓
形成一个视觉入口
```

No sticky desktop-style field is required if it harms mobile reading.

---

# 18. Mobile Scene 02

The input field becomes the dominant object.

Structure:

```text
先记下来。

不要为了记录一件事，
先想好它应该属于什么。

[ 输入框                    ]

[ 记录 ]

已记录

保险经济学 · 周五 · PPT
```

The demo should still be usable with one thumb.

---

# 19. Responsive Breakpoint Philosophy

Do not optimize around one device width only.

Suggested behavior boundaries:

```text
≥ 1200      desktop art direction
768–1199    tablet adaptation
< 768       mobile art direction
```

Within those bands, use fluid sizing with `clamp`, grid, flex, and intrinsic content sizing.

Avoid brittle breakpoint stacks such as:

```text
412px
414px
428px
430px
```

unless a true browser behavior requires it.

---

# 20. Content Data Model

The prototype must keep copy separate from scene structure.

Suggested content shape:

```ts
interface SiteCopy {
  nav: {
    ideas: string;
    workflow: string;
    about: string;
    enter: string;
    language: string;
  };
  hero: {
    title: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
  };
  smallThings: {
    title: string;
    description: string;
    fragments: string[];
  };
  capture: {
    title: string;
    description: string;
    placeholder: string;
    reset: string;
    recorded: string;
    structuring: string;
    done: string;
  };
}
```

This is an illustrative contract, not required to be copied literally.

The key principle is:

> **language changes content, not component architecture.**

---

# 21. Accessibility Requirements for Prototype

## 21.1 Semantic hierarchy

One `h1` only.

Suggested:

```text
h1 Hero
h2 Scene 01
h2 Scene 02
```

## 21.2 Keyboard

All interactive controls must be keyboard reachable.

Quick Capture must be usable without a pointer.

## 21.3 Focus

Visible focus state must use the same visual language as the product.

Do not remove browser focus outlines without replacing them with a clearly visible equivalent.

## 21.4 Reduced motion

When:

```css
@media (prefers-reduced-motion: reduce)
```

then:

- no pointer parallax
- no fragment drift
- no scroll-linked transform required for meaning
- no long intro choreography
- capture state changes happen directly or with minimal opacity

The complete readable final state must always exist in the DOM / accessible tree.

---

# 22. Performance Requirements

W3 is successful only if visual quality survives on an ordinary laptop and mobile device.

## 22.1 Core rules

- no hero video
- no WebGL
- no large background bitmap
- no huge unoptimized PNG screenshots
- no runtime generation of unnecessary visual noise
- no blocking animation before interaction

## 22.2 Product surfaces

Prefer HTML/CSS product showcase components over screenshot images where practical.

Advantages:

- crisp at every density
- responsive
- animatable
- accessible
- easy to update when the product UI changes

A static image may be used for comparison / backup, but not as the only implementation route.

## 22.3 Media

Any raster asset used in W3 should have a production-format decision:

```text
AVIF / WebP / SVG where appropriate
```

Do not ship design-export artifacts at arbitrary 5–20MB sizes.

---

# 23. SEO / Social Skeleton

Chinese prototype metadata:

```text
Title:
拾序 Daymark｜课程与事项管理
```

Description direction:

> **把课程生活里零散的小事，放回它该在的位置。拾序是一款为大学生设计的课程与事项管理工具。**

English route gets its own metadata.

Required in implementation scaffold:

- canonical
- language alternate links
- robots
- sitemap-ready route structure
- favicon
- OG title
- OG description
- OG image placeholder
- 404 route

The SEO copy may be refined later, but the infrastructure should not need architectural changes.

---

# 24. Demo Surface Data and Privacy

The following values are fictional and safe for public display:

```text
课程：保险经济学
课程：数理统计
课程：AI 职业与保险
事项：周五交 PPT
事项：明天带电脑
事项：阅读第 4 章
```

Never display:

- personal email
- personal account ID
- real student schedule pulled from production
- real API response tokens
- real reminder IDs
- private GitHub information
- real internal server hostnames

---

# 25. Agent Implementation Brief

## 25.1 Agent role

The coding agent is an implementer, not a visual director.

The agent may:

- choose exact CSS mechanics
- refactor component structure
- optimize rendering
- fix responsiveness
- improve accessibility
- select implementation details within the approved direction

The agent may not independently change:

- brand palette
- typography direction
- homepage narrative order
- Chinese-first language model
- hero headline
- product truthfulness
- motion philosophy
- use of WebGL / flashy effects

without explicit design review.

## 25.2 Implementation priority

```text
1. semantic structure
2. visual fidelity
3. responsive composition
4. interaction
5. animation
6. optimization
```

Not:

```text
animation first
```

## 25.3 Agent acceptance command

The implementation brief should instruct the agent to locally verify at minimum:

```text
1440×900
1280×800
390×844
768×1024
```

and test:

```text
Chrome
keyboard only
prefers-reduced-motion
mobile touch
```

---

# 26. Visual QA Checklist — Prototype

## Brand

- [ ] The page immediately looks like Daymark, not a generic SaaS template.
- [ ] The beige canvas remains continuous.
- [ ] Green is an accent, not a glow theme.
- [ ] Serif display typography feels editorial, not ceremonial.
- [ ] Product surfaces feel calm and materially grounded.

## Hero

- [ ] The category is understandable within the first viewport.
- [ ] Chinese headline dominates.
- [ ] No English tagline appears on the Chinese page.
- [ ] Product surface is legible.
- [ ] CTA hierarchy is obvious.

## Scene 01

- [ ] Scattered phrases are recognizable as everyday student details.
- [ ] Motion gradually communicates gathering / ordering.
- [ ] No particle-like wandering occurs.

## Scene 02

- [ ] Visitor understands “record first” without reading documentation.
- [ ] `已记录` precedes structured interpretation.
- [ ] Demo never touches production data.
- [ ] The interaction is usable with keyboard and touch.

## Language

- [ ] `/` is Chinese.
- [ ] `/en/` exists as a route scaffold.
- [ ] Switching language does not create bilingual mixed copy.
- [ ] User-selected language can persist.

## Motion

- [ ] Reduced-motion mode preserves meaning.
- [ ] Fast scrolling does not trap the user.
- [ ] Motion never causes critical text to disappear.

## Performance

- [ ] Hero loads without a heavy blocking asset.
- [ ] No WebGL dependency exists.
- [ ] Product surface remains responsive on mobile.

---

# 27. W3 Review Questions

After the first local prototype is rendered, review it in this order:

### Question 1 — Identity

> 不看 Logo，能不能感觉“这是拾序”？

### Question 2 — Product

> 不读第二段文案，用户能不能理解它是在管理课程与事项？

### Question 3 — Emotional tone

> 页面让人觉得“舒服、可靠、想继续看”，还是“这个网站技术真多”？

The latter is a failure.

### Question 4 — Motion

> 如果把所有 transform 关掉，只剩静态画面，设计是否依然成立？

### Question 5 — Language

> 中文是不是毫无压力地成为第一语言？

### Question 6 — Product truth

> 这个页面有没有暗示一个 Daymark 实际上不存在的能力？

### Question 7 — Mobile

> 390px 宽度下，首页是不是仍然像同一个产品，而不是桌面版的残片？

---

# 28. W3 Prototype Acceptance Gate

W3 is PASS only when all are true:

- [ ] Hero + Scene 01 + Scene 02 form one uninterrupted narrative.
- [ ] Chinese is the complete default experience.
- [ ] English route scaffold exists and can be switched to globally.
- [ ] Hero copy and layout are stable enough to use as a brand baseline.
- [ ] A real-looking Daymark product surface is present.
- [ ] Scene 01 uses designed, not random, text fragments.
- [ ] Quick Capture demo is fully local and deterministic.
- [ ] The sequence `记录 → 理解 → 归位` is visually understandable.
- [ ] The prototype is usable without motion.
- [ ] Mobile is a designed composition, not a desktop fallback.
- [ ] No WebGL / heavy hero video / decorative tech stack is required.
- [ ] Performance is acceptable on ordinary mobile hardware.
- [ ] The coding agent has a constrained implementation brief.

---

# 29. W4 Preparation

Once W3 is visually validated, the project should proceed to **W4 — Full Homepage Scene Specification**.

W4 deliverables:

1. Scene 03 — Context
2. Scene 04 — One Item, Many Views
3. Scene 05 — Reminder
4. Scene 06 — AI, Quietly
5. Scene 07 — Offline / Sync
6. Scene 08 — A Day With Daymark
7. Scene 09 — Closing
8. Full navigation / footer architecture
9. complete Chinese copy system
10. English content system
11. desktop / tablet / mobile scene adaptations
12. production SEO / Open Graph content
13. complete website component inventory
14. full animation / scroll dependency map
15. deployment-ready implementation brief

W4 begins only after the W3 prototype has been rendered and reviewed visually.

---

# 30. W3 Design Principle in One Sentence

> **先让人看懂，再让人发现它漂亮；先让产品自己说话，再让动效替它补充语气。**

This sentence is the final guardrail for the prototype.
