/**
 * Showcase dataset (W3 §13, §24; W4 §21).
 *
 * These values are fictional and deterministic. The website never calls the
 * production API, reads real user data, writes to a database, or runs a real
 * language model. Refresh always returns the same story.
 *
 * The same item — 高等数学 · 周五交第二次作业 — is the narrative lead and is
 * inherited by every later scene (W4 §2). English is an independent language
 * site (W2 §2.2), so it carries its own copy of the same story rather than a
 * bilingual overlay of the Chinese one.
 */

import type { HeroItemCopy } from "./types.ts";

export interface ShowcaseStrings {
  brandCn: string;
  brandEn: string;
  nav: { overview: string; courses: string; calendar: string };
  pageTitle: string;
  today: string;
  sectionTitle: string;
  syncNote: string;
  moreCount: string;
  /** Prefix the app uses on an item's time line, e.g. 截止 / due. */
  duePrefix: string;
  captureInput: string;
  captureExamples: readonly string[];
  capture: {
    recorded: string;
    structuring: string;
    settled: string;
    fields: { course: string; time: string; content: string };
    clarifyQuestion: string;
    clarifyBody: string;
    /** What the visitor can do with the unanswered question. */
    clarifyAction: string;
    clarifyKeep: string;
  };
  /** Courses the local deterministic parser can recognise (W3 §24). */
  courses: readonly string[];
}

export interface ShowcaseSet {
  /**
   * The single demo item the whole homepage inherits (W4 §2).
   *
   * Scene 02 derives it from `sourceCapture.raw` with the local deterministic
   * parser; Scene 03 displays it as the stationary object; Scene 04 keeps the
   * exact same `title` through all three views. It is one object, not three.
   */
  mainItem: {
    course: string;
    title: string;
    /** The day it happens on, e.g. 周五 / Friday. */
    time: string;
    /** What exactly is being handed in / done. */
    detail: string;
    /**
     * The deadline line shown next to the item, e.g. 周五 · 23:59.
     *
     * It is the same day as `time` on purpose. An earlier revision carried a
     * specific date here while the rest of the page said 周五, and the two
     * contradicted each other across scenes: the calendar projection put the item
     * on Friday, the deadline line called it 10 October, and the AI scene resolved
     * the time to that date. A weekday is all this demo actually knows.
     */
    due: string;
  };
  /** Raw sentence typed into Quick Capture, and what the demo makes of it. */
  sourceCapture: {
    raw: string;
    fields: { course: string; time: string; content: string };
    title: string;
  };
  /** Overview list shown inside the hero product surface. */
  heroItems: HeroItemCopy[];
  /**
   * Other matters shown alongside the main item in Scene 04's Course and
   * Calendar projections. Same course names as the rest of the showcase.
   */
  secondaryItems: {
    course: string;
    title: string;
  }[];
  /** Scene 04's calendar projection: the day the main item lands on. */
  calendar: {
    /** Hour columns, 24h labels. */
    hours: string[];
    /** Zero-based column the main item sits in, i.e. its time of day. */
    activeHourIndex: number;
    /** Day-name row above the hours. */
    days: { label: string; active: boolean }[];
    caption: string;
  };
  /** Primary fragments for Scene 01 — designed placement, not random. */
  fragments: string[];
  /** The thought that has no position yet; it fades before the scene resolves. */
  ghostFragment: string;
}

export const showcase: Record<"cn" | "en", ShowcaseSet> = {
  cn: {
    mainItem: {
      course: "高等数学",
      title: "周五交第二次作业",
      time: "周五",
      detail: "第二次作业",
      /* Same day as `time`: one story, one weekday, no invented date. */
      due: "周五 · 23:59",
    },
    sourceCapture: {
      raw: "周五交高等数学第二次作业",
      fields: { course: "高等数学", time: "周五", content: "第二次作业" },
      title: "周五交第二次作业",
    },
    heroItems: [
      { course: "高等数学", title: "周五交第二次作业", time: "周五 · 23:59" },
      { course: "数理统计", title: "明天带电脑", time: "明天 · 10:00" },
      { course: "AI 职业与保险", title: "阅读第 4 章", time: "下周" },
    ],
    secondaryItems: [
      { course: "高等数学", title: "阅读课程资料" },
      { course: "高等数学", title: "准备课堂展示" },
    ],
    calendar: {
      /* The hour columns the item could sit in, and the one its 23:59 lands on. */
      hours: ["09", "12", "15", "18", "21", "23"],
      activeHourIndex: 5,
      days: [
        { label: "周四", active: false },
        { label: "周五", active: true },
        { label: "周六", active: false },
      ],
      caption: "周五",
    },
    fragments: ["周五交第二次作业", "明天记得带电脑", "老师说看第五章", "下周再交"],
    ghostFragment: "这件事属于哪门课？",
  },
  en: {
    mainItem: {
      course: "Advanced Mathematics",
      title: "Hand in the second assignment on Friday",
      time: "Friday",
      detail: "the second assignment",
      due: "Friday · 23:59",
    },
    sourceCapture: {
      raw: "Hand in the second advanced mathematics assignment on Friday",
      fields: { course: "advanced mathematics", time: "Friday", content: "assignment" },
      title: "Hand in the second assignment on Friday",
    },
    heroItems: [
      {
        course: "Advanced Mathematics",
        title: "Hand in the second assignment on Friday",
        time: "Friday · 23:59",
      },
      {
        course: "Mathematical Statistics",
        title: "Bring my laptop",
        time: "Tomorrow · 10:00",
      },
      {
        course: "AI, Careers and Insurance",
        title: "Read chapter 4",
        time: "Next week",
      },
    ],
    secondaryItems: [
      { course: "Advanced Mathematics", title: "Read the course material" },
      { course: "Advanced Mathematics", title: "Prepare the class presentation" },
    ],
    calendar: {
      hours: ["09", "12", "15", "18", "21", "23"],
      activeHourIndex: 5,
      days: [
        { label: "Thu", active: false },
        { label: "Fri", active: true },
        { label: "Sat", active: false },
      ],
      caption: "Friday",
    },
    fragments: [
      "Second assignment due Friday",
      "Bring my laptop tomorrow",
      "The lecturer said chapter 5",
      "Hand it in next week",
    ],
    ghostFragment: "Which course is this for?",
  },
};

export const showcaseStrings: Record<"cn" | "en", ShowcaseStrings> = {
  cn: {
    brandCn: "拾序",
    brandEn: "DAYMARK",
    nav: { overview: "事项总览", courses: "课程", calendar: "日程" },
    pageTitle: "事项总览",
    today: "今天",
    sectionTitle: "未完成",
    syncNote: "本机记录",
    moreCount: "其余事项不在展示范围内",
    duePrefix: "截止",
    captureInput: "周五交高等数学第二次作业",
    captureExamples: ["明天数理统计记得带电脑", "AI 职业与保险下周看第四章"],
    capture: {
      recorded: "已记录",
      structuring: "正在整理",
      settled: "课程、时间和事项，各归其位。",
      fields: { course: "课程", time: "时间", content: "内容" },
      clarifyQuestion: "这件事属于哪门课？",
      clarifyBody: "你还没有告诉拾序它属于哪里。它会等你确认，不会自己决定。",
      /* A third action, distinct from Scene 06's 「再看看」: this one parks the
         question rather than declining to answer it. */
      clarifyAction: "先记着，稍后再归位",
      clarifyKeep: "保持原样",
    },
    courses: ["高等数学", "数理统计", "AI 职业与保险"],
  },
  en: {
    brandCn: "拾序",
    brandEn: "DAYMARK",
    nav: { overview: "Overview", courses: "Courses", calendar: "Calendar" },
    pageTitle: "Overview",
    today: "Today",
    sectionTitle: "Not done",
    syncNote: "Saved on this device",
    moreCount: "The rest of the list stays out of the showcase",
    duePrefix: "due",
    captureInput: "Hand in the second advanced mathematics assignment on Friday",
    captureExamples: [
      "Bring my laptop to statistics tomorrow",
      "Read chapter 4 for AI, careers and insurance next week",
    ],
    capture: {
      recorded: "Recorded",
      structuring: "Sorting it out",
      settled: "Course, time and item, each in its place.",
      fields: { course: "Course", time: "Time", content: "Content" },
      clarifyQuestion: "Which course does this belong to?",
      clarifyBody:
        "You haven't told Daymark where it belongs. It waits for you instead of deciding.",
      clarifyAction: "Keep it for later",
      clarifyKeep: "Leave it as it is",
    },
    courses: [
      "advanced mathematics",
      "mathematical statistics",
      "AI, careers and insurance",
    ],
  },
};
