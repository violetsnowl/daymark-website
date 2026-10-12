import type { SiteCopy } from "./types.ts";
import { showcase, showcaseStrings } from "./demo.ts";

const demo = showcaseStrings.en;

/**
 * English content system (W4 §14).
 *
 * English is a complete alternate-language site, not a bilingual overlay: this
 * file never appears on `/`, and `/en/` never shows Chinese copy beside it.
 * The wording is written as native copy rather than a literal translation of
 * the Chinese, and it still needs its own polish pass before V2 lock.
 */
export const en = {
  locale: "en",
  htmlLang: "en",
  urlPrefix: "/en",
  skipToContent: "Skip to main content",

  metadata: {
    title: "Daymark — a quieter place for course life",
    description:
      "Daymark is a course and task manager built for university life. Record it now, and let courses, times and reminders fall into place.",
    canonical: "https://daymark.top/en/",
  },

  nav: {
    /* The English surface shows the Latin brand only — no Chinese wordmark
       beside it (W2 §2.4: no decorative bilingual pairing). */
    brandCn: "",
    brandEn: demo.brandEn,
    homeLabel: "Daymark home",
    /* Page order, mirroring the Chinese nav (2026-10-11 review P2-3). */
    anchors: [
      { id: "ideas", label: "Ideas", href: "#ideas" },
      { id: "capture", label: "How it works", href: "#capture" },
      { id: "day", label: "A day", href: "#day" },
      { id: "about", label: "About", href: "#about" },
    ],
    languageLabel: "Language",
    languageCn: "中文",
    languageEn: "English",
    menuOpen: "Open menu",
    menuClose: "Close menu",
    enterApp: "Open Daymark",
  },

  hero: {
    title: "Put the small things back where they belong.",
    description:
      "Daymark is a course and task manager built for university life. Record it the moment it occurs to you, and let courses, times and reminders find their place.",
    primaryCta: "Start using",
    secondaryCta: "See how it works",
    product: {
      windowLabel: "Illustration of the Daymark interface: overview",
    },
  },

  smallThings: {
    title: "The things you forget are rarely the big ones.",
    description:
      "“Second assignment due Friday.” “Bring the handout tomorrow.” “The lecturer said chapter 5.” “Hand it in next week.” None of it is large — it just scatters across courses, chats, memory and calendars.",
    fragments: [
      { text: showcase.en.fragments[0], weight: 2 },
      { text: showcase.en.fragments[1], weight: 2 },
      { text: showcase.en.fragments[2], weight: 1, serif: true },
      { text: showcase.en.fragments[3], weight: 0 },
    ],
    ghost: [showcase.en.ghostFragment],
  },

  capture: {
    title: "Record it first.",
    description: "You shouldn't have to decide where a thing belongs before writing it down.",
    caption: "Recording it should not become another thing to manage.",
    placeholder: "Write down one thing…",
    inputLabel: "Quick capture content",
    submit: "Record",
    reset: "Try again",
    demoHint: "This is a local demo. Nothing here is written to real data.",
    statusAnnounce: {
      EMPTY: "Waiting for input",
      TYPING: "Typing",
      CAPTURED: `Recorded: ${demo.captureInput}`,
      STRUCTURING: "Sorting it out",
      STRUCTURED: "Sorted: course, time and content are in place",
      CLARIFY: "Recorded, but it has no course yet and needs your confirmation",
    },
    product: {
      windowLabel: "Illustration of the Daymark interface: a settled item",
      pageTitle: demo.pageTitle,
      today: demo.today,
      sectionTitle: demo.sectionTitle,
      syncNote: demo.syncNote,
      moreCount: demo.moreCount,
    },
  },

  context: {
    title: "An item shouldn't be only what needs doing.",
    description:
      "Which course it belongs to, when it happens, when it should remind you — all of that belongs with it.",
    index: "03",
    labels: {
      course: "Course",
      time: "Time",
      content: "Content",
      reminder: "Reminder",
    },
    pending: "Not set",
    reminderValue: "Friday · 23:59",
    closing: "What you recorded is not just the content. It is the context too.",
    windowLabel: "Illustration of the Daymark interface: one item and its context",
  },

  views: {
    title: "One thing, seen from another place.",
    description:
      "Overview, Courses and Calendar are not three sets of data. They are three ways of seeing the same thing.",
    index: "04",
    views: {
      overview: {
        label: "Overview",
        hint: "It sits among the other things still open today.",
        caption: "In Overview, it is one of today's unfinished things.",
      },
      courses: {
        label: "Courses",
        hint: "It sits under its course, next to the rest of that course's work.",
        caption: "In Courses, it belongs to this course.",
      },
      calendar: {
        label: "Calendar",
        hint: "It appears on the day it actually happens.",
        caption: "In Calendar, it happens on Friday.",
      },
    },
    staticSummary:
      "The same item — Advanced Mathematics · Hand in the second assignment on Friday — occupies a different place in Overview, Courses and Calendar, but it is always the same item.",
    closing: "Not copied. Looked at from another angle.",
    windowLabel: (view) => `Illustration of the Daymark interface: the same item in ${view}`,
  },

  reminder: {
    index: "05",
    title: "Some things you shouldn't have to keep holding.",
    description:
      "When the moment comes, Daymark brings what you already recorded back to you.",
    label: "Reminder",
    value: "Friday · 23:59",
    surface: {
      course: "Advanced Mathematics",
      when: "Friday · 23:59",
      content: "the second assignment",
      note: "Reminder set",
    },
    closing: "So you can set it down for now.",
    hint: "This reminder comes from the same local demo.",
  },

  ai: {
    index: "06",
    title: "AI, only when it is needed.",
    description:
      "It doesn't plan your life and it doesn't decide for you. When something isn't clear enough yet, it helps you make it a little clearer.",
    input: "Hand in the assignment on Friday",
    inputLabel: "Demo input",
    question: "Which course is this for?",
    answerConfirm: "Advanced Mathematics",
    answerKeep: "Not yet",
    resolved: "Advanced Mathematics",
    resolvedLabel: "Course confirmed",
    pendingNote: "No course yet. The time stays the Friday you wrote.",
    settledNote: "The course is settled. Time and item are left exactly as they were.",
    keptNote: "Left as it is, until you decide. It will not pick a course for you.",
    reopen: "Answer again",
    closing: "It clears up what is unclear. It does not make the decision for you.",
    hint: "Both answers are clickable, and both stay in your browser.",
    status: {
      asking: "One question needs your confirmation",
      resolved: "Course confirmed",
      kept: "Left as it is",
    },
  },

  sync: {
    index: "07",
    title: "Offline is not a reason to wait.",
    description: "Record as usual while offline. Sync quietly once you're back.",
    devices: { laptop: "Laptop", phone: "Phone" },
    laptop: {
      sectionLabel: "Just recorded",
      meta: "Advanced Mathematics · due Friday · 23:59",
    },
    phone: {
      emptyLabel: "Not synced here yet",
      meta: "Advanced Mathematics · due Friday · 23:59",
    },
    states: { offline: "Recording offline", syncing: "Syncing", synced: "Synced" },
    closing: "Once it has synced, the connection itself stops mattering.",
    windowLabel: "The same item on two devices",
  },

  day: {
    index: "08",
    title: "In the end, you just get on with your day.",
    description:
      "Record it when it occurs to you. Look when you need to. Get a reminder when the moment comes. The rest doesn't have to keep occupying your head.",
    /* A day as a timeline, not a dashboard (W4 §8.3). No completion rate, no streak,
       no efficiency number — W4 §8.6 rules those out, and the point of the section is
       that the day cost less attention, not that it scored well. Native English copy,
       not a translation of the Chinese. */
    entries: [
      { time: "08:15", what: "Something comes to mind", note: "Hand in the second assignment on Friday" },
      { time: "11:40", what: "A new requirement appears in class", note: "The lecturer said to focus on chapter 5" },
      { time: "14:20", what: "A reminder arrives", note: "Friday · 23:59" },
      { time: "18:05", what: "Open the course page to check", note: "Advanced Mathematics" },
    ],
    closing: "The day's things are where they belong.",
  },

  closing: {
    brand: demo.brandEn,
    title: "Leave the things worth remembering to Daymark.",
    subcopy: "Start with the next small thing.",
    cta: "Open Daymark",
    back: "Look back over it",
    backTarget: "#ideas",
  },

  download: {
    eyebrow: "Download",
    title: "Download Daymark",
    lead: "Leave the things worth remembering to Daymark — starting with your device.",
    recommended: "Recommended for your device",
    currentVersion: "Latest",
    android: {
      name: "Android",
      note: "An APK package — install it and follow the system prompts.",
      action: "Download for Android",
    },
    windows: {
      name: "Windows",
      note: "An installer (.exe) — download it, then run it.",
      action: "Download for Windows",
    },
    web: {
      name: "Web",
      note: "Use it right in your browser — nothing to install.",
      badge: "Coming soon",
    },
    footnote: "Sign in to the same account and everything stays in sync.",
    meta: {
      title: "Download Daymark",
      description:
        "Download Daymark for Windows or Android — and put the small things back where they belong.",
    },
  },

  footer: {
    brandCn: "",
    brandEn: demo.brandEn,
    line: "A quieter place for the small things you shouldn't have to remember.",
    groups: [
      {
        title: "Product",
        links: [
          { label: "How it works", href: "#capture" },
          { label: "Start using", href: "https://app.daymark.top", external: true },
        ],
      },
      {
        title: "About",
        links: [
          { label: "What it is", href: "#ideas" },
          {
            label: "Changelog",
            href: "https://github.com/violetsnowl/Daymark/releases",
            external: true,
          },
        ],
      },
      {
        title: "Elsewhere",
        links: [
          {
            label: "GitHub",
            href: "https://github.com/violetsnowl/Daymark",
            external: true,
          },
          { label: "Contact", href: "mailto:hello@daymark.top", external: true },
        ],
      },
    ],
    legal: "© 2026 Daymark",
    note: "Daymark is growing, and so is this page.",
  },
} satisfies SiteCopy;
