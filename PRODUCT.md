# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

大学生（中文用户优先）。他们的课程生活里散落着大量「不大但容易忘」的小事：交第二次作业、明天带电脑、老师说看第五章……散落在课程、聊天、脑子和日历之间。官网的英文页面服务英文读者，是同一品牌的完整第二语言体验，不是翻译层。

## Product Purpose

daymark.top 的品牌官网（Editorial Product Website / 编辑式产品官网）：不是罗列功能的产品介绍页，而是把 Daymark 的产品理念翻译成一次连续的下滚叙事，让完全陌生的访客在 30–90 秒内理解：它是什么、为什么和普通待办应用不一样、为什么值得打开。主 CTA「开始使用」落点为站内下载页 `/download/`（三平台选择页）；网页版入口由下载页卡片承担（`app.daymark.top`，新标签页打开）。

## Positioning

官网叙事必须基于产品真实机制：
- 本地优先——离线照常记录，联网后安静同步；
- 先记录、后归位——Quick Capture 先保留原始输入，再做确定性解析；只有存在歧义时才用 AI，且优先让用户确认，不让 AI 替用户决定；
- 「Item」是统一的可操作事项身份——总览/课程/日历不是三份数据，而是同一批事项的三次投影；
- 提醒是事项的时间化提醒，不是另一种 Item 状态；
- 产品明确不做：学习规划、优先级体系、标签树、课程表替代品、AI 教练。

## Operating Context

- 访客在自己浏览器里走完整页叙事；所有产品界面示意都是 HTML/CSS 组件本地演示：不请求生产 API、不读登录态、不写库、不调用真实模型，刷新后故事完全一致。
- 首页十节连续叙事（Hero → 小事 → 先记下来 → 上下文 → 换一个位置看 → 提醒 → AI → 离线同步 → 一天 → 落地）+ 完整 Footer。
- 中文 `/` 为唯一默认入口（canonical）；`/en/` 为完整英文版。语言是真实跳转（不同屏双语），选择写入 localStorage。
- 全站唯一演示案例：高等数学 · 周五交第二次作业 · 周五 · 23:59。

## Capabilities and Constraints

- 纯静态前端（Vite + React + TypeScript）；站点自身不调用生产 API、不引入真实 AI、不写库、不暴露密钥。
- 硬约束：页面不得出现任何具体日期（统一「周五 · 23:59」）；不出现任何指标数字（完成率/连续天数/节省时间等）；不虚构产品能力。
- prefers-reduced-motion 是一等模式：必须有完整静态替代，不是「动画变快」。
- 无水平滚动；每个动画必须有语义。
- 明确的未决事项（不得当作已达成）：正式品牌资产（favicon 为按标记几何重绘的矢量版；Logo 沿用产品既有标记）；英文文案 V2 语言润色；<1024px tablet motion 矩阵（整页验收已完成，等排期）。
- 当前状态（2026-10-13 更新）：十节 + Footer 实现完毕；自动化 124/124、单元测试 20/20；官网已上线 `daymark.top`（含下载页 `/download/` 与网页版 `app.daymark.top`）。

## Brand Commitments

- 品牌双名：「拾序」/「Daymark」——同一品牌的双语身份，不是互译。
- 气质：Quiet / Precise / Human / Considered（安静 / 准确 / 有人感 / 有分寸）。
- 绑定视觉方向（已确认，审查阶段不重开）：米白纸感底 + 深绿强调色；编辑设计感；中文优先——中文页不出现装饰性英文（Daymark / GitHub 等专有名词除外）。
- 动效哲学：先让人看懂，再让人发现它漂亮（Static should be beautiful. Dynamic should reveal meaning.）。
- 明确禁止：蓝紫渐变、玻璃卡片墙、AI glow / 粒子 / 发光网络、装饰性 3D、夸大文案、大幅旋转 / bounce / shake / 无意义 parallax / 自动轮播 / 倒计时 / 红色警报与脉冲循环。

## Evidence on Hand

- 设计母稿 5 份（`设计母稿/`，W0–W4，优先级 W0→W4，唯一基线，只读）。
- 审计与交接：`REVIEW.md`（§0 = 当前滚动窗口参数唯一真源）、`HANDOFF.md`、`README.md`；`.review/` 验证脚本与截图工具链。
- 确定性演示数据：`src/content/demo.ts`（主 Item 唯一定义处）；内容层 `src/content/{cn,en}.ts`。
- 产品真相来源：产品仓库 https://github.com/violetsnowl/Daymark —— 官网叙事不得超出其真实能力。
- 没有真实用户见证、案例、benchmark、press——此类内容不得虚构。

## Product Principles

1. 理解先于说服，体验先于卖点，产品本身先于品牌口号。
2. 只叙述真实存在的产品能力；不为营销加戏，也不为效果打折。
3. 先让人看懂，再让人发现它漂亮——动效是语义，不是装饰。
4. 安静与克制：颜色、留白、动效都服务于「少占一点脑子」。
5. 中文优先；英文是独立撰写的第二体验，不是翻译层。

## Accessibility & Inclusion

- prefers-reduced-motion: reduce 必须有完整静态替代（一等模式）。
- 全部交互键盘可达；焦点态可见；多宽度无水平滚动（有断言看守）。
