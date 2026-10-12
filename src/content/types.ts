/**
 * Website content contract (W3 §20).
 *
 * Copy lives here, never inside scene components: language changes content,
 * not component architecture. Every surface the prototype exposes has its
 * Chinese and English version in this same shape, so the full English page can
 * be built later without touching the scenes.
 */

export type Locale = "cn" | "en";

/** Anchor destinations the site currently owns a section for. */
export type NavAnchor = "ideas" | "capture" | "day" | "about";

export interface NavCopy {
  /** Brand wordmark in Chinese; the English site shows the Latin brand only. */
  brandCn: string;
  brandEn: string;
  /** Accessible name for the home link, e.g. "拾序 Daymark 首页". */
  homeLabel: string;
  anchors: { id: NavAnchor; label: string; href: string }[];
  languageLabel: string;
  languageCn: string;
  languageEn: string;
  menuOpen: string;
  menuClose: string;
  enterApp: string;
}

export interface HeroItemCopy {
  course: string;
  title: string;
  time: string;
}

export interface HeroCopy {
  title: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  product: {
    windowLabel: string;
  };
}

export interface SmallThingsFragment {
  text: string;
  /** Content layer, not layout: 0 = peripheral, 2 = central to the metaphor. */
  weight: 0 | 1 | 2;
  /** Serif fragments give editorial contrast without a second type system. */
  serif?: boolean;
}

export interface SmallThingsCopy {
  title: string;
  description: string;
  fragments: SmallThingsFragment[];
  /** Fragments that only exist as an unresolved thought. */
  ghost: string[];
}

export type CapturePhase =
  | "EMPTY"
  | "TYPING"
  | "CAPTURED"
  | "STRUCTURING"
  | "STRUCTURED"
  | "CLARIFY";

export interface CaptureCopy {
  title: string;
  description: string;
  caption: string;
  placeholder: string;
  inputLabel: string;
  submit: string;
  reset: string;
  demoHint: string;
  statusAnnounce: Record<CapturePhase, string>;
  /** The product surface the capture lands in — same language as the app. */
  product: {
    windowLabel: string;
    pageTitle: string;
    today: string;
    sectionTitle: string;
    syncNote: string;
    moreCount: string;
  };
}

export interface FooterCopy {
  brandCn: string;
  brandEn: string;
  line: string;
  groups: { title: string; links: { label: string; href: string; external?: boolean }[] }[];
  legal: string;
  note: string;
}

/** Scene 03 — Context (W4 §3). */
export interface ContextCopy {
  title: string;
  description: string;
  /** Section index used as a light editorial cue, e.g. "03". */
  index: string;
  /** The four things that gather around the item, in the order they arrive. */
  labels: {
    course: string;
    time: string;
    content: string;
    reminder: string;
  };
  /** Shown only while the item has no context yet. */
  pending: string;
  /** What the reminder would be, once the item has one. */
  reminderValue: string;
  closing: string;
  windowLabel: string;
}

export type PlanView = "overview" | "courses" | "calendar";

/** Scene 05 — Reminder (W4 §5). */
export interface ReminderCopy {
  index: string;
  title: string;
  description: string;
  /** The label next to the object, reusing Scene 03's chip language. */
  label: string;
  /** What the reminder actually says — never a countdown (W4 §5.3). */
  value: string;
  /** The reminder surface that comes back into view. */
  surface: {
    course: string;
    when: string;
    content: string;
    /** Quiet confirmation, e.g. 提醒已设置. */
    note: string;
  };
  closing: string;
  hint: string;
}

/** Scene 06 — AI, Quietly (W4 §6, revised at review). */
export interface AiCopy {
  index: string;
  title: string;
  description: string;
  /** The ambiguous capture the demo starts from. */
  input: string;
  inputLabel: string;
  /** The one lightweight question. */
  question: string;
  /** Two answers; neither is presented as the system's decision. */
  answerConfirm: string;
  answerKeep: string;
  /**
   * What the visitor confirms — and only that.
   *
   * The demo resolves the *course*, because the course is what the sentence left
   * unstated. It does not invent a date, a requirement or any other detail: the
   * time stays the weekday the visitor wrote, and the item's content is unchanged.
   * An earlier revision turned this scene into "which Friday is that?", which both
   * failed to determine the course and asserted a specific date that the rest of
   * the page contradicted.
   */
  resolved: string;
  /** The label above the confirmed course, e.g. 已确认课程 / Course confirmed. */
  resolvedLabel: string;
  /** Shown while the ambiguity is still open: what it does *not* do. */
  pendingNote: string;
  /** Shown once the visitor has confirmed the course. */
  settledNote: string;
  /** Shown when the visitor declines to answer. */
  keptNote: string;
  /** A way back to the question — a control, not one of the two answers. */
  reopen: string;
  closing: string;
  hint: string;
  /** Accessible announcement of the demo's state. */
  status: { asking: string; resolved: string; kept: string };
}

/** Scene 08 — A Day With Daymark (W4 §8). */
export interface DayCopy {
  index: string;
  title: string;
  description: string;
  /**
   * The day as an editorial timeline, not a dashboard (W4 §8.3).
   *
   * Each entry is a time of day and what happened — no counts, no percentages, no
   * streaks. W4 §8.6 forbids metrics outright: this section exists to say that the
   * day cost the visitor less attention, not to score it.
   */
  entries: { time: string; what: string; note?: string }[];
  /** The emotional endpoint: 今天的事情，各归其位。 */
  closing: string;
}

/** Scene 09 — Closing (W4 §9). */
export interface ClosingCopy {
  /** The brand name, large, as the last thing on the page. */
  brand: string;
  title: string;
  subcopy: string;
  cta: string;
  /** A quiet second action, which goes back up the page rather than forward. */
  back: string;
  backTarget: string;
}

/** Scene 07 — Offline / Sync (W4 §7). */
export interface SyncCopy {
  index: string;
  title: string;
  description: string;
  /** Two surfaces, not a network diagram. */
  devices: { laptop: string; phone: string };
  laptop: { sectionLabel: string; meta: string };
  phone: { emptyLabel: string; meta: string };
  /** Sync state line under the pair. */
  states: { offline: string; syncing: string; synced: string };
  closing: string;
  windowLabel: string;
}

/** Scene 04 — One Item, Many Views (W4 §4). */
export interface ViewsCopy {
  title: string;
  description: string;
  index: string;
  views: Record<PlanView, { label: string; hint: string; caption: string }>;
  /** Rendered for assistive tech, where the sticky stage does not exist. */
  staticSummary: string;
  closing: string;
  windowLabel: (view: string) => string;
}

/** /download/ (2026-10-12) — the page that hands the product over. */
export interface DownloadCopy {
  eyebrow: string;
  title: string;
  lead: string;
  /** The mark on the card that matches the visitor's own device. */
  recommended: string;
  /** Version prefix; the app cards render `{currentVersion} v0.2.2`. */
  currentVersion: string;
  android: { name: string; action: string };
  windows: { name: string; action: string };
  /** The third entry; points at the app address until the web build ships. */
  web: { name: string; action: string };
  footnote: string;
  meta: { title: string; description: string };
}

export interface SiteCopy {
  locale: Locale;
  /** BCP 47 tag for <html lang>. */
  htmlLang: string;
  /** Path prefix that identifies this language surface: "" or "/en". */
  urlPrefix: string;
  skipToContent: string;
  metadata: {
    title: string;
    description: string;
    canonical: string;
  };
  nav: NavCopy;
  hero: HeroCopy;
  smallThings: SmallThingsCopy;
  capture: CaptureCopy;
  context: ContextCopy;
  views: ViewsCopy;
  reminder: ReminderCopy;
  ai: AiCopy;
  sync: SyncCopy;
  day: DayCopy;
  closing: ClosingCopy;
  download: DownloadCopy;
  footer: FooterCopy;
}
