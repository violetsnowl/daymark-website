import type { SiteCopy } from "./types.ts";
import { showcase, showcaseStrings } from "./demo.ts";

const demo = showcaseStrings.cn;

/**
 * 中文内容母稿（W4 §13）。
 *
 * 中文是官网的默认语言：导航、标题、正文、按钮、演示标签、无障碍标签全部为中文。
 * 页面上不会出现装饰性英文副标题；Daymark 作为拉丁品牌名只在品牌标识与
 * 外部服务名（GitHub）处保留。
 */
export const cn = {
  locale: "cn",
  htmlLang: "zh-CN",
  urlPrefix: "",
  skipToContent: "跳到主要内容",

  metadata: {
    title: "拾序 Daymark｜课程与事项管理",
    description:
      "把课程生活里零散的小事，放回它该在的位置。拾序是一款为大学生设计的课程与事项管理工具。",
    canonical: "https://daymark.top/",
  },

  nav: {
    brandCn: demo.brandCn,
    /* 中文页面不出现装饰性英文：DAYMARK 只是拉丁品牌标记本身。 */
    brandEn: "DAYMARK",
    homeLabel: "拾序 Daymark 首页",
    /* W4 §11.1: 「怎么工作」从工作流的起点进入 —— Capture → Context → Views。
       直接跳到最核心但更后置的 Views 会让读者从中间开始。
       顺序按页面顺序排列（2026-10-11 审查 P2-3）：理念 → 怎么工作 → 一天 → 关于。 */
    anchors: [
      { id: "ideas", label: "理念", href: "#ideas" },
      { id: "capture", label: "怎么工作", href: "#capture" },
      { id: "day", label: "一天", href: "#day" },
      { id: "about", label: "关于", href: "#about" },
    ],
    languageLabel: "语言",
    languageCn: "中文",
    languageEn: "English",
    menuOpen: "打开菜单",
    menuClose: "关闭菜单",
    enterApp: "进入 Daymark",
  },

  hero: {
    /* W3 Prototype Baseline —— Hero 只有四层：大标题 → 产品说明 → CTA → 产品界面。
       上方不再有任何 eyebrow / kicker 信息层。 */
    title: "把课程生活里那些零散的小事，放回它该在的位置。",
    description:
      "拾序是一个为大学生设计的课程与事项管理工具。想到就记，让课程、时间和提醒各归其位。",
    primaryCta: "开始使用",
    secondaryCta: "看看它怎么工作",
    product: {
      windowLabel: "拾序产品界面示意：事项总览",
    },
  },

  smallThings: {
    title: "真正容易忘记的，往往不是大事。",
    description:
      "「周五交第二次作业」「明天记得带讲义资料」「老师说看第五章」「下周再交」这些事情都不大，却散落在课程、聊天、脑子和日程之间。",
    fragments: [
      { text: showcase.cn.fragments[0], weight: 2 },
      { text: showcase.cn.fragments[1], weight: 2 },
      { text: showcase.cn.fragments[2], weight: 1, serif: true },
      { text: showcase.cn.fragments[3], weight: 0 },
    ],
    ghost: [showcase.cn.ghostFragment],
  },

  capture: {
    title: "先记下来。",
    description: "不要为了记录一件事，先想好它应该属于什么。",
    caption: "记录，不应该是另一件需要管理的事。",
    placeholder: "记下一件事……",
    inputLabel: "快速记录内容",
    submit: "记下",
    reset: "重新试一次",
    demoHint: "这是一段本机演示，不会写入任何真实数据。",
    statusAnnounce: {
      EMPTY: "等待输入",
      TYPING: "正在输入",
      CAPTURED: `已记录：${demo.captureInput}`,
      STRUCTURING: "正在整理",
      STRUCTURED: "已整理：课程、时间、内容各归其位",
      CLARIFY: "已记录，但还没有课程归属，需要你确认",
    },
    product: {
      windowLabel: "拾序产品界面示意：已整理的事项",
      pageTitle: demo.pageTitle,
      today: demo.today,
      sectionTitle: demo.sectionTitle,
      syncNote: demo.syncNote,
      moreCount: demo.moreCount,
    },
  },

  context: {
    title: "事情不该只记住“做什么”。",
    description: "它属于哪门课、什么时候发生、什么时候需要提醒，应该跟它一起存在。",
    index: "03",
    labels: {
      course: "课程",
      time: "时间",
      content: "内容",
      reminder: "提醒",
    },
    pending: "暂无",
    reminderValue: "周五 · 23:59",
    closing: "记下来的，不只是内容，还有它的上下文。",
    windowLabel: "拾序产品界面示意：一个事项与它的上下文",
  },

  views: {
    title: "同一件事，换一个位置看。",
    description: "总览、课程、日程，并不是三份数据，而是同一件事情的不同视角。",
    index: "04",
    views: {
      overview: {
        label: "总览",
        hint: "它和今天其他未完成的事情放在一起。",
        caption: "在总览里，它是今天还没做完的事情之一。",
      },
      courses: {
        label: "课程",
        hint: "它落在课程下面，和其他课程事项排在一起。",
        caption: "在课程里，它属于这门课。",
      },
      calendar: {
        label: "日程",
        hint: "它出现在它真正发生的那一天。",
        caption: "在日程里，它发生在周五。",
      },
    },
    staticSummary:
      "同一件事——高等数学 · 周五交第二次作业——在总览、课程、日程三个视角中的位置不同，但它始终是同一个事项。",
    closing: "不是复制，是换个角度看。",
    windowLabel: (view) => `拾序产品界面示意：${view}视角下的同一个事项`,
  },

  reminder: {
    index: "05",
    title: "有些事，不用一直记着。",
    description: "到了需要注意的时候，拾序会把已经记录的事情重新带回来。",
    label: "提醒",
    /* W4 §5.3 —— 时间不是倒计时。 */
    value: "周五 · 23:59",
    surface: {
      course: "高等数学",
      when: "周五 · 23:59",
      content: "第二次作业",
      note: "提醒已设置",
    },
    closing: "你可以把它暂时放下。",
    hint: "这一段的提醒同样来自本机演示。",
  },

  ai: {
    index: "06",
    title: "AI，只在需要的时候出现。",
    description:
      "不替你安排生活，也不替你做决定。只是当一件事情还不够清楚时，帮你把它弄明白一点。",
    /* 这是演示案例的修订版（评审决定）：句子缺的是"属于哪门课"，演示就只解决
       这一件事。不生成日期，不追加要求，也不改动事项本身。 */
    input: "周五交作业",
    inputLabel: "演示输入",
    question: "这件事属于哪门课？",
    answerConfirm: "高等数学",
    answerKeep: "再看看",
    resolved: "高等数学",
    resolvedLabel: "已确认课程",
    pendingNote: "课还没定，时间先按你写的「周五」留着。",
    settledNote: "课程定下来了。时间和内容都保持原样。",
    keptNote: "原样留着，等你想好再说。它不会替你选一门课。",
    reopen: "再回答一次",
    closing: "它把不够清楚的地方弄清楚，而不是替你做决定。",
    hint: "两个选项都可以点，回答只发生在你的浏览器里。",
    status: {
      asking: "有一个问题需要你确认",
      resolved: "已确认课程归属",
      kept: "保持原样",
    },
  },

  sync: {
    index: "07",
    title: "网络不在线，事情也不用等。",
    description: "离线时照常记录。联网后，再安静地同步。",
    devices: { laptop: "笔记本", phone: "手机" },
    laptop: { sectionLabel: "刚刚记录", meta: "高等数学 · 截止 周五 · 23:59" },
    phone: { emptyLabel: "还没有同步到这里", meta: "高等数学 · 截止 周五 · 23:59" },
    /* W4 §7.3 —— 状态用语，不是网络术语。 */
    states: { offline: "离线记录中", syncing: "同步中", synced: "已同步" },
    closing: "同步完成以后，连接本身就不重要了。",
    windowLabel: "两台设备上的同一件事",
  },

  day: {
    index: "08",
    title: "最后，你只是继续过自己的日子。",
    description:
      "想到的时候记下来。该看的时候去看。需要提醒的时候收到提醒。剩下的事情，不必一直占着脑子。",
    /* 一天的时间轴，不是仪表盘（W4 §8.3）。没有完成率、连续天数、效率百分比 ——
       W4 §8.6 明确禁止，而且这一段要说的本来就是"少占一点脑子"。 */
    entries: [
      { time: "08:15", what: "想到一件事", note: "周五交高等数学第二次作业" },
      { time: "11:40", what: "课程里出现一个新要求", note: "老师说重点看第五章" },
      { time: "14:20", what: "收到一次提醒", note: "周五 · 23:59" },
      { time: "18:05", what: "打开课程页核对", note: "高等数学" },
    ],
    closing: "今天的事情，各归其位。",
  },

  closing: {
    brand: demo.brandCn,
    title: "把该记的交给拾序",
    subcopy: "从下一件小事开始。",
    cta: "开始使用",
    back: "回到前面看看",
    backTarget: "#ideas",
  },

  footer: {
    brandCn: demo.brandCn,
    brandEn: demo.brandEn,
    line: "把零散的小事，放回它该在的位置。",
    groups: [
      {
        title: "产品",
        links: [
          { label: "怎么工作", href: "#capture" },
          { label: "开始使用", href: "https://app.daymark.top", external: true },
        ],
      },
      {
        title: "关于",
        links: [
          { label: "品牌介绍", href: "#ideas" },
          { label: "更新日志", href: "https://github.com/a161858970-ux/Daymark/releases", external: true },
        ],
      },
      {
        title: "外部",
        links: [
          {
            label: "GitHub",
            href: "https://github.com/a161858970-ux/Daymark",
            external: true,
          },
          { label: "联系方式", href: "mailto:hello@daymark.top", external: true },
        ],
      },
    ],
    legal: "© 2026 Daymark",
    note: "拾序还在长大，这里也会。",
  },
} satisfies SiteCopy;
